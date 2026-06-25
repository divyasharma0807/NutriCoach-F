import mongoose from 'mongoose';

const ProspectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  city: { type: String, default: '' },
  age: { type: String, default: '' },
  gender: { type: String, default: '' },
  weightRange: { type: String, default: '' },
  addedByCoach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', default: null }
}, { timestamps: true });

export default mongoose.model('Prospect', ProspectSchema);
