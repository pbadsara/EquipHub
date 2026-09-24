const express = require('express');
const router = express.Router();
const cloudinary = require('../lib/cloudinary');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/uploads/image — seller only. Accepts a single image already
// read into a data URL (the frontend's existing FileReader flow) and
// uploads it to Cloudinary, returning the hosted URL. This keeps image
// bytes out of MongoDB entirely — the listing only ever stores the
// resulting https URL — instead of the base64 blobs it used to store.
router.post('/image', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'A valid image data URL is required' });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'equiphub-listings',
      resource_type: 'image'
    });

    res.status(201).json({ url: result.secure_url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
