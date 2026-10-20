import StatCard from './StatCard';
import EmptyState from './EmptyState';
import StarRating from './StarRating';
import { ClockIcon } from './icons';

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Renders an order history table — seller's own listings, the whole site
// (admin, with showSeller), or a buyer's own purchases/rentals
// (perspective="buyer"). Same shape either way: what it was (sold outright
// vs rented for a date range) and what it cost/earned — perspective just
// swaps a few labels ("revenue" vs "spent") since the same $ column means
// opposite things to a seller and a buyer.
function ActivityHistoryTable({ orders, showSeller, perspective = 'seller', reviewsByOrderId, onRate }) {
  const isBuyer = perspective === 'buyer';
  const showReview = isBuyer && Boolean(onRate);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon />}
        message={isBuyer ? "You haven't bought or rented anything yet." : 'No sales or rentals yet.'}
        hint={isBuyer ? 'Items you buy or rent will show up here.' : 'Completed orders on your listings will show up here.'}
      />
    );
  }

  const totalAmount = orders.reduce((sum, o) => sum + o.price, 0);
  const soldCount = orders.filter((o) => !o.startDate).length;
  const rentedCount = orders.filter((o) => o.startDate).length;

  return (
    <>
      <div className="stat-row">
        <StatCard label={isBuyer ? 'Total spent' : 'Total revenue'} value={`$${totalAmount}`} />
        <StatCard label={isBuyer ? 'Items bought' : 'Items sold'} value={soldCount} tone="sold" />
        <StatCard label="Rentals booked" value={rentedCount} tone="rented" />
      </div>

      <table className="category-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            {showSeller && <th>Seller</th>}
            <th>Sold or rented</th>
            <th>Rental dates</th>
            <th>{isBuyer ? 'Price paid' : 'Revenue'}</th>
            {showReview && <th>Your review</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isRental = Boolean(order.startDate);
            const review = reviewsByOrderId?.get(order._id);
            return (
              <tr key={order._id}>
                <td>{formatDate(order.createdAt)}</td>
                <td>{order.name}</td>
                {showSeller && <td>{order.sellerName}</td>}
                <td>{isRental ? 'Rented' : 'Sold'}</td>
                <td>
                  {isRental
                    ? `${formatDate(order.startDate)} – ${formatDate(order.endDate)} (${order.days} day${order.days === 1 ? '' : 's'})`
                    : '—'}
                </td>
                <td>${order.price}</td>
                {showReview && (
                  <td>
                    {order.itemType !== 'listing' ? (
                      '—'
                    ) : review ? (
                      <StarRating value={review.rating} />
                    ) : (
                      <button type="button" onClick={() => onRate(order)}>Rate</button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default ActivityHistoryTable;
