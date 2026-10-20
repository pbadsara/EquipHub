const Listing = require('../models/Listing');
const Equipment = require('../models/Equipment');
const Order = require('../models/Order');

const DAY_MS = 24 * 60 * 60 * 1000;

// Rental dates are a pure calendar concept (a day, not a moment in time),
// so this always reads the Y/M/D straight off the input string and anchors
// it to UTC midnight — never through the server's local timezone. Using
// `new Date(input).setHours(0,0,0,0)` instead would re-interpret the date
// in whatever timezone the server happens to run in, silently shifting it
// by hours (and sometimes onto the wrong calendar day entirely).
function toDateOnly(input) {
  const iso = input instanceof Date ? input.toISOString() : String(input);
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Looks up the item and, for a rental, validates the requested dates
// against every existing order for it — without creating an order or
// marking the item unavailable. Used twice in the payment flow: once to
// validate/price a Checkout Session before sending the buyer to Stripe,
// and again right after payment is confirmed, since availability can
// change in the time the buyer spends on Stripe's page.
async function resolveOrder({ itemType, itemId, startDate, endDate }) {
  if (!['equipment', 'listing'].includes(itemType)) {
    const err = new Error('itemType must be "equipment" or "listing"');
    err.status = 400;
    throw err;
  }

  let name;
  let pricePerUnit;
  let isRental = false;

  if (itemType === 'listing') {
    const listing = await Listing.findOne({ _id: itemId, overallStatus: 'approved' });
    if (!listing) {
      const err = new Error('Listing not found or not approved');
      err.status = 404;
      throw err;
    }
    isRental = listing.listingType.value === 'rent';
    if (!isRental && listing.sold) {
      const err = new Error('This item has already been sold');
      err.status = 409;
      throw err;
    }
    name = listing.name.value;
    pricePerUnit = listing.price.value;
  } else {
    const equipment = await Equipment.findOne({ _id: itemId, isActive: true });
    if (!equipment) {
      const err = new Error('Equipment not found');
      err.status = 404;
      throw err;
    }
    name = equipment.name;
    pricePerUnit = equipment.hireRate.amount;
  }

  const result = { itemType, itemId, name, isRental };

  if (isRental) {
    if (!startDate || !endDate) {
      const err = new Error('startDate and endDate are required to rent this item');
      err.status = 400;
      throw err;
    }

    const start = toDateOnly(startDate);
    const end = toDateOnly(endDate);
    const today = toDateOnly(new Date());

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      const err = new Error('Invalid startDate or endDate');
      err.status = 400;
      throw err;
    }
    if (start < today) {
      const err = new Error('startDate cannot be in the past');
      err.status = 400;
      throw err;
    }
    if (end < start) {
      const err = new Error('endDate cannot be before startDate');
      err.status = 400;
      throw err;
    }

    // Both dates inclusive — renting the same day back is a 1-day booking.
    const days = Math.round((end - start) / DAY_MS) + 1;

    const conflict = await Order.findOne({
      itemType,
      itemId,
      startDate: { $lte: end },
      endDate: { $gte: start }
    });
    if (conflict) {
      const err = new Error('This item is already booked for some of the selected dates');
      err.status = 409;
      throw err;
    }

    result.startDate = start;
    result.endDate = end;
    result.days = days;
    result.price = pricePerUnit * days;
  } else {
    result.price = pricePerUnit;
  }

  return result;
}

// A one-off sale (not a rental) takes the item off the public catalogue
// immediately — it's been bought, there's only one to sell.
async function markItemUnavailable(itemType, itemId) {
  if (itemType === 'listing') {
    await Listing.findByIdAndUpdate(itemId, { sold: true });
  } else {
    await Equipment.findByIdAndUpdate(itemId, { isActive: false });
  }
}

module.exports = { resolveOrder, markItemUnavailable, toDateOnly };
