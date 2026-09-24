const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const { requireAuth, requireRole } = require('../middleware/auth');

const REVIEWABLE_FIELDS = Listing.REVIEWABLE_FIELDS; // ['name','description','price','category','images']

// Hard rule enforced server-side, before a listing (or an edited price/category)
// ever reaches the admin queue — this is not something admin approves/rejects,
// it simply isn't allowed to be submitted in the first place.
async function assertWithinPriceCap(categoryId, price) {
  const category = await Category.findById(categoryId);
  if (!category) {
    const err = new Error('Selected category does not exist');
    err.status = 400;
    throw err;
  }
  if (price > category.maxPrice) {
    const err = new Error(
      `Price $${price} exceeds the $${category.maxPrice} cap for "${category.name}"`
    );
    err.status = 400;
    throw err;
  }
}

// POST /api/listings — seller only. Creates a new listing; every field
// starts as 'pending' and the listing enters the admin's review queue.
router.post('/', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const { name, description, price, category, images, listingType } = req.body;
    if (!name || !description || price === undefined || !category || !listingType) {
      return res.status(400).json({ error: 'name, description, price, category and listingType are required' });
    }
    if (!['sale', 'rent'].includes(listingType)) {
      return res.status(400).json({ error: 'listingType must be "sale" or "rent"' });
    }

    await assertWithinPriceCap(category, price);

    const listing = await Listing.create({
      seller: req.user.id,
      name: { value: name },
      description: { value: description },
      price: { value: price },
      category: { value: category },
      images: { value: images || [] },
      listingType: { value: listingType }
    });

    res.status(201).json(listing);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// PUT /api/listings/:id — seller only, must own the listing. Body may
// contain any subset of the reviewable fields. Editing a field — approved,
// rejected, or pending — always resets that specific field to 'pending'
// and clears its comment, since it's a new value awaiting fresh review.
// Fields the seller doesn't touch keep their existing status untouched,
// which is what lets an already-approved field stay approved across rounds.
router.put('/:id', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this listing' });
    }

    const updates = req.body;
    const editedKeys = REVIEWABLE_FIELDS.filter((key) => updates[key] !== undefined);
    if (editedKeys.length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    // Re-check the price cap using whichever of price/category is newest
    // (either just edited, or unchanged from the existing listing).
    const nextPrice = updates.price !== undefined ? updates.price : listing.price.value;
    const nextCategory = updates.category !== undefined ? updates.category : listing.category.value;
    if (updates.price !== undefined || updates.category !== undefined) {
      await assertWithinPriceCap(nextCategory, nextPrice);
    }

    for (const key of editedKeys) {
      listing[key].value = updates[key];
      listing[key].status = 'pending';
      listing[key].comment = '';
    }

    await listing.save(); // overallStatus recomputes automatically
    res.json(listing);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// PUT /api/listings/:id/review — admin only. Body shape:
//   { name: { status: 'approved' }, price: { status: 'rejected', comment: '...' }, ... }
// Only the fields the admin is actually deciding on this round need to be
// included — fields left out are untouched. Any field submitted as
// 'rejected' must include a non-empty comment; field-by-field is the only
// path (no whole-listing fast reject).
router.put('/:id/review', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const decisions = req.body;
    const decidedKeys = REVIEWABLE_FIELDS.filter((key) => decisions[key] !== undefined);
    if (decidedKeys.length === 0) {
      return res.status(400).json({ error: 'No field decisions provided' });
    }

    for (const key of decidedKeys) {
      const { status, comment } = decisions[key];
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: `Invalid status for "${key}" — must be approved or rejected` });
      }
      if (status === 'rejected' && !comment?.trim()) {
        return res.status(400).json({ error: `A comment is required to reject "${key}"` });
      }

      listing[key].status = status;
      listing[key].comment = status === 'rejected' ? comment.trim() : '';
    }

    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// GET /api/listings/mine — seller only. Their own listings, any status.
router.get('/mine', requireAuth, requireRole('seller'), async (req, res) => {
  const listings = await Listing.find({ seller: req.user.id })
    .populate('category.value', 'name maxPrice')
    .sort('-updatedAt');
  res.json(listings);
});

// GET /api/listings/review-queue — admin only. Listings currently awaiting
// an admin decision (i.e. no rejected fields still sitting unedited).
router.get('/review-queue', requireAuth, requireRole('admin'), async (req, res) => {
  const listings = await Listing.find({ overallStatus: 'submitted' })
    .populate('seller', 'name email')
    .populate('category.value', 'name maxPrice')
    .sort('createdAt');
  res.json(listings);
});

// GET /api/listings — public catalogue. Approved listings only.
router.get('/', async (req, res) => {
  const listings = await Listing.find({ overallStatus: 'approved' })
    .populate('category.value', 'name maxPrice')
    .sort('-updatedAt');
  res.json(listings);
});

module.exports = router;
