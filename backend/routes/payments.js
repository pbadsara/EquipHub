const express = require('express');
const router = express.Router();
const stripe = require('../lib/stripe');
const Order = require('../models/Order');
const { resolveOrder, markItemUnavailable } = require('../lib/orderResolver');
const { requireAuth, requireRole } = require('../middleware/auth');

// POST /api/payments/create-checkout-session — renter only. Validates the
// item/dates are available right now (so nobody's sent to Stripe to pay
// for something that's already gone), then hands back a Stripe-hosted
// checkout page URL. Nothing is created or marked unavailable yet — that
// only happens once payment is actually confirmed, in /confirm below. The
// item/dates being requested travel along as Checkout Session metadata
// instead of a separate "pending order" record.
router.post('/create-checkout-session', requireAuth, requireRole('renter'), async (req, res) => {
  try {
    const { itemType, itemId, startDate, endDate } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }

    const order = await resolveOrder({ itemType, itemId, startDate, endDate });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: order.name },
          unit_amount: Math.round(order.price * 100)
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/browse`,
      metadata: {
        buyerId: req.user.id,
        itemType,
        itemId,
        ...(order.isRental ? { startDate: order.startDate.toISOString(), endDate: order.endDate.toISOString() } : {})
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// POST /api/payments/confirm — renter only. Called once Stripe redirects
// back after a successful payment. Re-validates availability — the item
// could have sold to someone else while this buyer was on Stripe's page —
// and only then creates the order and marks the item unavailable.
// Idempotent: reloading the success page after the order's already been
// created just returns that same order instead of erroring or duplicating it.
router.post('/confirm', requireAuth, requireRole('renter'), async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'This checkout session does not belong to you' });
    }
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment has not completed yet' });
    }

    const existing = await Order.findOne({ stripeSessionId: sessionId });
    if (existing) return res.json(existing);

    const { itemType, itemId, startDate, endDate } = session.metadata;

    let resolved;
    try {
      resolved = await resolveOrder({ itemType, itemId, startDate, endDate });
    } catch (err) {
      // The item sold out / got booked by someone else while this buyer
      // was paying — refund them immediately rather than leave them
      // charged with nothing to show for it.
      await stripe.refunds.create({ payment_intent: session.payment_intent });
      return res.status(409).json({ error: `${err.message} You have been automatically refunded.` });
    }

    const orderData = {
      buyer: req.user.id,
      itemType,
      itemId,
      name: resolved.name,
      price: resolved.price,
      stripeSessionId: sessionId
    };
    if (resolved.isRental) {
      orderData.startDate = resolved.startDate;
      orderData.endDate = resolved.endDate;
      orderData.days = resolved.days;
    }

    let order;
    try {
      order = await Order.create(orderData);
    } catch (err) {
      // Two /confirm calls for the same session can race past the findOne
      // check above (e.g. React StrictMode firing the effect twice) before
      // either has inserted. The loser hits the unique index here instead
      // of double-creating the order — treat that the same as the findOne
      // hit above and just return the order the winner already created.
      if (err.code === 11000) {
        const winner = await Order.findOne({ stripeSessionId: sessionId });
        if (winner) return res.json(winner);
      }
      throw err;
    }
    if (!resolved.isRental) {
      await markItemUnavailable(itemType, itemId);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

module.exports = router;
