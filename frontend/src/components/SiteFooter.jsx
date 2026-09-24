import { Link } from 'react-router-dom';

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <h2>EquipHub</h2>
          <p>The community marketplace for buying, selling and renting equipment near you.</p>
        </div>

        <div className="site-footer-col">
          <h3>Explore</h3>
          <Link to="/browse">Browse equipment</Link>
          <Link to="/register">Become a seller</Link>
        </div>

        <div className="site-footer-col">
          <h3>Account</h3>
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>&copy; {new Date().getFullYear()} EquipHub. Built for the community.</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
