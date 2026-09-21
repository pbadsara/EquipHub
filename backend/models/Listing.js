const mongoose = require('mongoose');

// Every reviewable field on a listing carries its own status + comment,
// so the admin can approve/reject name, price, description, category and
// images independently instead of accepting or rejecting the listing as a whole.
function reviewField(valueSchema) {
  return {
    value: valueSchema,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Only ever holds the CURRENT round's comment — cleared on approval or
    // as soon as the seller edits the field again, by design (no history kept).
    comment: { type: String, default: '', trim: true }
  };
}

// The set of fields the review workflow applies to. Routes iterate this
// list, so adding a new reviewable field later means changing it in one place.
const REVIEWABLE_FIELDS = ['name', 'description', 'price', 'category', 'images'];

const listingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  name: reviewField({ type: String, required: true, trim: true }),
  description: reviewField({ type: String, required: true, trim: true }),
  price: reviewField({ type: Number, required: true, min: 0 }),
  category: reviewField({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }),
  images: reviewField({ type: [String], default: [] }),

  // Derived from the five field statuses above on every save — see
  // recomputeOverallStatus(). Stored (not a virtual) so it's queryable,
  // e.g. "give me every listing currently awaiting admin action".
  overallStatus: {
    type: String,
    enum: ['submitted', 'needs_changes', 'approved'],
    default: 'submitted'
  }
}, { timestamps: true });

listingSchema.methods.recomputeOverallStatus = function () {
  const statuses = REVIEWABLE_FIELDS.map((key) => this[key].status);

  if (statuses.includes('rejected')) {
    this.overallStatus = 'needs_changes';
  } else if (statuses.every((s) => s === 'approved')) {
    this.overallStatus = 'approved';
  } else {
    // no rejections outstanding, but not every field has been approved yet
    // (covers both "just submitted" and "seller just fixed the last issue")
    this.overallStatus = 'submitted';
  }
};

listingSchema.pre('save', function (next) {
  this.recomputeOverallStatus();
  next();
});

listingSchema.statics.REVIEWABLE_FIELDS = REVIEWABLE_FIELDS;

module.exports = mongoose.model('Listing', listingSchema);
