import express from 'express';
import {
  addClient,
  getDashboardStats,
  addProspect,
  addCoach,
  uploadResult,
  deleteClient,
  getClientDetails,
  updateClientSubscription,
  updateSubcoachStatus
} from '../controllers/coachController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/clients', authorize('coach', 'admin'), addClient);
router.get('/clients/:id', authorize('coach', 'admin'), getClientDetails);
router.put('/clients/:id/subscription', authorize('coach', 'admin'), updateClientSubscription);
router.get('/dashboard', authorize('coach', 'admin'), getDashboardStats);
router.post('/prospects', authorize('coach', 'admin'), addProspect);
router.post('/sub-coaches', authorize('coach', 'admin'), addCoach);
router.put('/sub-coaches/:id/status', authorize('coach', 'admin'), updateSubcoachStatus);
router.post('/results', authorize('coach', 'admin'), upload.single('image'), uploadResult);
router.delete('/clients/:id', authorize('coach', 'admin'), deleteClient);

export default router;
