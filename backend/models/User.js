const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  // Single shared login — the frontend reads this to decide which
  // dashboard to redirect a user to after they log in.
  role: {
    type: String,
    required: true,
    enum: ['admin', 'seller', 'renter'],
    default: 'renter'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Set only while a password-reset link is outstanding. The token itself
  // is never stored — only its hash — so a database leak alone can't be
  // used to reset anyone's password; the raw token only ever exists in the
  // emailed link, and expires after an hour either way.
  resetPasswordTokenHash: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
