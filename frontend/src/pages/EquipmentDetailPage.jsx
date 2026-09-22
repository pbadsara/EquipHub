import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { BookingForm } from '../components/BookingForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { resolvePhotoUrl, fetchListingById } from '../api/equipmentApi.js';

export function EquipmentDetailPage() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadListing() {
    setLoading(true);
    setError('');
    fetchListingById(id)
      .then(({ equipment }) => setListing(equipment))
      .catch((err) => setError(err.message || 'Listing not found.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadListing, [id]);

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;
  if (error) {
    return (
      <div className="page">
        <p className="form-error">{error}</p>
        <Link to="/catalogue">Back to catalogue</Link>
      </div>
    );
  }

  const photoUrl = resolvePhotoUrl(listing.photoUrl);
  const isOwnListing = user && listing.seller === user.id;

  return (
    <div className="page">
      <Card>
        {photoUrl ? (
          <img src={photoUrl} alt={listing.title} className="equipment-detail__photo" />
        ) : (
          <div className="equipment-detail__photo equipment-card__photo--placeholder">No photo</div>
        )}
        <h1>{listing.title}</h1>
        <p className="equipment-card__meta">
          ${listing.price} · {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
          {listing.category ? ` · ${listing.category}` : ''}
        </p>
        <p>{listing.description}</p>
      </Card>

      <Card title={listing.listingType === 'rent' ? 'Request to rent' : 'Purchase this item'} className="card--form">
        {listing.status !== 'approved' && (
          <p className="muted">This listing isn't currently available for booking.</p>
        )}

        {listing.status === 'approved' && isOwnListing && (
          <p className="muted">This is your own listing.</p>
        )}

        {listing.status === 'approved' && !isOwnListing && !isAuthenticated && (
          <p className="muted">
            <Link to="/login">Log in</Link> as a Renter/Buyer to book or purchase this item.
          </p>
        )}

        {listing.status === 'approved' && !isOwnListing && isAuthenticated && user.role !== 'renter' && (
          <p className="muted">Only Renter/Buyer accounts can book or purchase equipment.</p>
        )}

        {listing.status === 'approved' && !isOwnListing && isAuthenticated && user.role === 'renter' && (
          <BookingForm listing={listing} token={token} onSuccess={loadListing} />
        )}
      </Card>
    </div>
  );
}