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
    enum: ['requested'],
    default: 'requested'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
