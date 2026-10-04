import { Check } from 'lucide-react';

/** Styled checkbox built on a real <input type="checkbox">. */
export default function Checkbox({ id, label, checked, onChange }) {
  return (
    <label className="checkbox" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox-box" aria-hidden="true">
        <Check size={12} strokeWidth={2} />
      </span>
      <span>{label}</span>
    </label>
  );
}
