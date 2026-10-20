const mongoose = require('mongoose');

// A buyer's purchase request for an equipment item or an approved seller
// listing. name/price are snapshotted at purchase time so the order still
// reads correctly even if the underlying item is later edited or removed.
const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    enum: ['equipment', 'listing'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['paid'],
    default: 'paid'
  },
  // Ties an order back to the Stripe Checkout Session that paid for it.
  // Sparse so it doesn't collide with older orders that predate payments
  // (they simply don't have this field at all).
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Only set for a rental booking (a 'listing' whose listingType is 'rent').
  // Both dates are inclusive — the item is out for the whole of startDate
  // through the whole of endDate. Used both to price the order (days *
  // price-per-day) and to block those same days out for later bookings.
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  days: {
    type: Number,
    min: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
