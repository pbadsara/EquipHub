import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SearchIcon,
  ShieldCheckIcon,
  CalendarIcon,
  WrenchIcon,
  TentIcon,
  CameraIcon,
  UserIcon,
  StoreIcon
} from '../components/icons';

const ROLE_HOME = { admin: '/admin/categories', seller: '/seller/listings', renter: '/browse' };

// A tiny "preview card" used purely as hero decoration — not real listing
// data, just a mockup of what a listing card looks like, to give the hero
// something concrete to show instead of only text.
function HeroPreviewCard({ icon, name, price, className }) {
  return (
    <div className={`hero-preview-card ${className}`}>
      <div className="hero-preview-icon">{icon}</div>
      <div>
        <p className="hero-preview-name">{name}</p>
        <p className="hero-preview-price">{price}</p>
      </div>
    </div>
  );
}

// The site's front door — what a visitor sees at "/", whether or not
// they're logged in. It used to bounce an authenticated visitor straight
// to their dashboard, but that made the "EquipHub" logo link effectively
// dead for anyone signed in; now it always shows, just with CTAs that make
// sense for whoever's looking at it.
function Landing() {
  const { user, isAuthenticated } = useAuth();
  const dashboardLink = isAuthenticated ? (ROLE_HOME[user.role] || '/browse') : null;

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Community equipment marketplace</p>
            <h1>Rent or buy equipment from <span className="landing-accent">people near you</span></h1>
            <p className="landing-subtitle">
              EquipHub connects local buyers, renters, and sellers — power tools, party gear,
              electronics and more — with every listing reviewed before it goes live, so you
              always know what you're getting.
            </p>
            <div className="landing-cta">
              {dashboardLink ? (
                <Link to={dashboardLink} className="landing-button landing-button-primary">Go to your dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="landing-button landing-button-primary">Get started — Sign up</Link>
                  <Link to="/login" className="landing-button landing-button-secondary">Log in</Link>
                </>
              )}
            </div>
            <Link to="/browse" className="landing-browse-link">Just browsing? See what's listed →</Link>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <HeroPreviewCard icon={<WrenchIcon />} name="Cordless Drill" price="$12 / day" className="hero-preview-card-1" />
            <HeroPreviewCard icon={<TentIcon />} name="4-Person Tent" price="$150" className="hero-preview-card-2" />
            <HeroPreviewCard icon={<CameraIcon />} name="DSLR Camera" price="$28 / day" className="hero-preview-card-3" />
          </div>
        </div>

        <div className="landing-trust-strip">
          <span><ShieldCheckIcon /> Every listing reviewed</span>
          <span><CalendarIcon /> Book exact rental dates</span>
          <span><SearchIcon /> Search by category</span>
        </div>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
        <div className="landing-grid">
          <div className="landing-feature">
            <span className="landing-feature-number">01</span>
            <div className="landing-feature-icon"><SearchIcon /></div>
            <h3>Browse or list</h3>
            <p>Search approved listings by category, or list your own gear for sale or rent in a couple of minutes.</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-number">02</span>
            <div className="landing-feature-icon"><ShieldCheckIcon /></div>
            <h3>Reviewed by an admin</h3>
            <p>Every listing is checked field-by-field before it goes public, so buyers can trust what they see.</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-number">03</span>
            <div className="landing-feature-icon"><CalendarIcon /></div>
            <h3>Buy outright, or book dates</h3>
            <p>Buy items outright, or pick exact rental dates on a live availability calendar — no double-bookings.</p>
          </div>
        </div>
      </section>

      <section className="landing-section-split">
        <div className="landing-section-split-inner">
          <div className="landing-split-card">
            <div className="landing-split-icon"><UserIcon /></div>
            <h2>For buyers &amp; renters</h2>
            <p>
              Browse verified listings near you, buy items outright or rent them for exactly the
              days you need, and keep track of every order in one place.
            </p>
          </div>
          <div className="landing-split-card">
            <div className="landing-split-icon"><StoreIcon /></div>
            <h2>For sellers</h2>
            <p>
              List what you're not using, set your own sale or rental price, and track every
              sale and rental with a full activity history.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-footer-cta">
        <h2>{dashboardLink ? 'Welcome back' : 'Ready to get started?'}</h2>
        <div className="landing-cta">
          {dashboardLink ? (
            <Link to={dashboardLink} className="landing-button landing-button-primary">Go to your dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="landing-button landing-button-primary">Create a free account</Link>
              <Link to="/login" className="landing-button landing-button-secondary">Log in</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Landing;
