import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  time: { type: String, required: true }, // Format: "HH:MM AM/PM" or slot name
  status: { type: String, enum: ['pending_approval', 'approved', 'rejected'], default: 'pending_approval' },
  scheduledBy: { type: String, enum: ['coach', 'client'], required: true }
}, { timestamps: true });

export default mongoose.model('Session', SessionSchema);
