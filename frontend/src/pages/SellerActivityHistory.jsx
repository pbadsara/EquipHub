import { useState, useEffect } from 'react';
import { api } from '../api';
import ActivityHistoryTable from '../components/ActivityHistoryTable';

function SellerActivityHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.getSellerActivityHistory()
      .then(setOrders)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-placeholder">
      <h1>Activity History</h1>
      {loading && <p>Loading…</p>}
      {loadError && <p className="auth-error">{loadError}</p>}
      {!loading && !loadError && <ActivityHistoryTable orders={orders} showSeller={false} />}
    </div>
  );
}

export default SellerActivityHistory;
