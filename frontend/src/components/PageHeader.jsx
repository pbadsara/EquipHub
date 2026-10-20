// A consistent icon + title (+ optional subtitle/action) header used at the
// top of every seller/admin dashboard page, so they read as one product
// instead of a pile of separately-styled screens.
function PageHeader({ icon, title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-header-icon">{icon}</div>
      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export default PageHeader;
