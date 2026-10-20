import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import EquipmentCard from './components/EquipmentCard';
import ItemDetailModal from './components/ItemDetailModal';
import ProtectedRoute from './components/ProtectedRoute';
import SiteFooter from './components/SiteFooter';
import { SkeletonCard } from './components/Skeleton';
import EmptyState from './components/EmptyState';
import { SearchIcon } from './components/icons';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SellerListings from './pages/SellerListings';
import SellerActivityHistory from './pages/SellerActivityHistory';
import MyOrders from './pages/MyOrders';
import OrderSuccess from './pages/OrderSuccess';
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
    listingType: listing.listingType.value,
    rating: listing.rating
  };
}

function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // A phone visitor tapping a nav link should see the menu close behind
  // them, not stay open covering the page they just navigated to.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header>
      <div className="header-inner">
        <Link to="/" className="header-brand">
          <h1>EquipHub</h1>
          <p>Community equipment booking platform</p>
        </Link>

        <button
          className="header-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="header-menu-bar" />
          <span className="header-menu-bar" />
          <span className="header-menu-bar" />
        </button>

        <nav className={`header-nav ${menuOpen ? 'header-nav-open' : ''}`}>
          <Link to="/browse">Browse Equipment</Link>
          {isAuthenticated && user.role === 'renter' && <Link to="/my-orders">My Orders</Link>}
          {isAuthenticated && user.role === 'seller' && <Link to="/seller/listings">My Listings</Link>}
          {isAuthenticated && user.role === 'seller' && <Link to="/seller/activity">Activity History</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/review">Review Queue</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/categories">Categories</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/activity">Activity History</Link>}
          {isAuthenticated ? (
            <>
              <span className="header-user">Hi, {user.name} ({user.role})</span>
              <button className="link-button" onClick={handleLogout}>Log Out</button>
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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc'
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
    const price = item.hireRate.amount;
    const matchesMin = minPrice === '' || price >= Number(minPrice);
    const matchesMax = maxPrice === '' || price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    if (sortBy === 'price-asc') return a.hireRate.amount - b.hireRate.amount;
    if (sortBy === 'price-desc') return b.hireRate.amount - a.hireRate.amount;
    return 0;
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
        <div className="price-range">
          <input
            type="number"
            min="0"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-label="Minimum price"
          />
          <span>–</span>
          <input
            type="number"
            min="0"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="Maximum price"
          />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by price">
          <option value="default">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {error && <p>Error: {error}</p>}

      {loading && (
        <div className="equipment-grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !error && sortedEquipment.length === 0 && (
        <EmptyState
          icon={<SearchIcon />}
          message="No equipment matches your search."
          hint="Try a different keyword, category, or price range."
        />
      )}

      {!loading && sortedEquipment.length > 0 && (
        <div className="equipment-grid">
          {sortedEquipment.map((item) => (
            <EquipmentCard key={item._id} item={item} onClick={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </main>
  );
}

function App() {
  return (
    <div className="app">
      <SiteHeader />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<EquipmentCatalogue />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute roles={['renter']}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success"
          element={
            <ProtectedRoute roles={['renter']}>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
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

      <SiteFooter />
    </div>
  );
}

export default App;