import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';
import { EquipmentForm } from '../components/EquipmentForm.jsx';
import { EquipmentCard } from '../components/EquipmentCard.jsx';
import { fetchMyListings, createListing, updateListing, deleteListing } from '../api/equipmentApi.js';

export function SellerDashboard() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState('list'); // 'list' | 'new'
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingListing, setEditingListing] = useState(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { equipment } = await fetchMyListings(token);
      setListings(equipment);
    } catch (err) {
      setLoadError(err.message || 'Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  async function handleCreate(fields) {
    await createListing(token, fields);
    setTab('list');
    await loadListings();
  }

  async function handleUpdate(fields) {
    await updateListing(token, editingListing.id, fields);
    setEditingListing(null);
    setTab('list');
    await loadListings();
  }

  function handleEdit(listing) {
    setEditingListing(listing);
    setTab('new');
  }

  async function handleDelete(listing) {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    await deleteListing(token, listing.id);
    await loadListings();
  }

  function switchToNewTab() {
    setEditingListing(null);
    setTab('new');
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Welcome, {user.name}</h1>
        <div className="tab-row">
          <button
            type="button"
            className={`tab-button ${tab === 'list' ? 'tab-button--active' : ''}`}
            onClick={() => setTab('list')}
          >
            My Listings
          </button>
          <button
            type="button"
            className={`tab-button ${tab === 'new' ? 'tab-button--active' : ''}`}
            onClick={switchToNewTab}
          >
            New Listing
          </button>
        </div>
      </div>

      {tab === 'list' && (
        <>
          {loading && <p className="muted">Loading your listings…</p>}
          {loadError && <p className="form-error">{loadError}</p>}
          {!loading && !loadError && listings.length === 0 && (
            <Card>
              <p>You haven't listed anything yet.</p>
              <button type="button" className="btn btn--primary" onClick={switchToNewTab}>
                Create your first listing
              </button>
            </Card>
          )}
          {!loading && listings.length > 0 && (
            <div className="equipment-grid">
              {listings.map((listing) => (
                <EquipmentCard
                  key={listing.id}
                  listing={listing}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'new' && (
        <Card title={editingListing ? `Edit "${editingListing.title}"` : 'New Listing'} className="card--form">
          <EquipmentForm
            initialValues={editingListing}
            submitLabel={editingListing ? 'Save changes' : 'Create listing'}
            onSubmit={editingListing ? handleUpdate : handleCreate}
            onCancel={() => {
              setEditingListing(null);
              setTab('list');
            }}
          />
        </Card>
      )}
    </div>
  );
}
