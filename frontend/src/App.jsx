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

const API_URL = 'http://localhost:5050/api';

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

// Public equipment browse/catalogue — unchanged from before, still the
// Renter/Buyer home page.
function EquipmentCatalogue() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/equipment`)
      .then((res) => res.json())
      .then((data) => {
        setEquipment(data);
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