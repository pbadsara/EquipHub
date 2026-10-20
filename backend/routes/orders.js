const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/orders/booked-dates/:itemType/:itemId — public. The date ranges
// already reserved for a rental item, so the browse page can grey them out
// on the calendar before a buyer even tries to book.
router.get('/booked-dates/:itemType/:itemId', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    if (!['equipment', 'listing'].includes(itemType)) {
      return res.status(400).json({ error: 'itemType must be "equipment" or "listing"' });
    }

    const orders = await Order.find({ itemType, itemId, startDate: { $ne: null } })
      .select('startDate endDate -_id')
      .sort('startDate');
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Orders are no longer created directly here — a buyer has to actually pay
// first. See routes/payments.js: POST /create-checkout-session validates
// availability and sends them to Stripe, and POST /confirm re-validates
// and creates the Order only once Stripe confirms the payment went through.

// GET /api/orders/mine-as-seller — seller only. Every order placed against
// one of THIS seller's own listings (sale or rental), newest first — the
// seller's activity history.
router.get('/mine-as-seller', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const myListingIds = await Listing.find({ seller: req.user.id }).distinct('_id');
    const orders = await Order.find({ itemType: 'listing', itemId: { $in: myListingIds } }).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders/all — admin only. Every order placed against every
// seller's listings, newest first, with the seller's name attached — the
// site-wide activity history.
router.get('/all', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find({ itemType: 'listing' }).sort('-createdAt').lean();

    const listingIds = [...new Set(orders.map((o) => String(o.itemId)))];
    const listings = await Listing.find({ _id: { $in: listingIds } })
      .populate('seller', 'name')
      .select('seller')
      .lean();
    const sellerByListingId = new Map(listings.map((l) => [String(l._id), l.seller?.name || 'Unknown seller']));

    const enriched = orders.map((o) => ({
      ...o,
      sellerName: sellerByListingId.get(String(o.itemId)) || 'Unknown seller'
    }));
    res.json(enriched);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders/mine-as-buyer — renter only. Every order this buyer has
// placed (equipment or listing), newest first — their own purchase/rental
// history. Listing orders get the seller's name attached so the buyer
// knows who to expect to hear from; equipment has no seller concept.
router.get('/mine-as-buyer', requireAuth, requireRole('renter'), async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id }).sort('-createdAt').lean();

    const listingIds = [...new Set(orders.filter((o) => o.itemType === 'listing').map((o) => String(o.itemId)))];
    const listings = await Listing.find({ _id: { $in: listingIds } })
      .populate('seller', 'name')
      .select('seller')
      .lean();
    const sellerByListingId = new Map(listings.map((l) => [String(l._id), l.seller?.name || 'Unknown seller']));

    const enriched = orders.map((o) => ({
      ...o,
      sellerName: o.itemType === 'listing' ? (sellerByListingId.get(String(o.itemId)) || 'Unknown seller') : '—'
    }));
    res.json(enriched);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
