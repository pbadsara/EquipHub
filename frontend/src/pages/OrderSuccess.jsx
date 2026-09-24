import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError('Missing checkout session.');
      setLoading(false);
      return;
    }
    api.confirmPayment(sessionId)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        {loading && (
          <>
            <h1>Confirming your payment…</h1>
            <p className="auth-subtitle">This only takes a second.</p>
          </>
        )}

        {!loading && error && (
          <>
            <h1>Something went wrong</h1>
            <p className="auth-error" style={{ marginTop: 16 }}>{error}</p>
            <p className="auth-switch"><Link to="/browse">Back to browsing</Link></p>
          </>
        )}

        {!loading && !error && order && (
          <>
            <h1>{order.startDate ? 'Rental booked!' : 'Purchase complete!'}</h1>
            <p className="auth-subtitle">The seller will be in touch.</p>
            <p style={{ textAlign: 'center', marginTop: 16 }}>
              <strong>{order.name}</strong> — ${order.price}
            </p>
            <p className="auth-switch"><Link to="/my-orders">View my orders</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderSuccess;
