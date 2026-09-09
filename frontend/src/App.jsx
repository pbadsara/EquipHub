import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Header } from './components/Header.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { SellerDashboard } from './pages/SellerDashboard.jsx';
import { RenterDashboard } from './pages/RenterDashboard.jsx';
import { CataloguePage } from './pages/CataloguePage.jsx';
import { EquipmentDetailPage } from './pages/EquipmentDetailPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <main className="app-main">
          <Routes>
            {/* Landing page is the login form itself — already-authenticated
                users are bounced to their dashboard by LoginPage. */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/catalogue/:id" element={<EquipmentDetailPage />} />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/seller"
              element={
                <ProtectedRoute role="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/renter"
              element={
                <ProtectedRoute role="renter">
                  <RenterDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
