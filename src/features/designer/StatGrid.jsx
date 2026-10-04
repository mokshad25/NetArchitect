/** Large figures with small labels, separated by 1px rules. */
export default function StatGrid({ stats, compact = false }) {
  return (
    <dl className={`stat-grid ${compact ? 'is-compact' : ''}`}>
      {stats.map(([label, value, note]) => (
        <div className="stat" key={label}>
          <dt className="label">{label}</dt>
          <dd>
            <span className="stat-num display">{value}</span>
            {note && !compact && <span className="stat-note muted">{note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
