import express from 'express';
import { uploadDietPlan, getMyDietPlan } from '../controllers/dietController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post(
  '/upload',
  authorize('coach'),
  upload.single('dietFile'),
  uploadDietPlan
);

router.get('/my-plan', authorize('client'), getMyDietPlan);

export default router;
