import Checkbox from '../../../components/ui/Checkbox.jsx';
import { NEED_KEYS } from '../../../engine/constants.js';

/** The seven requirement checkboxes. */
export default function NeedsChecklist({ needs, onChange }) {
  return (
    <fieldset className="form-group">
      <legend className="label">Requirements</legend>
      <div className="checks">
        {NEED_KEYS.map(({ key, label }) => (
          <Checkbox
            key={key}
            id={`need-${key}`}
            label={label}
            checked={needs[key]}
            onChange={(v) => onChange(key, v)}
          />
        ))}
      </div>
    </fieldset>
  );
}
