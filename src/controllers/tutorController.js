// src/controllers/tutorController.js
import Tutor from '../models/Tutor.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Message from '../models/Message.js';
import SessionJoinRequest from '../models/SessionJoinRequest.js';
import { sendSuccess, sendError } from '../middleware/responseHandler.js';
import { getOrCreatePermanentGoogleMeetLink } from '../services/googleMeetService.js';

// --- Profile Management ---
export const getMyProfile = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ userId: req.user._id }).populate('userId', 'name email role');
    return sendSuccess(res, tutor);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_PROFILE_FAILED', 500);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { bio, subjects, hourlyRate, availability } = req.body;
    const tutor = await Tutor.findOneAndUpdate(
      { userId: req.user._id },
      { bio, subjects, hourlyRate, availability },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, tutor);
  } catch (error) {
    return sendError(res, error.message, 'UPDATE_PROFILE_FAILED', 500);
  }
};

// --- Session Scheduling ---
export const createSession = async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      courseId,
      startTime,
      endTime,
      maxParticipants,
      // FIX: Accept meetingLink from frontend (already created by googleMeetService)
      // If frontend sends a pre-generated link, use it directly.
      // Only auto-generate if no link was provided AND Google is connected.
      meetingLink: clientMeetingLink,
      meetingProvider,
      meetingId: clientMeetingId,
    } = req.body;

    let meetingLink = clientMeetingLink || null;
    let meetingId = clientMeetingId || null;

    // Only auto-generate a Meet link if:
    // - frontend didn't already provide one
    // - tutor has Google OAuth connected
    if (!meetingLink && req.tutor.googleOAuthRefreshToken) {
      try {
        const durationMinutes = startTime && endTime
          ? Math.max(1, Math.ceil((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000))
          : 60;

        const permanentLink = await getOrCreatePermanentGoogleMeetLink({
          tutorId: req.tutor._id,
          meetingTitle: title || subject || 'Tutor Session',
          scheduledTime: startTime,
          durationMinutes
        });

        meetingLink = permanentLink.joinUrl || null;
        meetingId = permanentLink.meetingId || null;
      } catch (meetErr) {
        // Don't fail session creation if Meet link generation fails
        console.error('Google Meet auto-generation failed (non-fatal):', meetErr.message);
      }
    }

    const session = await Session.create({
      title,
      subject,
      description: description || '',
      courseId: courseId || undefined,
      tutorId: req.tutor._id,
      startTime,
      endTime,
      meetingLink: meetingLink || undefined,
      meetingProvider: meetingLink ? (meetingProvider || 'google_meet') : undefined,
      meetingId: meetingId || undefined,
      maxParticipants: maxParticipants || 1,
    });

    return sendSuccess(res, session, 201);
  } catch (error) {
    return sendError(res, error.message, 'CREATE_SESSION_FAILED', 500);
  }
};

export const getSessions = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = { tutorId: req.tutor._id };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .populate('courseId')
      .populate('studentIds', 'name email')
      .sort({ startTime: -1 });
    return sendSuccess(res, sessions);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_SESSIONS_FAILED', 500);
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutorId: req.tutor._id })
      .populate('courseId')
      .populate('studentIds', 'name email avatar');
    if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);
    return sendSuccess(res, session);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_SESSION_FAILED', 500);
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutorId: req.tutor._id });
    if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);

    // Add meetingProvider and meetingId to allowedFields
    const allowedFields = ['title', 'subject', 'description', 'startTime', 'endTime', 'maxParticipants', 'meetingLink', 'meetingProvider', 'meetingId', 'status', 'courseId'];
    allowedFields.forEach(key => {
      if (req.body[key] !== undefined) {
        session[key] = req.body[key];
      }
    });

    await session.save();
    return sendSuccess(res, session);
  } catch (error) {
    return sendError(res, error.message, 'UPDATE_SESSION_FAILED', 500);
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutorId: req.tutor._id });
    if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);

    if (session.studentIds.length > 0) {
      return sendError(res, 'Cannot delete session with enrolled students', 'DELETE_SESSION_RESTRICTED', 400);
    }

    await session.deleteOne();
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error.message, 'DELETE_SESSION_FAILED', 500);
  }
};

