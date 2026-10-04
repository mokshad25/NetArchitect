import { Download, Scan, ZoomIn, ZoomOut } from 'lucide-react';
import IconButton from '../../../components/ui/IconButton.jsx';

const ICON = { size: 16, strokeWidth: 1.5, 'aria-hidden': true };

/** Zoom / fit / export controls for the diagram. */
export default function DiagramToolbar({ onZoomIn, onZoomOut, onFit, onExport }) {
  return (
    <div className="diagram-toolbar" role="toolbar" aria-label="Diagram controls">
      <IconButton label="Zoom in (+)" onClick={onZoomIn}>
        <ZoomIn {...ICON} />
      </IconButton>
      <IconButton label="Zoom out (−)" onClick={onZoomOut}>
        <ZoomOut {...ICON} />
      </IconButton>
      <IconButton label="Fit to screen (0)" onClick={onFit}>
        <Scan {...ICON} />
      </IconButton>
      <span className="toolbar-sep" aria-hidden="true" />
      <IconButton label="Export PNG" onClick={onExport}>
        <Download {...ICON} />
      </IconButton>
    </div>
  );
}
