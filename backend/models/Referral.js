import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  city: { type: String, default: '', required: false },
  age: { type: String, default: '', required: false },
  gender: { type: String, default: '', required: false },
  weightRange: { type: String, default: '', required: false },
  interest: { type: String, default: '', required: false }
}, { timestamps: true });

export default mongoose.model('Referral', ReferralSchema);
