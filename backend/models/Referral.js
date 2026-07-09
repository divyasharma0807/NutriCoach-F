import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, default: '' },
  age: { type: String, default: '' },
  gender: { type: String, default: '' },
  weightRange: { type: String, default: '' },
  interest: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Referral', ReferralSchema);
