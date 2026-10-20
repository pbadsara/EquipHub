import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StoreIcon, UserIcon, ShieldCheckIcon } from '../components/icons';

const ROLE_HOME = { admin: '/admin/categories', seller: '/seller/listings', renter: '/browse' };

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('renter'); // admin deliberately not selectable — see backend/routes/auth.js
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(name, email, password, role);
      navigate(ROLE_HOME[user.role] || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-split-brand">
          <Link to="/" className="auth-split-logo">EquipHub</Link>
          <h2>Join the community</h2>
          <p>Create a free account to start browsing, renting, buying or selling equipment.</p>
          <ul className="auth-split-points">
            <li><UserIcon /> Buy or rent from local sellers</li>
            <li><StoreIcon /> List your own gear in minutes</li>
            <li><ShieldCheckIcon /> Every listing reviewed before it's live</li>
          </ul>
        </div>

        <div className="auth-split-form">
          <div className="auth-card">
            <h1>Create your account</h1>
            <p className="auth-subtitle">It only takes a minute</p>

            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />

              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />

              <label htmlFor="role">I want to</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="renter">Browse &amp; rent/buy equipment</option>
                <option value="seller">List my own equipment</option>
              </select>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Sign Up'}</button>
            </form>

            <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
