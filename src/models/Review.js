import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  responseText: { type: String },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
