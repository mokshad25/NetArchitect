import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta.js';
import { useDesigner } from '../features/designer/useDesigner.js';
import RequirementsForm from '../features/designer/form/RequirementsForm.jsx';
import DiagramView from '../features/designer/diagram/DiagramView.jsx';
import ExplanationView from '../features/designer/ExplanationView.jsx';
import IpPlan from '../features/designer/ipplan/IpPlan.jsx';
import SummaryView from '../features/designer/SummaryView.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import '../features/designer/designer.css';

const TABS = [
  { id: 'diagram', label: 'Diagram' },
  { id: 'explain', label: 'Explanation' },
  { id: 'ip', label: 'IP Plan' },
  { id: 'summary', label: 'Summary' },
];
const FEATURE_LABELS = {
  vlan: 'VLAN per department',
  wifi: 'Wi-Fi',
  internet: 'Internet',
  serverSegment: 'Server segment',
};

function EmptyState({ onDemo }) {
  return (
    <div className="empty">
      <p className="label">No design yet</p>
      <h1 className="display h2">Describe the network you need.</h1>
      <p className="lede">
        Enter device counts and tick the requirements on the left, then choose <strong>Design network</strong>. Or load
        the demo: three departments, servers, Wi-Fi and internet on 192.168.10.0/24.
      </p>
      <Button variant="secondary" size="lg" onClick={onDemo}>
        Load demo
      </Button>
    </div>
  );
}

/** /app — the designer tool. */
export default function DesignerPage() {
  usePageMeta('Designer', 'Design a network from requirements: topology, diagram, explanation and VLSM IP plan.');
  const [params] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'diagram';
  const d = useDesigner(params.get('demo') === '1', initialTab);
  const { req, result, tab } = d;
  const totalDevices = ['pcs', 'laptops', 'servers', 'printers'].reduce((s, k) => s + (Number(req[k]) || 0), 0);

  return (
    <div className="designer">
      <aside className={`designer-side ${d.sheetOpen ? 'is-open' : ''}`} aria-label="Requirements">
        <button
          type="button"
          className="sheet-toggle"
          aria-expanded={d.sheetOpen}
          aria-controls="req-form"
          onClick={() => d.setSheetOpen(!d.sheetOpen)}
        >
          <span>
            <span className="title">Requirements</span>
            <span className="muted sheet-summary">
              {totalDevices} devices · {req.departmentCount || 0} dept · <span className="mono">{req.baseNetwork}</span>
            </span>
          </span>
          <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" className="sheet-chevron" />
        </button>
        <div id="req-form" className="designer-form">
          <RequirementsForm designer={d} />
        </div>
      </aside>

      <section className="designer-main" aria-label="Design output" aria-busy={d.busy}>
        {!result ? (
          <EmptyState onDemo={d.actions.loadDemo} />
        ) : (
          <>
            <div className="designer-head">
              <div className="designer-topology">
                <p className="label">Recommended topology</p>
                <p className="designer-topology-name display">{result.design.topologyLabel}</p>
                <div className="designer-features">
                  {result.design.features.map((f) => (
                    <Badge key={f}>{FEATURE_LABELS[f]}</Badge>
                  ))}
                </div>
              </div>
              <Tabs tabs={TABS} active={tab} onChange={d.setTab} idPrefix="out" label="Design output" />
            </div>
            {d.stale && (
              <p className="notice notice-warning notice-sm stale">
                Inputs changed. Choose <strong>Design network</strong> to update the result.
              </p>
            )}
            <div
              className={`designer-panel ${d.busy ? 'is-busy' : ''}`}
              role="tabpanel"
              id={`out-panel-${tab}`}
              aria-labelledby={`out-tab-${tab}`}
              tabIndex={tab === 'diagram' ? -1 : 0}
            >
              {tab === 'diagram' && (
                <DiagramView graph={result.graph} selectedId={d.selected} onSelect={d.setSelected} />
              )}
              {tab === 'explain' && <ExplanationView items={result.explanation} />}
              {tab === 'ip' && <IpPlan vlsm={result.vlsm} segments={result.segments} onUseBase={d.actions.useBase} />}
              {tab === 'summary' && <SummaryView summary={result.summary} design={result.design} />}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
