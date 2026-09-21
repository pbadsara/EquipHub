import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import EquipmentCard from './components/EquipmentCard';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerListings from './pages/SellerListings';
import AdminReviewQueue from './pages/AdminReviewQueue';
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
    name: listing.name.value,
    category: listing.category.value?.name || '',
    description: listing.description.value,
    images: listing.images.value || [],
    hireRate: { amount: listing.price.value, period: 'per_item' },
    depositAmount: 0
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
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/review">Review Queue</Link>}
          {isAuthenticated && user.role === 'admin' && <Link to="/admin/categories">Categories</Link>}
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

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/equipment`).then((res) => res.json()),
      api.getApprovedListings()
    ])
      .then(([equipmentItems, listings]) => {
        setEquipment([...equipmentItems, ...listings.map(listingToCardItem)]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      {loading && <p>Loading equipment...</p>}
      {error && <p>Error: {error}</p>}
      <div className="equipment-grid">
        {equipment.map((item) => (
          <EquipmentCard key={item._id} item={item} />
        ))}
      </div>
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
      </Routes>
    </div>
  );
}

export default App;