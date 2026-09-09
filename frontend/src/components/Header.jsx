import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__brand">EquipHub</Link>
        <nav className="app-header__nav">
          <Link to="/catalogue" className="btn btn--ghost">Browse</Link>
          {isAuthenticated ? (
            <>
              <Link to={`/dashboard/${user.role}`} className="btn btn--ghost">Dashboard</Link>
              <span className="app-header__user">
                {user.name} <span className="role-pill">{user.role}</span>
              </span>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">Log in</Link>
              <Link to="/register" className="btn btn--primary">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
