const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Equipment = require('../models/Equipment');
const { requireAuth, requireRole } = require('../middleware/auth');

const DAY_MS = 24 * 60 * 60 * 1000;

// Rental dates are a pure calendar concept (a day, not a moment in time),
// so this always reads the Y/M/D straight off the input string and anchors
// it to UTC midnight — never through the server's local timezone. Using
// `new Date(input).setHours(0,0,0,0)` instead would re-interpret the date
// in whatever timezone the server happens to run in, silently shifting it
// by hours (and sometimes onto the wrong calendar day entirely).
function toDateOnly(input) {
  const iso = input instanceof Date ? input.toISOString() : String(input);
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

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

// POST /api/orders — renter only. Records a purchase or rental request for
// an equipment item or an approved seller listing. name/price are always
// looked up server-side (never taken from the client) so a buyer can't
// tamper with what they're charged. A rental listing additionally requires
// startDate/endDate, which are checked against every existing order for
// that item so the same days can't be double-booked; the total is priced
// as days * price-per-day.
router.post('/', requireAuth, requireRole('renter'), async (req, res) => {
  try {
    const { itemType, itemId, startDate, endDate } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }
    if (!['equipment', 'listing'].includes(itemType)) {
      return res.status(400).json({ error: 'itemType must be "equipment" or "listing"' });
    }

    let name;
    let pricePerUnit;
    let isRental = false;

    if (itemType === 'listing') {
      const listing = await Listing.findOne({ _id: itemId, overallStatus: 'approved' });
      if (!listing) return res.status(404).json({ error: 'Listing not found or not approved' });
      isRental = listing.listingType.value === 'rent';
      if (!isRental && listing.sold) {
        return res.status(409).json({ error: 'This item has already been sold' });
      }
      name = listing.name.value;
      pricePerUnit = listing.price.value;
    } else {
      const equipment = await Equipment.findOne({ _id: itemId, isActive: true });
      if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
      name = equipment.name;
      pricePerUnit = equipment.hireRate.amount;
    }

    const orderData = { buyer: req.user.id, itemType, itemId, name };

    if (isRental) {
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required to rent this item' });
      }

      const start = toDateOnly(startDate);
      const end = toDateOnly(endDate);
      const today = toDateOnly(new Date());

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate or endDate' });
      }
      if (start < today) {
        return res.status(400).json({ error: 'startDate cannot be in the past' });
      }
      if (end < start) {
        return res.status(400).json({ error: 'endDate cannot be before startDate' });
      }

      // Both dates inclusive — renting the same day back is a 1-day booking.
      const days = Math.round((end - start) / DAY_MS) + 1;

      const conflict = await Order.findOne({
        itemType,
        itemId,
        startDate: { $lte: end },
        endDate: { $gte: start }
      });
      if (conflict) {
        return res.status(409).json({ error: 'This item is already booked for some of the selected dates' });
      }

      orderData.startDate = start;
      orderData.endDate = end;
      orderData.days = days;
      orderData.price = pricePerUnit * days;
    } else {
      orderData.price = pricePerUnit;
    }

    const order = await Order.create(orderData);

    // A one-off sale (not a rental) takes the item off the public
    // catalogue immediately — it's been bought, there's only one to sell.
    if (!isRental) {
      if (itemType === 'listing') {
        await Listing.findByIdAndUpdate(itemId, { sold: true });
      } else {
        await Equipment.findByIdAndUpdate(itemId, { isActive: false });
      }
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

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

module.exports = router;
