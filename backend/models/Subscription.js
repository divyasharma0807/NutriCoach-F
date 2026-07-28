import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'PENDING'],
    default: 'PENDING',
    required: true
  },
  startDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  lastTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  autoRenew: {
    type: Boolean,
    default: false,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
// Note: coachId is automatically indexed and marked unique via the `unique: true` property in Schema definition
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ expiryDate: 1 });

/*
FUTURE RENEWAL BUSINESS RULE:
- If the subscription is still ACTIVE:
  new expiry date = current expiry date + 30 days
- If the subscription has already EXPIRED:
  new expiry date = today + 30 days
*/

export default mongoose.model('Subscription', SubscriptionSchema);
