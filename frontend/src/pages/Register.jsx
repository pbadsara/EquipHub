import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = { admin: '/admin/categories', seller: '/seller/listings', renter: '/' };

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
      <div className="auth-card">
        <h1>EquipHub</h1>
        <p className="auth-subtitle">Create your account</p>

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
  );
}

export default Register;
