import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipientType: { type: String, enum: ['client', 'coach', 'admin'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Null if sent to all Admins
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String } // e.g. 'diet_uploaded', 'session_request', 'session_approved', 'weekly_reminder', etc.
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
