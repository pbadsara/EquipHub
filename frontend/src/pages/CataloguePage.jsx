import { useEffect, useState } from 'react';
import { CatalogueCard } from '../components/CatalogueCard.jsx';
import { fetchCatalogue } from '../api/equipmentApi.js';

export function CataloguePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '', listingType: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchCatalogue(filters)
      .then(({ equipment }) => {
        if (!cancelled) setItems(equipment);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load the catalogue.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function handleFilterChange(e) {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Browse Equipment</h1>
      </div>

      <div className="catalogue-filters">
        <input
          type="text"
          name="search"
          placeholder="Search by name, description, category…"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <select name="listingType" value={filters.listingType} onChange={handleFilterChange}>
          <option value="">Rent or sale</option>
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </select>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="muted">No equipment found.</p>}
      {!loading && items.length > 0 && (
        <div className="equipment-grid">
          {items.map((listing) => (
            <CatalogueCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
