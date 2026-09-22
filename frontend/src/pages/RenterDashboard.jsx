import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';
import { BookingCard } from '../components/BookingCard.jsx';
import { DonationForm } from '../components/DonationForm.jsx';
import { fetchMyBookings, cancelBooking, fetchMyDonations } from '../api/bookingApi.js';

export function RenterDashboard() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('bookings'); // 'bookings' | 'donate'

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      const { bookings } = await fetchMyBookings(token);
      setBookings(bookings);
    } catch (err) {
      setBookingsError(err.message || 'Failed to load your bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  const loadDonations = useCallback(async () => {
    setDonationsLoading(true);
    try {
      const { donations } = await fetchMyDonations(token);
      setDonations(donations);
    } catch {
      setDonations([]);
    } finally {
      setDonationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBookings();
    loadDonations();
  }, [loadBookings, loadDonations]);

  async function handleCancel(booking) {
    if (!window.confirm(`Cancel your ${booking.type === 'rent' ? 'booking' : 'purchase'} for "${booking.equipmentTitle}"?`)) return;
    await cancelBooking(token, booking.id);
    await loadBookings();
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <div className="tab-row">
          <button
            type="button"
            className={`tab-button ${tab === 'bookings' ? 'tab-button--active' : ''}`}
            onClick={() => setTab('bookings')}
          >
            My Bookings
          </button>
          <button
            type="button"
            className={`tab-button ${tab === 'donate' ? 'tab-button--active' : ''}`}
            onClick={() => setTab('donate')}
          >
            Donate
          </button>
        </div>
      </div>

      {tab === 'bookings' && (
        <>
          {bookingsLoading && <p className="muted">Loading your bookings…</p>}
          {bookingsError && <p className="form-error">{bookingsError}</p>}
          {!bookingsLoading && !bookingsError && bookings.length === 0 && (
            <Card>
              <p>You haven't booked or purchased anything yet.</p>
            </Card>
          )}
          {!bookingsLoading && bookings.length > 0 && (
            <div className="equipment-grid">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'donate' && (
        <Card title="Support Community Resource Network SA" className="card--form">
          <DonationForm token={token} onSuccess={loadDonations} />
          {!donationsLoading && donations.length > 0 && (
            <div className="donation-history">
              <h3>Your donation history</h3>
              {donations.map((d) => (
                <p key={d.id} className="muted">
                  ${d.amount} — {new Date(d.createdAt).toLocaleDateString('en-AU')}
                  {d.message ? ` — "${d.message}"` : ''}
                </p>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}