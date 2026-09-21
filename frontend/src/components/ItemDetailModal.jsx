import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

function ItemDetailModal({ item, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', message }

  const canBuy = isAuthenticated && user.role === 'renter';

  const handleBuy = async () => {
    setPlacing(true);
    setResult(null);
    try {
      await api.createOrder({
        itemType: item.itemType,
        itemId: item._id,
        name: item.name,
        price: item.hireRate.amount
      });
      setResult({ type: 'success', message: 'Purchase request sent! The seller will be in touch.' });
    } catch (err) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {item.images.length > 0 ? (
          <div className="modal-images">
            {item.images.map((src, i) => (
              <img key={i} src={src} alt={`${item.name} photo ${i + 1}`} />
            ))}
          </div>
        ) : (
          <div className="equipment-image-placeholder"><span>No image</span></div>
        )}

        <h2>{item.name}</h2>
        <p className="category">{item.category}</p>
        <p>{item.description}</p>
        <p className="price">
          ${item.hireRate.amount} / {item.hireRate.period.replace('per_', '')}
        </p>
        {item.depositAmount > 0 && <p className="deposit">Deposit: ${item.depositAmount}</p>}

        {!isAuthenticated && <p className="field-hint">Log in as a buyer to purchase this item.</p>}
        {isAuthenticated && !canBuy && <p className="field-hint">Only buyer accounts can purchase items.</p>}

        {canBuy && !result && (
          <button onClick={handleBuy} disabled={placing}>
            {placing ? 'Placing order…' : 'Buy'}
          </button>
        )}

        {result && (
          <p className={result.type === 'success' ? 'order-success' : 'auth-error'}>{result.message}</p>
        )}
      </div>
    </div>
  );
}

export default ItemDetailModal;
