import Coach from '../models/Coach.js';
import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import razorpay from '../config/razorpay.js';

// @desc    Create a Razorpay Order for Coach Subscription renewal
// @route   POST /api/payments/create-order
// @access  Private (Coach only)
export const createOrder = async (req, res, next) => {
  try {
    // 1. Authenticate and Fetch Coach
    const coachId = req.user.id;
    const coach = await Coach.findById(coachId);

    if (!coach) {
      res.status(404);
      throw new Error('Coach not found');
    }

    // 2. Check if the coach already has an ACTIVE subscription
    const activeSubscription = await Subscription.findOne({
      coachId: coach._id,
      status: 'ACTIVE',
      expiryDate: { $gt: new Date() }
    });

    if (activeSubscription) {
      res.status(400);
      throw new Error('Subscription is already active');
    }

    // 3. Check for an existing PENDING transaction
    const pendingTransaction = await Transaction.findOne({
      coachId: coach._id,
      status: 'PENDING'
    }).sort({ createdAt: -1 });

    if (pendingTransaction) {
      let isReusable = false;
      try {
        // Check whether the corresponding Razorpay Order is still valid (status must be 'created')
        const rzpOrder = await razorpay.orders.fetch(pendingTransaction.razorpayOrderId);
        if (rzpOrder && rzpOrder.status === 'created') {
          isReusable = true;
          // Return the existing order instead of creating a new one
          return res.status(200).json({
            success: true,
            orderId: pendingTransaction.razorpayOrderId,
            amount: pendingTransaction.amount,
            currency: pendingTransaction.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            transactionId: pendingTransaction._id
          });
        }
      } catch (error) {
        console.warn(
          `Pending Razorpay order ${pendingTransaction.razorpayOrderId} check failed: ${error.message}`
        );
      }

      if (!isReusable) {
        // Mark old pending transaction as CANCELLED
        pendingTransaction.status = 'CANCELLED';
        pendingTransaction.failureReason = 'Order expired or no longer reusable';
        await pendingTransaction.save();
        console.log(`Updated old pending transaction ${pendingTransaction._id} to CANCELLED`);
      }
    }

    // 4. Create Razorpay Order
    const amountInPaise = 49900; // ₹499 represented in paise
    const currency = 'INR';
    const receipt = `NC_ORDER_${Date.now()}`;

    let rzpOrder;
    try {
      rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt
      });
    } catch (error) {
      res.status(502); // Bad Gateway - external service error
      throw new Error(`Razorpay Order creation failed: ${error.message}`);
    }

    // 5. Create Transaction document
    let transaction;
    try {
      transaction = await Transaction.create({
        coachId: coach._id,
        coachSnapshot: {
          name: coach.name,
          phone: coach.phone
        },
        razorpayOrderId: rzpOrder.id,
        amount: 499, // Store in base currency (Rupees)
        currency,
        status: 'PENDING',
        paymentMethod: null,
        failureReason: null,
        razorpaySignature: null,
        paidAt: null
      });
    } catch (dbError) {
      const timestamp = new Date().toISOString();
      console.error(
        `Failed to save transaction after Razorpay order creation.\n\n` +
        `Razorpay Order:\n${rzpOrder.id}\n\n` +
        `Coach:\n${coach._id}\n\n` +
        `Reason:\n${dbError.message}\n\n` +
        `Timestamp:\n${timestamp}`
      );

      return res.status(500).json({
        success: false,
        message: 'Payment order was created but could not be recorded. Please contact support.'
      });
    }

    // 6. Return response required by frontend
    res.status(201).json({
      success: true,
      orderId: rzpOrder.id,
      amount: 499,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      transactionId: transaction._id
    });
  } catch (error) {
    next(error);
  }
};
