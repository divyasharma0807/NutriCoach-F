import mongoose from 'mongoose';

const ProspectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true, unique: true },
  city: { type: String, default: '', required: true },
  age: { type: String, default: '', required: true },
  gender: { type: String, default: '', required: true },
  weightRange: { type: String, default: '', required: true },
  addedByCoach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', default: null }
}, { timestamps: true });

export default mongoose.model('Prospect', ProspectSchema);
