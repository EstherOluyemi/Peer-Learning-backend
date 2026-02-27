// src/models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    // Always exactly 2 participants for 1-to-1 chat
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
    // Tracks unread count per participant: { "<userId>": <count> }
    unreadCounts: { type: Map, of: Number, default: {} }
}, { timestamps: true });

// Ensure only one conversation exists per pair of participants
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
