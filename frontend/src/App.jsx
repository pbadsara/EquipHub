import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import EquipmentCard from './components/EquipmentCard';
import ItemDetailModal from './components/ItemDetailModal';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerListings from './pages/SellerListings';
import SellerActivityHistory from './pages/SellerActivityHistory';
import AdminReviewQueue from './pages/AdminReviewQueue';
import AdminActivityHistory from './pages/AdminActivityHistory';
import CategoryManager from './pages/CategoryManager';
import { useAuth } from './context/AuthContext';
import { api } from './api';

const API_URL = 'http://localhost:5050/api';

// A Listing's shape (name.value, price.value, category.value{...}, etc.)
// is different from the legacy Equipment shape EquipmentCard expects
// (flat name, hireRate.amount/period, etc). This maps one to the other
// so an approved seller listing can render with the same card.
function listingToCardItem(listing) {
  return {
    _id: listing._id,
    itemType: 'listing',
    name: listing.name.value,
    category: listing.category.value?.name || '',
    description: listing.description.value,
    images: listing.images.value || [],
    hireRate: { amount: listing.price.value, period: listing.listingType.value === 'rent' ? 'per_day' : 'per_item' },
    depositAmount: 0,
    listingType: listing.listingType.value
  };
}

function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header>
      <div className="header-inner">
        <div>
          <h1>EquipHub</h1>
          <p>Community equipment booking platform</p>
        </div>
        <nav className="header-nav">
          {isAuthenticated && user.role === 'seller' && <Link to="/seller/listings">My Listings</Link>}
          {isAuthenticated && user.role === 'seller' && <Link to="/seller/activity">Activity History</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/review">Review Queue</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/categories">Categories</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/activity">Activity History</Link>}
          {isAuthenticated ? (
            <>
              <span className="header-user">Hi, {user.name} ({user.role})</span>
              <button className="link-button" onClick={logout}>Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log In</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// Public browse page — Renter/Buyer home. Shows both the legacy
// Equipment catalogue and every seller listing that's fully approved.
function EquipmentCatalogue() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/equipment`).then((res) => res.json()),
      api.getApprovedListings()
    ])
      .then(([equipmentItems, listings]) => {
        setEquipment([
          ...equipmentItems.map((item) => ({ ...item, itemType: 'equipment', listingType: 'rent' })),
          ...listings.map(listingToCardItem)
        ]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const categories = [...new Set(equipment.map((item) => item.category).filter(Boolean))];

  const filteredEquipment = equipment.filter((item) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term
      || item.name.toLowerCase().includes(term)
      || item.description.toLowerCase().includes(term);
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <main>
      <div className="search-bar">
        <input
          type="search"
          placeholder="Search equipment…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search equipment"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading equipment...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && filteredEquipment.length === 0 && <p>No equipment matches your search.</p>}
      <div className="equipment-grid">
        {filteredEquipment.map((item) => (
          <EquipmentCard key={item._id} item={item} onClick={() => setSelectedItem(item)} />
        ))}
      </div>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </main>
  );
}

function App() {
  return (
    <div className="app">
      <SiteHeader />

      <Routes>
        <Route path="/" element={<EquipmentCatalogue />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/seller/listings"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/activity"
          element={
            <ProtectedRoute roles={['seller']}>
              <SellerActivityHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/review"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminReviewQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={['admin']}>
              <CategoryManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminActivityHistory />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;