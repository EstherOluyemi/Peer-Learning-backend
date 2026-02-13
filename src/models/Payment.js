import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'payout'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  referenceId: { type: String }, // SessionId or TransactionId
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
