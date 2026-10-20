import { useState, useEffect } from 'react';
import { api } from '../api';
import ActivityHistoryTable from '../components/ActivityHistoryTable';
import PageHeader from '../components/PageHeader';
import { SkeletonStatRow, SkeletonTable } from '../components/Skeleton';
import { ClockIcon } from '../components/icons';

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
      <PageHeader icon={<ClockIcon />} title="Activity History" subtitle="Every sale and rental on your listings." />
      {loadError && <p className="auth-error">{loadError}</p>}
      {loading && (
        <>
          <SkeletonStatRow />
          <SkeletonTable columns={5} />
        </>
      )}
      {!loading && !loadError && <ActivityHistoryTable orders={orders} showSeller={false} />}
    </div>
  );
}

export default SellerActivityHistory;
