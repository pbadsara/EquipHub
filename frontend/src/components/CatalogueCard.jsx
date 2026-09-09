import { Link } from 'react-router-dom';
import { resolvePhotoUrl } from '../api/equipmentApi.js';

export function CatalogueCard({ listing }) {
  const photoUrl = resolvePhotoUrl(listing.photoUrl);

  return (
    <Link to={`/catalogue/${listing.id}`} className="equipment-card equipment-card--link">
      {photoUrl ? (
        <img src={photoUrl} alt={listing.title} className="equipment-card__photo" />
      ) : (
        <div className="equipment-card__photo equipment-card__photo--placeholder">No photo</div>
      )}
      <div className="equipment-card__body">
        <h3>{listing.title}</h3>
        <p className="equipment-card__meta">
          ${listing.price} · {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
          {listing.category ? ` · ${listing.category}` : ''}
        </p>
      </div>
    </Link>
  );
}
