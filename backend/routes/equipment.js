const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');

// GET /api/equipment
// Returns all active equipment listings (used for the public browse page)
router.get('/', async (req, res) => {
  try {
    const equipment = await Equipment.find({ isActive: true });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/equipment/:id
// Returns a single equipment item, used for the detail/booking page
router.get('/:id', async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/equipment
// Creates a new equipment listing (admin only, once auth is added)
router.post('/', async (req, res) => {
  try {
    const newItem = new Equipment(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/equipment/:id
// Updates an existing listing (admin only, once auth is added)
router.put('/:id', async (req, res) => {
  try {
    const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Equipment not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/equipment/:id
// Soft delete — marks as inactive instead of removing the record,
// so past bookings still reference valid equipment data
router.delete('/:id', async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json({ message: 'Equipment deactivated', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;