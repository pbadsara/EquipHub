import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { ROLES } from '../models/User.js';

// Placeholder, role-gated endpoints. These exist to prove role-based access
// control works end-to-end (Section 6, step 1) ahead of the real
// admin/seller/renter dashboard features (steps 5 & 6), which will replace
// these stubs with real data.
const router = Router();

router.get('/admin', protect, authorize(ROLES.ADMIN), (req, res) => {
  res.json({ message: `Welcome, admin ${req.user.name}.`, role: req.user.role });
});

router.get('/seller', protect, authorize(ROLES.SELLER), (req, res) => {
  res.json({ message: `Welcome, seller ${req.user.name}.`, role: req.user.role });
});

router.get('/renter', protect, authorize(ROLES.RENTER), (req, res) => {
  res.json({ message: `Welcome, renter/buyer ${req.user.name}.`, role: req.user.role });
});

export default router;
