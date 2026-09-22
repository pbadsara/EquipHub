import { useEffect, useState } from 'react';
import { AvailabilityCalendar } from './AvailabilityCalendar.jsx';
import { fetchEquipmentBookings, createBooking } from '../api/bookingApi.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Returns true if [aStart, aEnd] overlaps any range in bookedRanges.
function overlapsExisting(startDate, endDate, bookedRanges) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return bookedRanges.some(({ startDate: bStart, endDate: bEnd }) => {
    const existingStart = new Date(bStart);
    const existingEnd = new Date(bEnd || bStart);
    return start <= existingEnd && end >= existingStart;
  });
}

export function BookingForm({ listing, token, onSuccess }) {
  const isRental = listing.listingType === 'rent';

  const [bookedRanges, setBookedRanges] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(isRental);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isRental) return;
    let cancelled = false;
    fetchEquipmentBookings(listing.id)
      .then(({ bookings }) => {
        if (!cancelled) setBookedRanges(bookings);
      })
      .catch(() => {
        // Non-fatal — the calendar just shows nothing booked if this fails.
        if (!cancelled) setBookedRanges([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRanges(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isRental, listing.id]);

  async function handleRentSubmit(e) {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please choose both a start and end date.');
      return;
    }
    if (endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }
    if (startDate < todayIso()) {
      setError('Start date can\'t be in the past.');
      return;
    }
    if (overlapsExisting(startDate, endDate, bookedRanges)) {
      setError('Those dates overlap an existing booking. Please pick different dates.');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking(token, { equipmentId: listing.id, type: 'rent', startDate, endDate });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit your booking request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePurchase() {
    setError('');
    setSubmitting(true);
    try {
      await createBooking(token, { equipmentId: listing.id, type: 'purchase' });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit your purchase request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="booking-form booking-form--success">
        <p>
          {isRental
            ? 'Your booking request has been submitted and is awaiting approval.'
            : 'Your purchase request has been submitted and is awaiting confirmation.'}
        </p>
      </div>
    );
  }

  if (!isRental) {
    return (
      <div className="booking-form">
        <p className="muted">This item is listed for sale at ${listing.price}.</p>
        {error && <p className="form-error">{error}</p>}
        <button type="button" className="btn btn--primary" onClick={handlePurchase} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Buy now'}
        </button>
      </div>
    );
  }

  return (
    <div className="booking-form">
      {loadingRanges ? (
        <p className="muted">Checking availability…</p>
      ) : (
        <AvailabilityCalendar bookedRanges={bookedRanges} />
      )}

      <form onSubmit={handleRentSubmit}>
        <div className="booking-form__dates">
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              min={todayIso()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>End date</span>
            <input
              type="date"
              min={startDate || todayIso()}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
        </div>

        <p className="muted">${listing.price} per day</p>
        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Request to rent'}
        </button>
      </form>
    </div>
  );
}