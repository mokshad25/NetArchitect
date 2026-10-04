import StatGrid from './StatGrid.jsx';
import { summaryStats } from './summaryStats.js';

/** Summary tab: large serif figures on a ruled grid, all computed from the graph. */
export default function SummaryView({ summary, design }) {
  return (
    <div className="summary">
      <header className="panel-head">
        <p className="label">Summary</p>
        <h2 className="display h3">The network at a glance</h2>
      </header>
      <StatGrid stats={summaryStats(summary, design)} />
      <p className="footnote muted">
        The diagram draws {summary.drawnNodes} nodes. Large groups are shortened to “+N more” but are counted in full
        above.
      </p>
    </div>
  );
}
