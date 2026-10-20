import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheckIcon, CalendarIcon, SearchIcon } from '../components/icons';

const ROLE_HOME = { admin: '/admin/categories', seller: '/seller/listings', renter: '/browse' };

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const redirectTo = location.state?.from || ROLE_HOME[user.role] || '/';
      navigate(redirectTo, { replace: true });
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
          <h2>Welcome back</h2>
          <p>Log in to manage your listings, bookings and orders — all in one place.</p>
          <ul className="auth-split-points">
            <li><ShieldCheckIcon /> Reviewed listings you can trust</li>
            <li><CalendarIcon /> Book exact rental dates</li>
            <li><SearchIcon /> Track every sale and rental</li>
          </ul>
        </div>

        <div className="auth-split-form">
          <div className="auth-card">
            <h1>Log in</h1>
            <p className="auth-subtitle">Enter your details to continue</p>

            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />

              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <p className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></p>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Log In'}</button>
            </form>

            <p className="auth-switch">Don&apos;t have an account? <Link to="/register">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
