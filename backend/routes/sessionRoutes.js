import express from 'express';
import {
  scheduleSession,
  approveSession,
  rejectSession,
  getSessions
} from '../controllers/sessionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/schedule', scheduleSession);
router.put('/:id/approve', authorize('coach', 'admin'), approveSession);
router.put('/:id/reject', authorize('coach', 'admin'), rejectSession);
router.get('/', getSessions);

export default router;
