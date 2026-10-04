import NumberStepper from '../../../components/ui/NumberStepper.jsx';

const FIELDS = [
  ['pcs', 'PCs', 0],
  ['laptops', 'Laptops', 0],
  ['servers', 'Servers', 0],
  ['printers', 'Printers', 0],
  ['departmentCount', 'Departments', 1, 26],
];

/** Top-level device counts. */
export default function DeviceCounts({ req, onChange }) {
  return (
    <fieldset className="form-group">
      <legend className="label">Devices</legend>
      <div className="form-grid">
        {FIELDS.map(([key, label, min, max]) => (
          <NumberStepper
            key={key}
            id={`f-${key}`}
            label={label}
            value={req[key]}
            min={min}
            max={max}
            invalid={!Number.isInteger(req[key])}
            onChange={(v) => onChange(key, v)}
          />
        ))}
      </div>
    </fieldset>
  );
}
