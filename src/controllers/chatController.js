// src/controllers/chatController.js
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Tutor from '../models/Tutor.js';
import { sendSuccess, sendError } from '../middleware/responseHandler.js';
import { broadcast, emitToConversation } from '../services/wsService.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatParticipant = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null
});

const formatConversation = (conv, myId) => ({
    _id: conv._id,
    participants: (conv.participants || []).map(p =>
        p._id ? formatParticipant(p) : { _id: p }
    ),
    lastMessage: conv.lastMessage || '',
    lastMessageAt: conv.lastMessageAt || null,
    unread: conv.unreadCounts?.get?.(myId.toString()) ?? 0,
    createdAt: conv.createdAt
});

const formatMessage = (msg) => ({
    _id: msg._id,
    conversationId: msg.conversationId,
    sender: msg.senderId?._id
        ? { _id: msg.senderId._id, name: msg.senderId.name, avatar: msg.senderId.avatar || null }
        : { _id: msg.senderId },
    text: msg.text,
    read: msg.read,
    createdAt: msg.createdAt
});

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /v1/chat/conversations
 * Returns all conversations for the logged-in user.
 */
export const getConversations = async (req, res) => {
    try {
        const myId = req.user._id;
        const conversations = await Conversation.find({ participants: myId })
            .populate('participants', 'name email role avatar')
            .sort({ lastMessageAt: -1 });

        return sendSuccess(res, conversations.map(c => formatConversation(c, myId)));
    } catch (error) {
        return sendError(res, error.message, 'FETCH_CONVERSATIONS_FAILED', 500);
    }
};

/**
 * GET /v1/chat/conversations/:conversationId/messages?page=1&limit=50
 * Returns paginated messages (oldest→newest).
 */
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const myId = req.user._id;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 50));

        // Verify the user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return sendError(res, 'Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
        if (!conversation.participants.some(p => p.toString() === myId.toString())) {
            return sendError(res, 'Access denied', 'FORBIDDEN', 403);
        }

        const total = await ChatMessage.countDocuments({ conversationId });
        const messages = await ChatMessage.find({ conversationId })
            .populate('senderId', 'name avatar')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return sendSuccess(res, {
            messages: messages.map(formatMessage),
            hasMore: page * limit < total,
            total
        });
    } catch (error) {
        return sendError(res, error.message, 'FETCH_MESSAGES_FAILED', 500);
    }
};

/**
 * POST /v1/chat/conversations
 * Idempotent: find-or-create a 1-to-1 conversation.
 */
export const createConversation = async (req, res) => {
    try {
        const myId = req.user._id;
        const { recipientId } = req.body;

        if (!recipientId) return sendError(res, 'recipientId is required', 'VALIDATION_ERROR', 400);
        if (recipientId.toString() === myId.toString()) {
            return sendError(res, 'Cannot start a conversation with yourself', 'VALIDATION_ERROR', 400);
        }

        const recipient = await User.findById(recipientId).select('name email role avatar');
        if (!recipient) return sendError(res, 'Recipient not found', 'RECIPIENT_NOT_FOUND', 404);

        // Sort IDs so the pair is order-agnostic
        const sorted = [myId.toString(), recipientId.toString()].sort();

        // Try to find existing conversation
        const existing = await Conversation.findOne({
            participants: { $all: sorted, $size: 2 }
        }).populate('participants', 'name email role avatar');

        if (existing) {
            return sendSuccess(res, formatConversation(existing, myId), 200);
        }

        // Create new
        const conv = await Conversation.create({ participants: sorted });
        const populated = await Conversation.findById(conv._id).populate('participants', 'name email role avatar');

        // Notify recipient via WS
        broadcast(recipientId.toString(), 'conversation:new', formatConversation(populated, recipientId));

        return sendSuccess(res, formatConversation(populated, myId), 201);
    } catch (error) {
        return sendError(res, error.message, 'CREATE_CONVERSATION_FAILED', 500);
    }
};

/**
 * POST /v1/chat/conversations/:conversationId/messages
 * HTTP fallback for sending a message.
 */
