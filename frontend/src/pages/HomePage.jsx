import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/Card.jsx';

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page page--centered">
      <Card title="EquipHub" className="card--form">
        <p>Community equipment hire, sale, and donation — built for Community Resource Network SA.</p>
        {isAuthenticated ? (
          <Link className="btn btn--primary btn--block" to={`/dashboard/${user.role}`}>
            Go to your dashboard
          </Link>
        ) : (
          <div className="btn-row">
            <Link className="btn btn--primary" to="/login">Log in</Link>
            <Link className="btn btn--ghost" to="/register">Sign up</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
