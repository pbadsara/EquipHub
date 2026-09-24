import { useState, useEffect } from 'react';
import { api } from '../api';
import ActivityHistoryTable from '../components/ActivityHistoryTable';

function AdminActivityHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.getAdminActivityHistory()
      .then(setOrders)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-placeholder">
      <h1>Activity History</h1>
      <p className="auth-subtitle">Every sale and rental across all sellers.</p>
      {loading && <p>Loading…</p>}
      {loadError && <p className="auth-error">{loadError}</p>}
      {!loading && !loadError && <ActivityHistoryTable orders={orders} showSeller />}
    </div>
  );
}

export default AdminActivityHistory;
