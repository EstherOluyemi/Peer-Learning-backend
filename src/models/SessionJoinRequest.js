import mongoose from 'mongoose';

const sessionJoinRequestSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

sessionJoinRequestSchema.index({ sessionId: 1, learnerId: 1 }, { unique: true });
sessionJoinRequestSchema.index({ tutorId: 1, status: 1 });

const SessionJoinRequest = mongoose.model('SessionJoinRequest', sessionJoinRequestSchema);
export default SessionJoinRequest;
