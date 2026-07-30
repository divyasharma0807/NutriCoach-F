import express from 'express';
import { createOrder, verifyPayment, getSubscriptionStatus } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All payment routes require JWT authentication and Coach role permission
router.use(protect);
router.post('/create-order', authorize('coach'), createOrder);
router.post('/verify', authorize('coach'), verifyPayment);
router.get('/subscription-status', authorize('coach'), getSubscriptionStatus);

export default router;
