const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/reviews — renter only. One review per order, and only for an
// order the requester actually placed — that's what makes this a verified
// review instead of an open comment box. Equipment orders have no seller
// concept (see routes/orders.js), so only 'listing' orders are reviewable.
router.post('/', requireAuth, requireRole('renter'), async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || rating === undefined) {
      return res.status(400).json({ error: 'orderId and rating are required' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be an integer from 1 to 5' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'This order does not belong to you' });
    }
    if (order.itemType !== 'listing') {
      return res.status(400).json({ error: 'This item cannot be reviewed' });
    }

    const listing = await Listing.findById(order.itemId);
    if (!listing) return res.status(404).json({ error: 'Listing no longer exists' });

    const review = await Review.create({
      order: order._id,
      buyer: req.user.id,
      seller: listing.seller,
      listing: listing._id,
      rating,
      comment: comment || ''
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this order' });
    }
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET /api/reviews/mine — renter only. The requester's own reviews, so the
// frontend can tell which of their orders are already rated.
router.get('/mine', requireAuth, requireRole('renter'), async (req, res) => {
  const reviews = await Review.find({ buyer: req.user.id }).select('order rating comment');
  res.json(reviews);
});

module.exports = router;
