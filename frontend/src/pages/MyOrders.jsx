import { useState, useEffect } from 'react';
import { api } from '../api';
import ActivityHistoryTable from '../components/ActivityHistoryTable';
import ReviewModal from '../components/ReviewModal';
import PageHeader from '../components/PageHeader';
import { SkeletonStatRow, SkeletonTable } from '../components/Skeleton';
import { ReceiptIcon } from '../components/icons';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [ratingOrder, setRatingOrder] = useState(null);

  useEffect(() => {
    Promise.all([api.getMyOrders(), api.getMyReviews()])
      .then(([o, r]) => {
        setOrders(o);
        setReviews(r);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const reviewsByOrderId = new Map(reviews.map((r) => [r.order, r]));

  const handleSubmitted = (review) => {
    setReviews((prev) => [...prev, review]);
    setRatingOrder(null);
  };

  return (
    <>
      <div className="dashboard-placeholder">
        <PageHeader icon={<ReceiptIcon />} title="My Orders" subtitle="Everything you've bought or rented." />
        {loadError && <p className="auth-error">{loadError}</p>}
        {loading && (
          <>
            <SkeletonStatRow />
            <SkeletonTable columns={6} />
          </>
        )}
        {!loading && !loadError && (
          <ActivityHistoryTable
            orders={orders}
            showSeller
            perspective="buyer"
            reviewsByOrderId={reviewsByOrderId}
            onRate={setRatingOrder}
          />
        )}
      </div>

      {ratingOrder && (
        <ReviewModal order={ratingOrder} onClose={() => setRatingOrder(null)} onSubmitted={handleSubmitted} />
      )}
    </>
  );
}

export default MyOrders;
