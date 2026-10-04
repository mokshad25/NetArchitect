import { useMemo } from 'react';
import { readVars } from '../../../lib/cssVars.js';
import { useTheme } from '../../../lib/useTheme.js';
import { DIAGRAM_VARS } from './diagramTheme.js';
import { iconFor } from './diagramIcons.js';

const DEVICES = [
  ['router', 'Router'],
  ['switch', 'Core switch', 'Core switch'],
  ['switch', 'Switch', 'Department switch'],
  ['server', 'Server'],
  ['ap', 'Access point'],
  ['pc', 'PC'],
  ['printer', 'Printer'],
  ['laptop', 'Laptop'],
  ['more', 'Group'],
];

/** Diagram legend: device icons plus the three link styles. */
export default function Legend() {
  const { theme } = useTheme();
  // Recompute icon colors when the theme changes.
  const colors = useMemo(() => (theme ? readVars(DIAGRAM_VARS) : null), [theme]);
  return (
    <div className="legend" aria-label="Legend">
      {DEVICES.map(([type, label, role]) => (
        <span className="legend-item" key={label}>
          <img src={iconFor(type, role, colors)} alt="" width="18" height="18" />
          {label}
        </span>
      ))}
      <span className="legend-sep" aria-hidden="true" />
      <span className="legend-item">
        <span className="line-sample" aria-hidden="true" />
        Link
      </span>
      <span className="legend-item">
        <span className="line-sample is-redundant" aria-hidden="true" />
        Redundant
      </span>
      <span className="legend-item">
        <span className="line-sample is-wireless" aria-hidden="true" />
        Wireless
      </span>
    </div>
  );
}
