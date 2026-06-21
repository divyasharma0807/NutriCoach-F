import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String }, // client added by coach won't have a password initially
  role: { type: String, default: 'client' },
  city: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: '' },
  clientPlan: { type: String, default: '' }, // e.g. 'Basic', 'Premium', 'Elite'
  coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', default: null },
  coachName: { type: String, default: '' }, // Denormalized/fallback field as in UI
  activeGoal: { type: String, default: '' },
  height: { type: Number },
  heightUnit: { type: String, enum: ['cm', 'ft'], default: 'cm' },
  weightUnit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
  subscriptionStartDate: { type: Date, default: null },
  subscriptionExpiryDate: { type: Date, default: null },
  profileComplete: { type: Boolean, default: false },
  profilePhoto: {
    secure_url: { type: String, default: null },
    public_id: { type: String, default: null }
  },
  medicalPdf: {
    secure_url: { type: String, default: null },
    public_id: { type: String, default: null }
  },
  allergies: { type: String, default: '' },
}, { timestamps: true });

// Transform to string URL in JSON response for frontend compatibility
ClientSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.profilePhoto && ret.profilePhoto.secure_url) {
      ret.profilePhoto = ret.profilePhoto.secure_url;
    } else {
      ret.profilePhoto = null;
    }
    if (ret.medicalPdf && ret.medicalPdf.secure_url) {
      ret.medicalPdf = ret.medicalPdf.secure_url;
    } else {
      ret.medicalPdf = null;
    }
    return ret;
  }
});

// Hash password before saving if present and modified
ClientSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
ClientSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Client', ClientSchema);
