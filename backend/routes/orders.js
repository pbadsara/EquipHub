const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/orders — renter only. Records a purchase request for an
// equipment item or an approved seller listing, clicked from the "Buy"
// button on the public browse page.
router.post('/', requireAuth, requireRole('renter'), async (req, res) => {
  try {
    const { itemType, itemId, name, price } = req.body;
    if (!itemType || !itemId || !name || price === undefined) {
      return res.status(400).json({ error: 'itemType, itemId, name and price are required' });
    }
    if (!['equipment', 'listing'].includes(itemType)) {
      return res.status(400).json({ error: 'itemType must be "equipment" or "listing"' });
    }

    const order = await Order.create({
      buyer: req.user.id,
      itemType,
      itemId,
      name,
      price
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
