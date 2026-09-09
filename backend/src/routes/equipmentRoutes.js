import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadEquipmentPhoto } from '../middleware/upload.js';
import { ROLES } from '../models/User.js';
import {
  createEquipment,
  listMyEquipment,
  updateEquipment,
  deleteEquipment,
} from '../controllers/equipmentController.js';

const router = Router();

// Seller-only routes (Phase A1). Public catalogue + admin approval routes
// are added in Phase A2.
router.post('/', protect, authorize(ROLES.SELLER), uploadEquipmentPhoto, createEquipment);
router.get('/mine', protect, authorize(ROLES.SELLER), listMyEquipment);
router.patch('/:id', protect, authorize(ROLES.SELLER), uploadEquipmentPhoto, updateEquipment);
router.delete('/:id', protect, authorize(ROLES.SELLER), deleteEquipment);

export default router;
