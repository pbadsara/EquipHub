import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';

// Admin is deliberately not offered here — accounts with the admin role are
// created only via the backend's controlled seed script (see brief Section 2 & 6.2).
const ROLE_OPTIONS = [
  { value: 'renter', label: 'Renter / Buyer — browse & rent equipment' },
  { value: 'seller', label: 'Seller — list equipment for rent or sale' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'renter' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { user } = await register(form);
      navigate(`/dashboard/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--centered">
      <Card title="Create your EquipHub account" className="card--form">
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </label>
          <fieldset className="field">
            <legend>I want to join as</legend>
            {ROLE_OPTIONS.map((opt) => (
              <label key={opt.value} className="radio-option">
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={form.role === opt.value}
                  onChange={handleChange}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </fieldset>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="form-footnote">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
