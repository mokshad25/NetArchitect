import { lazy, Suspense, useRef } from 'react';
import DiagramToolbar from './DiagramToolbar.jsx';
import Legend from './Legend.jsx';
import NodeDrawer from './NodeDrawer.jsx';

// vis-network is large; load it only when the diagram is shown.
const NetworkGraph = lazy(() => import('./NetworkGraph.jsx'));

/** Diagram tab: canvas, toolbar, legend and the node details drawer. */
export default function DiagramView({ graph, selectedId, onSelect }) {
  const graphRef = useRef(null);
  const select = (id, focus) => {
    onSelect(id);
    if (focus && id) graphRef.current?.focus(id);
  };
  const onKeyDown = (e) => {
    const g = graphRef.current;
    if (!g) return;
    if (e.key === '+' || e.key === '=') g.zoom(1.25);
    else if (e.key === '-' || e.key === '_') g.zoom(0.8);
    else if (e.key === '0') g.fit();
    else if (e.key === 'Escape') onSelect(null);
    else return;
    e.preventDefault();
  };

  return (
    <div className="diagram">
      <div className="diagram-stage">
        <DiagramToolbar
          onZoomIn={() => graphRef.current?.zoom(1.25)}
          onZoomOut={() => graphRef.current?.zoom(0.8)}
          onFit={() => graphRef.current?.fit()}
          onExport={() => graphRef.current?.exportPng()}
        />
        <div
          className="graph-frame"
          tabIndex={0}
          role="application"
          aria-label="Network diagram. Click a device for details. Press plus or minus to zoom, 0 to fit."
          onKeyDown={onKeyDown}
        >
          <Suspense fallback={<div className="graph-loading">Loading diagram…</div>}>
            <NetworkGraph ref={graphRef} graph={graph} selectedId={selectedId} onSelect={onSelect} />
          </Suspense>
        </div>
        <Legend />
      </div>
      <NodeDrawer graph={graph} nodeId={selectedId} onSelect={select} onClose={() => onSelect(null)} />
    </div>
  );
}
