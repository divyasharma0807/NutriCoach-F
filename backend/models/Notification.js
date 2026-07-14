import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipientType: { type: String, enum: ['client', 'coach', 'admin'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Null if sent to all Admins
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String }, // e.g. 'diet_uploaded', 'session_request', 'session_approved', 'weekly_reminder', etc.
  relatedMeetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
  senderId: { type: mongoose.Schema.Types.ObjectId, default: null },
  senderRole: { type: String, default: '' },
  senderName: { type: String, default: '' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  priority: { type: String, default: 'normal' },
  entityType: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

NotificationSchema.post('save', async function(doc) {
  try {
    const { sendPushForNotification } = await import('../utils/firebase.js');
    await sendPushForNotification(doc);
  } catch (error) {
    console.error('Error sending push notification in post-save hook:', error);
  }
});

export default mongoose.model('Notification', NotificationSchema);
