import express from 'express';
import {
  addClient,
  getDashboardStats,
  addProspect,
  addCoach,
  uploadResult
} from '../controllers/coachController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/clients', authorize('coach'), addClient);
router.get('/dashboard', authorize('coach'), getDashboardStats);
router.post('/prospects', authorize('coach'), addProspect);
router.post('/sub-coaches', authorize('coach', 'admin'), addCoach);
router.post('/results', authorize('coach'), upload.single('image'), uploadResult);

export default router;
