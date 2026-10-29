# EquipHub Booking and Cancellation Policy

Payments run in Stripe test mode, so no real money is taken.

## 1. Booking Conditions

- A rental needs a valid start date and end date. Both days count, so a one day rental has the same start and end date.
- The start date cannot be in the past, and the end date cannot be before the start date.
- The item must be free on every selected day. If any day is already booked, the booking is refused. Booked days are blocked on the calendar.
- The price is the number of days times the daily price. It is shown before payment.
- A booking is confirmed as soon as the payment succeeds. The equipment owner does not need to approve it.
- Users should check the item details and the Stripe payment page before paying.

## 2. Cancellation Rules

- A booking cannot be cancelled on the site in this version.
- The original organisation equipment records have text fields for booking conditions and a cancellation policy. They only store text and are not enforced by the site.

## 3. Refund Policy

- If an item is sold or booked by someone else while a buyer is paying, the buyer is refunded in full automatically. The refund goes back to the original payment method through Stripe.
- No other refunds are available in this version.

## 4. Booking Approval

- Owner approval is not required. A paid booking is confirmed straight away.
- Paid bookings block overlapping dates, so the same item cannot be booked twice for the same day.
- The booking appears in order history for the buyer, the seller and the admin.

## Summary

| Rule | Status |
|---|---|
| Valid start and end dates | Built |
| Item must be available for the dates | Built |
| Overlapping bookings blocked | Built |
| Price shown before payment | Built |
| Automatic refund if the item is taken during payment | Built |
| Order history for buyer, seller and admin | Built |