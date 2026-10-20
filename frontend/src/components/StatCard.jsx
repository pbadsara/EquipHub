// A small metric tile for dashboard summary rows (e.g. "3 Active", "$270
// Total revenue"). `tone` picks an accent color to match the badge system
// used elsewhere (active/sold/rented/pending/etc.) — omit it for neutral.
function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card${tone ? ` stat-card-${tone}` : ''}`}>
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-label">{label}</p>
    </div>
  );
}

export default StatCard;
