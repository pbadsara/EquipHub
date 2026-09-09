import { resolvePhotoUrl } from '../api/equipmentApi.js';

const STATUS_LABELS = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  sold: 'Sold',
};

const EDITABLE_STATUSES = ['pending', 'rejected'];

export function EquipmentCard({ listing, onEdit, onDelete }) {
  const photoUrl = resolvePhotoUrl(listing.photoUrl);
  const canEdit = EDITABLE_STATUSES.includes(listing.status);

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
          <span className={`status-badge status-badge--${listing.status}`}>
            {STATUS_LABELS[listing.status] || listing.status}
          </span>
        </div>
        <p className="equipment-card__meta">
          ${listing.price} · {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
          {listing.category ? ` · ${listing.category}` : ''}
        </p>
        <p className="equipment-card__description">{listing.description}</p>
        {listing.status === 'rejected' && listing.rejectionReason && (
          <p className="form-error">Reason: {listing.rejectionReason}</p>
        )}
        {listing.status === 'pending' && (
          <p className="muted">Waiting on admin review — not visible in the public catalogue yet.</p>
        )}
        {canEdit && (
          <div className="btn-row">
            <button type="button" className="btn btn--ghost" onClick={() => onEdit(listing)}>
              Edit
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onDelete(listing)}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
