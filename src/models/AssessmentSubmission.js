import mongoose from 'mongoose';

const assessmentSubmissionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Referencing an Assessment which might be defined elsewhere
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submissionUrl: String,
  grade: Number,
  feedback: String,
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const AssessmentSubmission = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema);
export default AssessmentSubmission;
