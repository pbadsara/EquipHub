export function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </div>
  );
}