export const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const myId = req.user._id;
        const { text } = req.body;

        if (!text?.trim()) return sendError(res, 'text is required', 'VALIDATION_ERROR', 400);

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return sendError(res, 'Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
        if (!conversation.participants.some(p => p.toString() === myId.toString())) {
            return sendError(res, 'Access denied', 'FORBIDDEN', 403);
        }

        const msg = await ChatMessage.create({ conversationId, senderId: myId, text: text.trim() });
        const sender = await User.findById(myId).select('name avatar');

        // Update conversation denorm
        const recipientId = conversation.participants.find(p => p.toString() !== myId.toString());
        const unreadCounts = conversation.unreadCounts || new Map();
        if (recipientId) {
            unreadCounts.set(recipientId.toString(), (unreadCounts.get(recipientId.toString()) || 0) + 1);
        }
        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = msg.createdAt;
        conversation.unreadCounts = unreadCounts;
        await conversation.save();

        const formatted = formatMessage({ ...msg.toObject(), senderId: sender });

        // Push WS event to recipient
        if (recipientId) {
            broadcast(recipientId.toString(), 'message:new', { conversationId, message: formatted });
        }

        return sendSuccess(res, formatted, 201);
    } catch (error) {
        return sendError(res, error.message, 'SEND_MESSAGE_FAILED', 500);
    }
};

/**
 * PATCH /v1/chat/conversations/:conversationId/read
 * Mark all messages from others as read; reset unread count.
 */
export const markRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const myId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return sendError(res, 'Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
        if (!conversation.participants.some(p => p.toString() === myId.toString())) {
            return sendError(res, 'Access denied', 'FORBIDDEN', 403);
        }

        await ChatMessage.updateMany(
            { conversationId, senderId: { $ne: myId }, read: false },
            { read: true }
        );

        const unreadCounts = conversation.unreadCounts || new Map();
        unreadCounts.set(myId.toString(), 0);
        conversation.unreadCounts = unreadCounts;
        await conversation.save();

        // Notify sender that their messages were read
        await emitToConversation(conversationId, myId, 'message:read', { conversationId });

        return sendSuccess(res, { ok: true });
    } catch (error) {
        return sendError(res, error.message, 'MARK_READ_FAILED', 500);
    }
};

/**
 * GET /v1/chat/contacts
 * Tutors → students across their sessions + all other tutors.
 * Learners → tutors of sessions they're in + all other learners.
 */
export const getContacts = async (req, res) => {
    try {
        const myId = req.user._id;
        const myRole = req.user.role;

        const contactSet = new Map(); // userId string → User doc

        const addUser = (user) => {
            if (user && user._id.toString() !== myId.toString()) {
                contactSet.set(user._id.toString(), user);
            }
        };

        if (myRole === 'tutor') {
            // All students enrolled in this tutor's sessions
            const tutorRecord = await Tutor.findOne({ userId: myId });
            if (tutorRecord) {
                const sessions = await Session.find({ tutorId: tutorRecord._id })
                    .populate('studentIds', 'name email role avatar');
                sessions.forEach(s => s.studentIds.forEach(addUser));
            }
            // All other tutors (via User collection)
            const tutors = await User.find({ role: 'tutor', _id: { $ne: myId } }).select('name email role avatar');
            tutors.forEach(addUser);
        } else {
            // Learner: tutors of sessions they're enrolled in
            const sessions = await Session.find({ studentIds: myId })
                .populate({ path: 'tutorId', populate: { path: 'userId', select: 'name email role avatar' } });
            sessions.forEach(s => {
                if (s.tutorId?.userId?._id) addUser(s.tutorId.userId);
            });
            // All other learners
            const learners = await User.find({ role: 'student', _id: { $ne: myId } }).select('name email role avatar');
            learners.forEach(addUser);
        }

        const contacts = Array.from(contactSet.values()).map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar || null
        }));

        return sendSuccess(res, contacts);
    } catch (error) {
        return sendError(res, error.message, 'FETCH_CONTACTS_FAILED', 500);
    }
};
