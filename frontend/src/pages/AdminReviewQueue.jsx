import { useState, useEffect } from 'react';
import { api } from '../api';

const FIELDS = [
  { key: 'name', label: 'Item name' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'images', label: 'Images' },
  { key: 'listingType', label: 'For sale or rent' }
];

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
};

function fieldDisplayValue(listing, key) {
  const value = listing[key].value;
  if (key === 'category') return value?.name ? `${value.name} (cap $${value.maxPrice})` : value;
  if (key === 'price') return `$${value}`;
  if (key === 'images') return Array.isArray(value) && value.length ? value.join(', ') : '(none provided)';
  if (key === 'listingType') return value === 'sale' ? 'For sale' : value === 'rent' ? 'For rent' : value;
  return value;
}

// One row per reviewable field: shows the seller's current value and its
// status. A field that's already approved is read-only — it was decided on
// a previous round and doesn't need the admin to act on it again. Only
// fields still pending (freshly submitted/edited) or rejected show the
// approve/reject controls. Rejecting reveals a required comment box — the
// review can't be submitted for that field until a reason is entered.
function ReviewFieldRow({ label, fieldKey, listing, decision, onDecide }) {
  const current = listing[fieldKey];

  return (
    <div className="review-field-row">
      <div className="review-field-header">
        <strong>{label}</strong>
        <span className={`field-badge field-badge-${current.status}`}>{STATUS_LABEL[current.status]}</span>
      </div>
      <p className="review-field-value">{fieldDisplayValue(listing, fieldKey)}</p>

      {current.status === 'approved' ? (
        <p className="field-hint">Approved on a previous round — no action needed.</p>
      ) : (
        <>
          <div className="review-field-actions">
            <label>
              <input
                type="radio"
                name={`${listing._id}-${fieldKey}`}
                checked={decision?.status === 'approved'}
                onChange={() => onDecide(fieldKey, { status: 'approved', comment: '' })}
              />
              Approve
            </label>
            <label>
              <input
                type="radio"
                name={`${listing._id}-${fieldKey}`}
                checked={decision?.status === 'rejected'}
                onChange={() => onDecide(fieldKey, { status: 'rejected', comment: decision?.comment || '' })}
              />
              Reject
            </label>
          </div>

          {decision?.status === 'rejected' && (
            <textarea
              className="review-comment-box"
              placeholder="Explain what needs to change (required)"
              value={decision.comment}
              onChange={(e) => onDecide(fieldKey, { status: 'rejected', comment: e.target.value })}
            />
          )}
        </>
      )}
    </div>
  );
}

function ListingReviewCard({ listing, onReviewed }) {
  // decisions: { [fieldKey]: { status, comment } } — only fields the admin
  // has actually made a choice on this round; fields left blank aren't sent.
  const [decisions, setDecisions] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDecide = (key, decision) => setDecisions((d) => ({ ...d, [key]: decision }));

  const handleSubmit = async () => {
    setError('');
    const entries = Object.entries(decisions);
    if (entries.length === 0) {
      setError('Make a decision on at least one field before submitting.');
      return;
    }
    const missingComment = entries.find(([, d]) => d.status === 'rejected' && !d.comment.trim());
    if (missingComment) {
      setError(`Please add a comment explaining why "${missingComment[0]}" is being rejected.`);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api.reviewListing(listing._id, decisions);
      onReviewed(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card review-card">
      <h2>{listing.name.value}</h2>
      <p className="auth-subtitle">Submitted by {listing.seller?.name || 'seller'}</p>

      {FIELDS.map(({ key, label }) => (
        <ReviewFieldRow
          key={key}
          label={label}
          fieldKey={key}
          listing={listing}
          decision={decisions[key]}
          onDecide={handleDecide}
        />
      ))}

      {error && <p className="auth-error">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review decisions'}
      </button>
    </div>
  );
}

function AdminReviewQueue() {
  const [queue, setQueue] = useState([]);
  const [loadError, setLoadError] = useState('');

  const load = () => {
    api.getReviewQueue().then(setQueue).catch((err) => setLoadError(err.message));
  };

  useEffect(() => { load(); }, []);

  const handleReviewed = () => load();

  return (
    <div className="dashboard-placeholder">
      <h1>Listings Awaiting Review</h1>
      {loadError && <p className="auth-error">{loadError}</p>}
      {queue.length === 0 && !loadError && <p>Nothing waiting on you right now.</p>}

      {queue.map((listing) => (
        <ListingReviewCard key={listing._id} listing={listing} onReviewed={handleReviewed} />
      ))}
    </div>
  );
}

export default AdminReviewQueue;
