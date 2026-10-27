import { useState } from 'react';
import { createDonation } from '../api/bookingApi.js';

const SUGGESTED_AMOUNTS = [10, 25, 50, 100];

export function DonationForm({ token, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a donation amount greater than $0.');
      return;
    }

    setSubmitting(true);
    try {
      await createDonation(token, { amount: numericAmount, message: message.trim() });
      setSuccess(true);
      setAmount('');
      setMessage('');
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit your donation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="donation-form donation-form--success">
        <p>Thank you — your donation has been recorded.</p>
        <button type="button" className="btn btn--ghost" onClick={() => setSuccess(false)}>
          Make another donation
        </button>
      </div>
    );
  }

  return (
    <form className="donation-form" onSubmit={handleSubmit}>
      <div className="donation-form__amounts">
        {SUGGESTED_AMOUNTS.map((preset) => (
          <button
            type="button"
            key={preset}
            className={`donation-chip ${Number(amount) === preset ? 'donation-chip--active' : ''}`}
            onClick={() => setAmount(String(preset))}
          >
            ${preset}
          </button>
        ))}
      </div>

      <label className="field">
        <span>Amount ($)</span>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Or enter your own amount"
          required
        />
      </label>

      <label className="field">
        <span>Message (optional)</span>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something to Community Resource Network SA…"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Donate'}
      </button>
    </form>
  );
}