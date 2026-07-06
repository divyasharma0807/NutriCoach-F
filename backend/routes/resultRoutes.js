import express from 'express';
import { uploadResult, editResult, deleteResult } from '../controllers/coachController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('coach', 'admin'), upload.single('image'), uploadResult);
router.put('/:id', authorize('coach', 'admin'), upload.single('image'), editResult);
router.delete('/:id', authorize('coach', 'admin'), deleteResult);

export default router;