export const getSessionRequests = async (req, res) => {
  try {
    // If sessionId is provided, filter by it, otherwise get all requests for tutor's sessions
    const { sessionId } = req.params;
    const { status } = req.query;

    let sessionIds = [];
    if (sessionId) {
      const session = await Session.findOne({ _id: sessionId, tutorId: req.tutor._id });
      if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);
      sessionIds = [session._id];
    } else {
      const sessions = await Session.find({ tutorId: req.tutor._id }).select('_id');
      sessionIds = sessions.map(s => s._id);
    }

    const query = { sessionId: { $in: sessionIds } };
    if (status) query.status = status;

    const requests = await SessionJoinRequest.find(query)
      .populate('learnerId', 'name email')
      .populate('sessionId', 'title startTime')
      .sort({ createdAt: -1 });

    const data = requests.map(request => ({
      requestId: request._id,
      sessionId: request.sessionId?._id || request.sessionId,
      sessionTitle: request.sessionId?.title,
      learnerId: request.learnerId?._id || request.learnerId,
      learnerName: request.learnerId?.name,
      status: request.status,
      createdAt: request.createdAt
    }));

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_SESSION_REQUESTS_FAILED', 500);
  }
};

export const approveSessionRequest = async (req, res) => {
  try {
    const { sessionId, requestId } = req.params;

    // 1. Find the request first to get sessionId if it's missing from params
    const request = await SessionJoinRequest.findById(requestId);
    if (!request) return sendError(res, 'Join request not found', 'REQUEST_NOT_FOUND', 404);

    // 2. Verify session ownership (either using provided sessionId or request.sessionId)
    const sid = sessionId || request.sessionId;
    const session = await Session.findOne({ _id: sid, tutorId: req.tutor._id });
    if (!session) return sendError(res, 'Session not found or access denied', 'SESSION_NOT_FOUND', 404);

    // 3. Perform business logic
    const isStudent = (session.studentIds || []).some(id => id.toString() === request.learnerId.toString());
    if (!isStudent && session.maxParticipants && session.studentIds.length >= session.maxParticipants) {
      return sendError(res, 'Session is full', 'SESSION_FULL', 409);
    }

    if (!isStudent) {
      session.studentIds = session.studentIds || [];
      session.studentIds.push(request.learnerId);
      await session.save();
    }

    request.status = 'approved';
    await request.save();

    return sendSuccess(res, { requestId: request._id, status: 'approved' });
  } catch (error) {
    return sendError(res, error.message, 'APPROVE_SESSION_REQUEST_FAILED', 500);
  }
};

export const rejectSessionRequest = async (req, res) => {
  try {
    const { sessionId, requestId } = req.params;

    // 1. Find the request
    const request = await SessionJoinRequest.findById(requestId);
    if (!request) return sendError(res, 'Join request not found', 'REQUEST_NOT_FOUND', 404);

    // 2. Verify session ownership
    const sid = sessionId || request.sessionId;
    const session = await Session.findOne({ _id: sid, tutorId: req.tutor._id });
    if (!session) return sendError(res, 'Session not found or access denied', 'SESSION_NOT_FOUND', 404);

    // 3. Remove from studentIds if they were there (just in case)
    session.studentIds = (session.studentIds || []).filter(
      id => id.toString() !== request.learnerId.toString()
    );
    await session.save();

    request.status = 'rejected';
    await request.save();

    return sendSuccess(res, { requestId: request._id, status: 'rejected' });
  } catch (error) {
    return sendError(res, error.message, 'REJECT_SESSION_REQUEST_FAILED', 500);
  }
};

// --- Student Management ---
export const getMyStudents = async (req, res) => {
  try {
    const sessions = await Session.find({ tutorId: req.tutor._id }).populate('studentIds', 'name email');
    const studentsMap = new Map();

    sessions.forEach(session => {
      session.studentIds.forEach(student => {
        studentsMap.set(student._id.toString(), student);
      });
    });

    return sendSuccess(res, Array.from(studentsMap.values()));
  } catch (error) {
    return sendError(res, error.message, 'FETCH_STUDENTS_FAILED', 500);
  }
};

