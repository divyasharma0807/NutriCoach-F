import express from 'express';
import { getDashboardStats, updateCoachLevel, updateCoachStatus } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.put('/coaches/:id/level', updateCoachLevel);
router.put('/coaches/:id/status', updateCoachStatus);

export default router;
