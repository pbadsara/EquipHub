import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';
import { PendingListingCard } from '../components/PendingListingCard.jsx';
import { fetchPendingListings, approveListing, rejectListing } from '../api/equipmentApi.js';
import { fetchPriceCap, updatePriceCap } from '../api/settingsApi.js';

export function AdminDashboard() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('pending'); // 'pending' | 'priceCap'

  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');

  const [priceCap, setPriceCap] = useState(null);
  const [priceCapInput, setPriceCapInput] = useState('');
  const [priceCapLoading, setPriceCapLoading] = useState(true);
  const [priceCapError, setPriceCapError] = useState('');
  const [priceCapSaving, setPriceCapSaving] = useState(false);
  const [priceCapSaved, setPriceCapSaved] = useState(false);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    setPendingError('');
    try {
      const { equipment } = await fetchPendingListings(token);
      setPending(equipment);
    } catch (err) {
      setPendingError(err.message || 'Failed to load the review queue.');
    } finally {
      setPendingLoading(false);
    }
  }, [token]);

  const loadPriceCap = useCallback(async () => {
    setPriceCapLoading(true);
    setPriceCapError('');
    try {
      const { maxListingPrice } = await fetchPriceCap(token);
      setPriceCap(maxListingPrice);
      setPriceCapInput(String(maxListingPrice));
    } catch (err) {
      setPriceCapError(err.message || 'Failed to load the price cap.');
    } finally {
      setPriceCapLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPending();
    loadPriceCap();
  }, [loadPending, loadPriceCap]);

  async function handleApprove(listing) {
    await approveListing(token, listing.id);
    await loadPending();
  }

  async function handleReject(listing) {
    const reason = window.prompt(`Reason for rejecting "${listing.title}"?`, '');
    if (reason === null) return; // cancelled
    await rejectListing(token, listing.id, reason);
    await loadPending();
  }

  async function handlePriceCapSubmit(e) {
    e.preventDefault();
    setPriceCapError('');
    setPriceCapSaving(true);
    setPriceCapSaved(false);
    try {
      const { maxListingPrice } = await updatePriceCap(token, Number(priceCapInput));
      setPriceCap(maxListingPrice);
      setPriceCapSaved(true);
    } catch (err) {
      setPriceCapError(err.message || 'Failed to update the price cap.');
    } finally {
      setPriceCapSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <div className="tab-row">
          <button
            type="button"
            className={`tab-button ${tab === 'pending' ? 'tab-button--active' : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending Review{pending.length > 0 ? ` (${pending.length})` : ''}
          </button>
          <button
            type="button"
            className={`tab-button ${tab === 'priceCap' ? 'tab-button--active' : ''}`}
            onClick={() => setTab('priceCap')}
          >
            Price Cap
          </button>
        </div>
      </div>

      {tab === 'pending' && (
        <>
          {pendingLoading && <p className="muted">Loading the review queue…</p>}
          {pendingError && <p className="form-error">{pendingError}</p>}
          {!pendingLoading && !pendingError && pending.length === 0 && (
            <Card>
              <p>Nothing waiting on review right now.</p>
            </Card>
          )}
          {!pendingLoading && pending.length > 0 && (
            <div className="equipment-grid">
              {pending.map((listing) => (
                <PendingListingCard
                  key={listing.id}
                  listing={listing}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'priceCap' && (
        <Card title="Seller listing price cap" className="card--form">
          {priceCapLoading && <p className="muted">Loading…</p>}
          {!priceCapLoading && (
            <form onSubmit={handlePriceCapSubmit}>
              <p className="muted">
                Sellers can't list an item above this price. Current cap: ${priceCap}.
              </p>
              <label className="field">
                <span>New price cap ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceCapInput}
                  onChange={(e) => {
                    setPriceCapInput(e.target.value);
                    setPriceCapSaved(false);
                  }}
                  required
                />
              </label>
              {priceCapError && <p className="form-error">{priceCapError}</p>}
              {priceCapSaved && <p className="muted">Saved.</p>}
              <button type="submit" className="btn btn--primary" disabled={priceCapSaving}>
                {priceCapSaving ? 'Saving…' : 'Update price cap'}
              </button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
