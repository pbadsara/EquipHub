import { getSettings } from '../models/Settings.js';

export async function getPriceCap(req, res, next) {
  try {
    const settings = await getSettings();
    return res.status(200).json({ maxListingPrice: settings.maxListingPrice });
  } catch (err) {
    return next(err);
  }
}

export async function updatePriceCap(req, res, next) {
  try {
    const { maxListingPrice } = req.body;
    const numeric = Number(maxListingPrice);

    if (Number.isNaN(numeric) || numeric < 0) {
      return res.status(400).json({ message: 'maxListingPrice must be a non-negative number.' });
    }

    const settings = await getSettings();
    settings.maxListingPrice = numeric;
    settings.updatedBy = req.user._id;
    await settings.save();

    return res.status(200).json({ maxListingPrice: settings.maxListingPrice });
  } catch (err) {
    return next(err);
  }
}
