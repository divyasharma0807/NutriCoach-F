import express from 'express';
import { uploadResult } from '../controllers/coachController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('coach'), upload.single('image'), uploadResult);

export default router;