export const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const sessions = await Session.find({
      tutorId: req.tutor._id,
      studentIds: studentId
    }).populate('courseId');

    return sendSuccess(res, {
      studentId,
      sessionHistory: sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    return sendError(res, error.message, 'FETCH_PROGRESS_FAILED', 500);
  }
};

// --- Performance Analytics ---
export const getAnalyticsOverview = async (req, res) => {
  try {
    const totalEarnings = req.tutor.earnings;
    const activeSessions = await Session.countDocuments({ tutorId: req.tutor._id, status: 'scheduled' });

    const sessions = await Session.find({ tutorId: req.tutor._id });
    const studentsSet = new Set();
    sessions.forEach(s => s.studentIds.forEach(id => studentsSet.add(id.toString())));

    return sendSuccess(res, {
      totalEarnings,
      activeSessions,
      totalStudents: studentsSet.size,
      avgRating: req.tutor.rating
    });
  } catch (error) {
    return sendError(res, error.message, 'FETCH_ANALYTICS_FAILED', 500);
  }
};

export const getEarningsAnalytics = async (req, res) => {
  try {
    const payments = await Payment.find({ tutorId: req.tutor._id, type: 'credit', status: 'completed' });
    return sendSuccess(res, payments);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_EARNINGS_FAILED', 500);
  }
};

// --- Reviews & Feedback ---
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.tutor._id }).populate('studentId', 'name');
    return sendSuccess(res, reviews);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_REVIEWS_FAILED', 500);
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { responseText } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, tutorId: req.tutor._id },
      { responseText },
      { new: true }
    );
    if (!review) return sendError(res, 'Review not found', 'REVIEW_NOT_FOUND', 404);
    return sendSuccess(res, review);
  } catch (error) {
    return sendError(res, error.message, 'RESPOND_REVIEW_FAILED', 500);
  }
};

export const getReviewAnalytics = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.tutor._id });
    const sentiment = {
      positive: reviews.filter(r => r.rating >= 4).length,
      neutral: reviews.filter(r => r.rating === 3).length,
      negative: reviews.filter(r => r.rating <= 2).length,
    };
    return sendSuccess(res, { reviews, sentiment });
  } catch (error) {
    return sendError(res, error.message, 'FETCH_REVIEW_ANALYTICS_FAILED', 500);
  }
};

// --- Messaging ---
export const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }]
    }).sort({ createdAt: 1 })
      .populate('senderId', 'name email avatar')
      .populate('receiverId', 'name email avatar');

    const conversationsMap = new Map();
    messages.forEach(msg => {
      let student = null;
      if (String(msg.senderId._id) !== String(myId)) student = msg.senderId;
      if (String(msg.receiverId._id) !== String(myId)) student = msg.receiverId;
      if (!student) return;

      const key = String(student._id);
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, { student, messages: [], lastMessage: '', timestamp: '', unread: 0 });
      }
      conversationsMap.get(key).messages.push({
        id: msg._id,
        text: msg.message,
        sender: String(msg.senderId._id) === String(myId) ? 'tutor' : 'student',
        timestamp: msg.createdAt,
        read: msg.isRead
      });
    });

    conversationsMap.forEach(conv => {
      if (conv.messages.length > 0) {
        const lastMsg = conv.messages[conv.messages.length - 1];
        conv.lastMessage = lastMsg.text;
        conv.timestamp = lastMsg.timestamp;
        conv.unread = conv.messages.filter(m => !m.read && m.sender === 'student').length;
      }
    });

    return sendSuccess(res, Array.from(conversationsMap.values()));
  } catch (error) {
    return sendError(res, error.message, 'FETCH_CONVERSATIONS_FAILED', 500);
  }
};

export const getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId }
      ]
    }).sort({ createdAt: 1 });
    return sendSuccess(res, messages);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_MESSAGES_FAILED', 500);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      message
    });
    return sendSuccess(res, newMessage, 201);
  } catch (error) {
    return sendError(res, error.message, 'SEND_MESSAGE_FAILED', 500);
  }
};
