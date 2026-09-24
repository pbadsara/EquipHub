import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p className="auth-subtitle">
          {sent
            ? "Check your inbox for a reset link — it's valid for 1 hour."
            : "Enter the email on your account and we'll send you a reset link."}
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}

        <p className="auth-switch">Remembered it? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}

export default ForgotPassword;
