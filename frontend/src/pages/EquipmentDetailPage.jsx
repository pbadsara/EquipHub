import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { resolvePhotoUrl, fetchListingById } from '../api/equipmentApi.js';

export function EquipmentDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchListingById(id)
      .then(({ equipment }) => setListing(equipment))
      .catch((err) => setError(err.message || 'Listing not found.'))
      .finally(() => setLoading(false));
  }, [id]);

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
        <div className="equipment-detail__note">
          <p className="muted">
            Booking &amp; purchase aren't built yet — that's the next phase. For now this page
            just proves the public catalogue and listing detail view work end to end.
          </p>
        </div>
      </Card>
    </div>
  );
}
