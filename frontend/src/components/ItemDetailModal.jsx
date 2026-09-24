import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import RentalCalendar from './RentalCalendar';
import { ImageIcon } from './icons';
import { getCategoryColor } from '../utils/categoryColor';
import StarRating from './StarRating';

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
  const categoryColor = getCategoryColor(item.category);
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
      const { url } = await api.createCheckoutSession({
        itemType: item.itemType,
        itemId: item._id,
        ...(needsCalendar
          ? { startDate: toDateString(range.start), endDate: toDateString(range.end) }
          : {})
      });
      // Full-page redirect to Stripe's hosted checkout — no Stripe.js needed
      // on our side. Stripe sends them back to /order-success once they pay.
      window.location.href = url;
    } catch (err) {
      setResult({ type: 'error', message: err.message });
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
          <div className="equipment-image-placeholder">
            <span className="image-placeholder-empty"><ImageIcon /> No image</span>
          </div>
        )}

        <h2>{item.name}</h2>
        {item.rating?.count > 0 && (
          <p className="rating-summary">
            <StarRating value={item.rating.average} size={16} /> {item.rating.average} ({item.rating.count} review{item.rating.count === 1 ? '' : 's'})
          </p>
        )}
        <p className="category" style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}>
          {item.category}
        </p>
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
            {placing ? 'Redirecting to checkout…' : isRental ? (needsCalendar && days ? `Rent for $${total}` : 'Rent') : 'Buy'}
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
