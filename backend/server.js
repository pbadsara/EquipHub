require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS is needed since the React frontend runs on a different port during dev
app.use(cors());
// Raised from Express's 100kb default — a base64-encoded photo (up to the
// 2MB-per-image cap enforced on the frontend) comes in well over that once
// base64's ~33% overhead and the JSON wrapper are counted.
app.use(express.json({ limit: '10mb' }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equiphub';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Basic uptime check, useful for confirming deploys and debugging connectivity
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EquipHub API is running' });
});

// Feature routes are mounted here as they're built out
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});