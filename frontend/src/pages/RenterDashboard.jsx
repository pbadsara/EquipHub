import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Stub for now — catalogue browsing, booking and donations come in
// build-plan step 4.
export function RenterDashboard() {
  const { token, user } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch(`${API_URL}/dashboard/renter`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? setStatus('ok') : setStatus('error')))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="page">
      <Card title={`Welcome, ${user.name}`}>
        <p>Renter/Buyer dashboard — browse the equipment catalogue, book items, and donate here once those features ship.</p>
        <p className="muted">Backend connectivity check: {status === 'loading' ? 'checking…' : status === 'ok' ? 'connected ✓' : 'failed'}</p>
      </Card>
    </div>
  );
}
