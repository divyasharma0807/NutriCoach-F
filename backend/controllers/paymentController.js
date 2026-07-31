import crypto from 'crypto';
import mongoose from 'mongoose';
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
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    const activeSubscription = await Subscription.findOne({
      coachId: coach._id,
      status: 'ACTIVE',
      expiryDate: { $gt: todayMidnight }
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

// @desc    Verify a Razorpay Payment and activate/renew subscription
// @route   POST /api/payments/verify
// @access  Private (Coach only)
export const verifyPayment = async (req, res, next) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  // Start MongoDB Session for atomic transaction processing
  const session = await mongoose.startSession();

  try {
    // 1. Validate Input Fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Missing required fields for signature verification');
    }

    const coachId = req.user.id;

    // Start Transaction
    session.startTransaction();

    // 2. Find and Validate Transaction inside the session
    const transaction = await Transaction.findOne({
      coachId,
      razorpayOrderId: razorpay_order_id
    }).session(session);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction record not found');
    }

    // Check if transaction has already been processed
    if (transaction.status === 'SUCCESS') {
      res.status(400);
      throw new Error('Transaction has already been successfully verified');
    }
    if (transaction.status === 'FAILED') {
      res.status(400);
      throw new Error('Transaction has already been marked as FAILED');
    }
    if (transaction.status === 'CANCELLED') {
      res.status(400);
      throw new Error('Transaction has already been CANCELLED');
    }

    // 3. Cryptographic Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      res.status(500);
      throw new Error('Razorpay secret configuration is missing on the server');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(razorpay_signature, 'utf8');

    let isValid = false;
    if (expectedBuf.length === actualBuf.length) {
      isValid = crypto.timingSafeEqual(expectedBuf, actualBuf);
    }

    if (!isValid) {
      // Failure Flow: Update Transaction status to FAILED
      transaction.status = 'FAILED';
      transaction.failureReason = 'Invalid payment signature';
      await transaction.save({ session });

      // Commit the transaction for the failure status update
      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    // 4. Success Flow: Update Transaction Details
    transaction.status = 'SUCCESS';
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.paidAt = new Date();
    transaction.failureReason = null;
    await transaction.save({ session });

    // 5. Subscription Logic with improved duration calculation
    const SUBSCRIPTION_DURATION_DAYS = 30;
    let subscription = await Subscription.findOne({ coachId }).session(session);
    const now = new Date();
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    if (!subscription) {
      // Create Subscription using Date operations
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + SUBSCRIPTION_DURATION_DAYS);
      expiryDate.setUTCHours(0, 0, 0, 0);

      subscription = new Subscription({
        coachId,
        status: 'ACTIVE',
        startDate: now,
        expiryDate,
        lastTransactionId: transaction._id
      });
      await subscription.save({ session });
    } else {
      // Update Subscription
      const isExpired = !subscription.expiryDate || new Date(subscription.expiryDate).getTime() <= todayMidnight.getTime();
      if (isExpired) {
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + SUBSCRIPTION_DURATION_DAYS);
        expiryDate.setUTCHours(0, 0, 0, 0);

        subscription.status = 'ACTIVE';
        subscription.startDate = now;
        subscription.expiryDate = expiryDate;
      } else {
        // subscription is still active, append 30 days to existing expiry date
        const expiryDate = new Date(subscription.expiryDate);
        expiryDate.setDate(expiryDate.getDate() + SUBSCRIPTION_DURATION_DAYS);
        expiryDate.setUTCHours(0, 0, 0, 0);

        subscription.status = 'ACTIVE';
        subscription.expiryDate = expiryDate;
      }
      subscription.lastTransactionId = transaction._id;
      await subscription.save({ session });
    }

    // Commit Transaction on SUCCESS
    await session.commitTransaction();

    // 6. Return response
    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      data: {
        status: subscription.status,
        expiryDate: subscription.expiryDate,
        transactionId: transaction._id
      }
    });
  } catch (error) {
    // Abort Transaction if any error occurs
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    // Always end the session
    await session.endSession();
  }
};

// @desc    Get Coach Subscription status
// @route   GET /api/payments/subscription-status
// @access  Private (Coach only)
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const coachId = req.user.id;

    const subscription = await Subscription.findOne({ coachId });
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'PENDING',
          expiryDate: null,
          isActive: false
        }
      });
    }

    const isActive = subscription.status === 'ACTIVE' && subscription.expiryDate && new Date(subscription.expiryDate).getTime() > todayMidnight.getTime();

    res.status(200).json({
      success: true,
      data: {
        status: isActive ? 'ACTIVE' : (subscription.expiryDate && new Date(subscription.expiryDate).getTime() <= todayMidnight.getTime() ? 'EXPIRED' : subscription.status),
        expiryDate: subscription.expiryDate,
        isActive: !!isActive
      }
    });
  } catch (error) {
    next(error);
  }
};
