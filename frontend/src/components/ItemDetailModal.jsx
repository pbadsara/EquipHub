import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import RentalCalendar from './RentalCalendar';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetweenInclusive(start, end) {
  return Math.round((end - start) / DAY_MS) + 1;
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// A rental date is a calendar day, not a moment in time — sending
// `.toISOString()` would convert the locally-picked midnight into UTC and
// can land on the wrong day depending on the browser's timezone offset.
// Sending the plain Y-M-D the user actually clicked avoids that entirely.
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ItemDetailModal({ item, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', message }

  const canBuy = isAuthenticated && user.role === 'renter';
  const isRental = item.listingType === 'rent';
  // Date-range booking only applies to rental seller listings — the legacy
  // Equipment catalogue has its own per_day/per_hour/per_weekend rates and
  // isn't part of this booking system.
  const needsCalendar = item.itemType === 'listing' && isRental;

  const [bookedRanges, setBookedRanges] = useState([]);
  const [datesLoading, setDatesLoading] = useState(needsCalendar);
  const [datesError, setDatesError] = useState('');
  const [range, setRange] = useState({ start: null, end: null, error: null });

  useEffect(() => {
    if (!needsCalendar) return;
    setDatesLoading(true);
    api.getBookedDates(item.itemType, item._id)
      .then(setBookedRanges)
      .catch((err) => setDatesError(err.message))
      .finally(() => setDatesLoading(false));
  }, [needsCalendar, item.itemType, item._id]);

  const days = needsCalendar && range.start && range.end ? daysBetweenInclusive(range.start, range.end) : 0;
  const total = needsCalendar ? item.hireRate.amount * days : item.hireRate.amount;
  const canSubmit = needsCalendar ? Boolean(range.start && range.end && !range.error) : true;

  const handleBuy = async () => {
    setPlacing(true);
    setResult(null);
    try {
      await api.createOrder({
        itemType: item.itemType,
        itemId: item._id,
        ...(needsCalendar
          ? { startDate: toDateString(range.start), endDate: toDateString(range.end) }
          : {})
      });
      setResult({
        type: 'success',
        message: isRental
          ? 'Rental request sent! The seller will be in touch.'
          : 'Purchase request sent! The seller will be in touch.'
      });
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {item.images.length > 0 ? (
          <div className="modal-images">
            {item.images.map((src, i) => (
              <img key={i} src={src} alt={`${item.name} photo ${i + 1}`} />
            ))}
          </div>
        ) : (
          <div className="equipment-image-placeholder"><span>No image</span></div>
        )}

        <h2>{item.name}</h2>
        <p className="category">{item.category}</p>
        {item.listingType && (
          <p className={`listing-type-tag listing-type-${item.listingType}`}>
            {isRental ? 'For rent' : 'For sale'}
          </p>
        )}
        <p>{item.description}</p>
        <p className="price">
          ${item.hireRate.amount} / {item.hireRate.period.replace('per_', '')}
        </p>
        {item.depositAmount > 0 && <p className="deposit">Deposit: ${item.depositAmount}</p>}

        {needsCalendar && !result && (
          <div className="rental-booking">
            <h3>Pick your rental dates</h3>
            {datesLoading && <p className="field-hint">Checking availability…</p>}
            {datesError && <p className="auth-error">{datesError}</p>}
            {!datesLoading && !datesError && (
              <>
                <RentalCalendar bookedRanges={bookedRanges} range={range} onChange={setRange} />
                {range.error && <p className="field-comment">{range.error}</p>}
                {range.start && range.end && (
                  <p className="rental-summary">
                    {formatDate(range.start)} – {formatDate(range.end)} · {days} day{days === 1 ? '' : 's'} · ${total} total
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {!isAuthenticated && <p className="field-hint">Log in as a buyer to purchase this item.</p>}
        {isAuthenticated && !canBuy && <p className="field-hint">Only buyer accounts can purchase items.</p>}

        {canBuy && !result && (
          <button className="modal-buy-button" onClick={handleBuy} disabled={placing || !canSubmit}>
            {placing ? 'Placing order…' : isRental ? (needsCalendar && days ? `Rent for $${total}` : 'Rent') : 'Buy'}
          </button>
        )}

        {result && (
          <p className={result.type === 'success' ? 'order-success' : 'auth-error'}>{result.message}</p>
        )}
      </div>
    </div>
  );
}

export default ItemDetailModal;
