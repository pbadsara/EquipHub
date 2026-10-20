import { ImageIcon } from './icons';
import { getCategoryColor } from '../utils/categoryColor';
import StarRating from './StarRating';

function EquipmentCard({ item, onClick }) {
  const categoryColor = getCategoryColor(item.category);

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="equipment-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="equipment-image-placeholder">
        {item.images.length > 0 ? (
          <img src={item.images[0]} alt={item.name} />
        ) : (
          <span className="image-placeholder-empty"><ImageIcon /> No image</span>
        )}
      </div>
      <h3>{item.name}</h3>
      {item.rating?.count > 0 && (
        <p className="rating-summary">
          <StarRating value={item.rating.average} size={14} /> {item.rating.average} ({item.rating.count})
        </p>
      )}
      <p className="category" style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}>
        {item.category}
      </p>
      {item.listingType && (
        <p className={`listing-type-tag listing-type-${item.listingType}`}>
          {item.listingType === 'sale' ? 'For sale' : 'For rent'}
        </p>
      )}
      <p>{item.description}</p>
      <p className="price">
        ${item.hireRate.amount} / {item.hireRate.period.replace('per_', '')}
      </p>
      {item.depositAmount > 0 && (
        <p className="deposit">Deposit: ${item.depositAmount}</p>
      )}
    </div>
  );
}

export default EquipmentCard;