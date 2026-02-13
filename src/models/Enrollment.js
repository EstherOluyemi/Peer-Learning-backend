import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
