import express from 'express';
import { addProspect, deleteProspect } from '../controllers/coachController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', authorize('coach', 'admin'), addProspect);
router.delete('/:id', authorize('coach', 'admin'), deleteProspect);

export default router;
