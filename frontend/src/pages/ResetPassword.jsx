import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Those passwords don’t match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Invalid link</h1>
          <p className="auth-subtitle">This reset link is missing its token.</p>
          <p className="auth-switch"><Link to="/forgot-password">Request a new one</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Choose a new password</h1>
        <p className="auth-subtitle">{done ? 'Your password has been updated.' : 'Enter a new password for your account.'}</p>

        {!done && (
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Reset password'}</button>
          </form>
        )}

        <p className="auth-switch">
          {done ? <Link to="/login">Go to log in</Link> : <>Remembered it? <Link to="/login">Log in</Link></>}
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
