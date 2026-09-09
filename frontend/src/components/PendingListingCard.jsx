import { resolvePhotoUrl } from '../api/equipmentApi.js';

export function PendingListingCard({ listing, onApprove, onReject }) {
  const photoUrl = resolvePhotoUrl(listing.photoUrl);

  return (
    <div className="equipment-card">
      {photoUrl ? (
        <img src={photoUrl} alt={listing.title} className="equipment-card__photo" />
      ) : (
        <div className="equipment-card__photo equipment-card__photo--placeholder">No photo</div>
      )}
      <div className="equipment-card__body">
        <div className="equipment-card__header">
          <h3>{listing.title}</h3>
          <span className="status-badge status-badge--pending">Pending review</span>
        </div>
        <p className="equipment-card__meta">
          ${listing.price} · {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
          {listing.category ? ` · ${listing.category}` : ''}
        </p>
        <p className="equipment-card__description">{listing.description}</p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={() => onApprove(listing)}>
            Approve
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onReject(listing)}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
