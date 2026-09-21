function EquipmentCard({ item, onClick }) {
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
          <span>No image</span>
        )}
      </div>
      <h3>{item.name}</h3>
      <p className="category">{item.category}</p>
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