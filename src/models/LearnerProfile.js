import mongoose from 'mongoose';

const learnerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  interests: [String],
  learningGoals: [String],
  totalStudyHours: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
}, { timestamps: true });

const LearnerProfile = mongoose.model('LearnerProfile', learnerProfileSchema);
export default LearnerProfile;
