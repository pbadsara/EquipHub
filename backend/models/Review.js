const mongoose = require('mongoose');

// A buyer's rating of one completed order. Tied to the Order itself (not
// just the listing) so a review can only ever come from a verified
// purchase, and the unique index means each order can be reviewed once.
const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshotted from the listing at review time — who the buyer is
  // actually rating, same reasoning as Order snapshotting name/price.
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
