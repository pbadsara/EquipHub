import { useState } from 'react';
import { api } from '../api';
import StarRating from './StarRating';

// Rendered as a sibling of the page's own content (not nested inside it),
// same reasoning as every other modal in the app — an overlay shouldn't
// inherit styling meant for whatever container happens to render it.
function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) {
      setError('Pick a star rating first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const review = await api.createReview({ orderId: order._id, rating, comment });
      onSubmitted(review);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2>Rate {order.name}</h2>
        <p>How was your {order.startDate ? 'rental' : 'purchase'}?</p>

        <StarRating value={rating} onChange={setRating} size={28} />

        <textarea
          className="review-comment"
          placeholder="Optional comment…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="modal-buy-button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}

export default ReviewModal;
