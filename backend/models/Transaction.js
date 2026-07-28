import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
// Snapshot of coach details at the time of payment.
// This preserves historical payment records even if the coach later
// changes their profile information.
  coachSnapshot: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: [
        "UPI",
        "CARD",
        "NETBANKING",
        "WALLET",
        "EMI",
        null
    ],
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    required: true
  },
  failureReason: {
    type: String,
    default: null
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
TransactionSchema.index({ coachId: 1 });
TransactionSchema.index({ "coachSnapshot.name": 1 });
TransactionSchema.index({ "coachSnapshot.phone": 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ paidAt: 1 });
// Note: razorpayOrderId, razorpayPaymentId, and invoiceNumber are automatically indexed/unique via the `unique: true` property.

export default mongoose.model('Transaction', TransactionSchema);
