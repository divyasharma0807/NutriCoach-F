import express from 'express';
import {
  completeProfile,
  getDashboardStats,
  addParameterHistory,
  addMeasurementHistory,
  createReferral,
  getReferrals
} from '../controllers/clientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('client'));

router.put(
  '/profile',
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'medicalPdf', maxCount: 1 }
  ]),
  completeProfile
);

router.get('/dashboard', getDashboardStats);
router.post('/parameters', addParameterHistory);
router.post('/measurements', addMeasurementHistory);
router.post('/referrals', createReferral);
router.get('/referrals', getReferrals);

export default router;
