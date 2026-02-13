import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedModules: [String],
  lastAccessed: { type: Date },
  completionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
