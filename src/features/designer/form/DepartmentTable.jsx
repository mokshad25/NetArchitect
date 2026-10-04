import NumberStepper from '../../../components/ui/NumberStepper.jsx';

/**
 * One row per department: name plus how many PCs / printers (and laptops when
 * Wi-Fi is off) belong to it. The footer shows whether totals match.
 */
export default function DepartmentTable({ req, manual, errors, onEdit, onResplit }) {
  const showLaptops = !req.needs.wifi;
  const cols = [['pcs', 'PCs'], ['printers', 'Printers'], ...(showLaptops ? [['laptops', 'Laptops']] : [])];
  const sum = (k) => req.departments.reduce((s, d) => s + (Number(d[k]) || 0), 0);
  const target = { pcs: req.pcs, printers: req.printers, laptops: req.laptops };

  return (
    <fieldset className="form-group">
      <legend className="label">Departments</legend>
      <div className={`dept-table cols-${cols.length}`} role="table" aria-label="Devices per department">
        <div className="dept-row dept-head" role="row">
          <span role="columnheader">Name</span>
          {cols.map(([k, l]) => (
            <span role="columnheader" key={k}>
              {l}
            </span>
          ))}
        </div>
        {req.departments.map((d, i) => (
          <div className="dept-row" role="row" key={i}>
            <span role="cell">
              <input
                className={`input input-sm ${d.name.trim() ? '' : 'is-invalid'}`}
                aria-label={`Department ${i + 1} name`}
                value={d.name}
                onChange={(e) => onEdit(i, 'name', e.target.value)}
              />
            </span>
            {cols.map(([k, l]) => (
              <span role="cell" key={k}>
                <NumberStepper
                  compact
                  id={`dept-${i}-${k}`}
                  value={d[k]}
                  invalid={!Number.isInteger(d[k])}
                  onChange={(v) => onEdit(i, k, v)}
                  ariaLabel={`${d.name || `Department ${i + 1}`} ${l}`}
                />
              </span>
            ))}
          </div>
        ))}
        <div className="dept-row dept-foot" role="row">
          <span role="cell" className="muted">
            Assigned
          </span>
          {cols.map(([k]) => {
            const ok = sum(k) === target[k];
            return (
              <span role="cell" key={k} className={`mono ${ok ? 'is-ok' : 'is-bad'}`}>
                {sum(k)}/{Number.isInteger(target[k]) ? target[k] : '–'}
              </span>
            );
          })}
        </div>
      </div>
      {errors.map((e) => (
        <p key={e} className="field-error">
          {e}
        </p>
      ))}
      {manual && (
        <button type="button" className="text-btn" onClick={onResplit}>
          Split devices evenly again
        </button>
      )}
    </fieldset>
  );
}
