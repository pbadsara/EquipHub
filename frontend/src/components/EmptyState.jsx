// A consistent "nothing here yet" panel — icon, short message, optional
// hint line — used anywhere a list or table can legitimately be empty.
function EmptyState({ icon, message, hint }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-message">{message}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}

export default EmptyState;
