import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Stub for now — approve/reject listings, manage inventory & price caps, and
// full booking/donation visibility come in build-plan steps 3 & 5.
export function AdminDashboard() {
  const { token, user } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch(`${API_URL}/dashboard/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? setStatus('ok') : setStatus('error')))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="page">
      <Card title={`Welcome, ${user.name}`}>
        <p>Admin dashboard — inventory approval, pricing caps, and full booking/donation reporting will live here.</p>
        <p className="muted">Backend connectivity check: {status === 'loading' ? 'checking…' : status === 'ok' ? 'connected ✓' : 'failed'}</p>
      </Card>
    </div>
  );
}
