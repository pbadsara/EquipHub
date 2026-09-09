import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadEquipmentPhoto } from '../middleware/upload.js';
import { ROLES } from '../models/User.js';
import {
  createEquipment,
  listMyEquipment,
  updateEquipment,
  deleteEquipment,
  listCatalogue,
  getEquipmentById,
  listPendingEquipment,
  approveEquipment,
  rejectEquipment,
} from '../controllers/equipmentController.js';

const router = Router();

// Seller-only routes (Phase A1)
router.post('/', protect, authorize(ROLES.SELLER), uploadEquipmentPhoto, createEquipment);
router.get('/mine', protect, authorize(ROLES.SELLER), listMyEquipment);
router.patch('/:id', protect, authorize(ROLES.SELLER), uploadEquipmentPhoto, updateEquipment);
router.delete('/:id', protect, authorize(ROLES.SELLER), deleteEquipment);

// Admin review queue (Phase A2) — specific paths before the "/:id" catch-all below
router.get('/pending', protect, authorize(ROLES.ADMIN), listPendingEquipment);
router.patch('/:id/approve', protect, authorize(ROLES.ADMIN), approveEquipment);
router.patch('/:id/reject', protect, authorize(ROLES.ADMIN), rejectEquipment);

// Public catalogue (Phase A2)
router.get('/', listCatalogue);
router.get('/:id', getEquipmentById);

export default router;
