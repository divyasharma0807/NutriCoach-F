import express from 'express';
import { createReferral, getReferrals, deleteReferral } from '../controllers/clientController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/', createReferral);
router.get('/', getReferrals);
router.delete('/:id', deleteReferral);

export default router;
