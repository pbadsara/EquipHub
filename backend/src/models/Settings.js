import mongoose from 'mongoose';

// Singleton document (key is always 'global') holding admin-configurable
// platform settings. Currently just the seller listing price cap
// (brief §2: "enforce a maximum listing price ('price cap X') on seller
// listings"). The admin UI to change this ships in Phase A2 — until then
// the default below is what's enforced.
const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global',
    },
    maxListingPrice: {
      type: Number,
      default: 500,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

export async function getSettings() {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = await Settings.create({ key: 'global' });
  }
  return settings;
}

export default Settings;
