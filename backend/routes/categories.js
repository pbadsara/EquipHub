const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/categories — public. Sellers need this list (with caps) when
// building a listing; renters need it for filtering the catalogue.
router.get('/', async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json(categories);
});

// POST /api/categories — admin only. Category names are free-text, same
// as the current version — admin isn't limited to a fixed set of 8.
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, maxPrice } = req.body;
    if (!name || maxPrice === undefined) {
      return res.status(400).json({ error: 'name and maxPrice are required' });
    }
    const category = await Category.create({ name, maxPrice });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/categories/:id — admin only. Lets admin rename a category or
// change its price cap at any time, same as today.
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, maxPrice } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (name !== undefined) category.name = name;
    if (maxPrice !== undefined) category.maxPrice = maxPrice;
    await category.save();

    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/categories/:id — admin only.
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ deleted: true });
});

module.exports = router;
