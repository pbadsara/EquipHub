// Loading placeholders shaped like the real content they stand in for, so
// a page doesn't flash "nothing here" before its first fetch resolves and
// doesn't just show a bare "Loading…" line either.

export function SkeletonCard() {
  return (
    <div className="equipment-card skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-line" style={{ width: '70%' }} />
      <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: '40%' }} />
      <div className="skeleton skeleton-line" style={{ width: '90%' }} />
      <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: '30%' }} />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="auth-card skeleton-card" style={{ maxWidth: 480, marginBottom: 24 }}>
      <div className="skeleton skeleton-line" style={{ width: '50%', height: 20, marginBottom: 20 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: 90, marginBottom: 8 }} />
          <div className="skeleton skeleton-line" style={{ height: 36 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTile() {
  return (
    <div className="listing-tile skeleton-card">
      <div className="skeleton skeleton-image" style={{ height: 90 }} />
      <div className="skeleton skeleton-line" style={{ width: '80%' }} />
      <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: '45%' }} />
    </div>
  );
}

export function SkeletonRow({ columns = 4 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <div className="skeleton skeleton-line" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ columns = 4, rows = 4 }) {
  return (
    <table className="category-table">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} columns={columns} />)}
      </tbody>
    </table>
  );
}

export function SkeletonStatRow({ count = 3 }) {
  return (
    <div className="stat-row">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card skeleton-card">
          <div className="skeleton skeleton-line" style={{ width: 40, height: 22 }} />
          <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: 70 }} />
        </div>
      ))}
    </div>
  );
}
