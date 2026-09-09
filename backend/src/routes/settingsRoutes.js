import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { ROLES } from '../models/User.js';
import { getPriceCap, updatePriceCap } from '../controllers/settingsController.js';

const router = Router();

router.get('/price-cap', protect, authorize(ROLES.ADMIN), getPriceCap);
router.put('/price-cap', protect, authorize(ROLES.ADMIN), updatePriceCap);

export default router;
