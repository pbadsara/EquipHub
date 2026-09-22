import { resolvePhotoUrl } from '../api/equipmentApi.js';

const STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const CANCELLABLE_STATUSES = ['requested', 'approved'];

export function BookingCard({ booking, onCancel }) {
  const photoUrl = resolvePhotoUrl(booking.equipmentPhotoUrl);
  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);

  return (
    <div className="equipment-card">
      {photoUrl ? (
        <img src={photoUrl} alt={booking.equipmentTitle} className="equipment-card__photo" />
      ) : (
        <div className="equipment-card__photo equipment-card__photo--placeholder">No photo</div>
      )}
      <div className="equipment-card__body">
        <div className="equipment-card__header">
          <h3>{booking.equipmentTitle}</h3>
          <span className={`status-badge status-badge--${booking.status}`}>
            {STATUS_LABELS[booking.status] || booking.status}
          </span>
        </div>
        <p className="equipment-card__meta">
          {booking.type === 'rent' ? 'Rental' : 'Purchase'} · ${booking.price}
        </p>
        {booking.type === 'rent' && (
          <p className="equipment-card__meta">
            {booking.startDate} → {booking.endDate}
          </p>
        )}
        {canCancel && (
          <div className="btn-row">
            <button type="button" className="btn btn--ghost" onClick={() => onCancel(booking)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}