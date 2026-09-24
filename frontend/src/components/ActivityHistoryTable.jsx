function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Renders a seller's or (with showSeller) the whole site's order history:
// every completed sale or rental request against a listing, what it was
// (sold outright vs rented for a date range), and what it earned.
function ActivityHistoryTable({ orders, showSeller }) {
  if (orders.length === 0) {
    return <p>No sales or rentals yet.</p>;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);

  return (
    <>
      <table className="category-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            {showSeller && <th>Seller</th>}
            <th>Sold or rented</th>
            <th>Rental dates</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isRental = Boolean(order.startDate);
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
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="activity-total">Total revenue: ${totalRevenue}</p>
    </>
  );
}

export default ActivityHistoryTable;
