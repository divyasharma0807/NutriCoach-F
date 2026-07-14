import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const CoachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'coach' },
  level: { type: String, default: 'Coach' }, // 'Senior Coach', 'Coach'
  city: { type: String, default: '' },
  gender: { type: String, default: '' },
  experience: { type: String, default: '' },
  activeStatus: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  seniorCoach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', default: null },
  notificationTokens: [
    {
      token: { type: String, required: true },
      device: { type: String, default: '' },
      browser: { type: String, default: '' },
      platform: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  notificationSettings: {
    pushEnabled: { type: Boolean, default: true },
    sessions: { type: Boolean, default: true },
    dietPlans: { type: Boolean, default: true },
    results: { type: Boolean, default: true },
    subscriptions: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Hash password before saving
CoachSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
CoachSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('Coach', CoachSchema);
