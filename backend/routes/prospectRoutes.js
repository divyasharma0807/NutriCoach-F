import express from 'express';
import { addProspect } from '../controllers/coachController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('coach'), addProspect);

export default router;
