import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  organizerRole: { type: String, enum: ['coach', 'client', 'admin'], required: true },
  coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  parentCoachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', default: null },
  participants: [{ type: mongoose.Schema.Types.ObjectId }],
  date: { type: String, required: true },
  time: { type: String, required: true },
  title: { type: String, default: 'Session' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

export default mongoose.model('Session', SessionSchema);
