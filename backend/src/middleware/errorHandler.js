export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralised error handler. Express recognises this by its 4-argument signature.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;

  // Duplicate-key error from Mongo (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A user with this email already exists.' });
  }

  // Malformed ObjectId in a route param (e.g. GET /api/equipment/not-a-real-id)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID.' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', details });
  }

  // Multer upload errors (bad file type/size) are client input problems, not server faults.
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 5MB or smaller.' : err.message;
    return res.status(400).json({ message });
  }
  if (typeof err.message === 'string' && err.message.includes('Only JPEG, PNG, or WEBP')) {
    return res.status(400).json({ message: err.message });
  }

  res.status(status).json({
    message: err.message || 'Internal server error',
  });
}
