import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Stub for now — listing creation/management with the price cap comes in
// build-plan step 3, and status tracking in step 6.
export function SellerDashboard() {
  const { token, user } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch(`${API_URL}/dashboard/seller`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? setStatus('ok') : setStatus('error')))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="page">
      <Card title={`Welcome, ${user.name}`}>
        <p>Seller dashboard — create and manage your equipment listings here once inventory management ships.</p>
        <p className="muted">Backend connectivity check: {status === 'loading' ? 'checking…' : status === 'ok' ? 'connected ✓' : 'failed'}</p>
      </Card>
    </div>
  );
}
