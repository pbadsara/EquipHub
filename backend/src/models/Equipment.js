import mongoose from 'mongoose';

export const EQUIPMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SOLD: 'sold',
});

export const LISTING_TYPE = Object.freeze({
  RENT: 'rent',
  SALE: 'sale',
});

const equipmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    photoUrl: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    listingType: {
      type: String,
      enum: Object.values(LISTING_TYPE),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EQUIPMENT_STATUS),
      default: EQUIPMENT_STATUS.PENDING,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

equipmentSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    category: this.category,
    photoUrl: this.photoUrl,
    price: this.price,
    listingType: this.listingType,
    status: this.status,
    rejectionReason: this.rejectionReason,
    seller: this.seller.toString ? this.seller.toString() : this.seller,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment;
