import { Minus, Plus } from 'lucide-react';

/**
 * Number input with − / + buttons. Empty input is passed up as '' so the
 * form can show a validation message instead of silently using 0.
 */
export default function NumberStepper({
  id,
  label,
  ariaLabel,
  value,
  min = 0,
  max = 9999,
  onChange,
  compact = false,
  invalid,
}) {
  const name = label || ariaLabel || '';
  const num = Number.isFinite(value) ? value : min;
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className={`stepper ${compact ? 'stepper-compact' : ''}`}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <div className={`stepper-control ${invalid ? 'is-invalid' : ''}`}>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Decrease ${name}`.trim()}
          onClick={() => set(num - 1)}
          disabled={num <= min}
        >
          <Minus size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={invalid ? true : undefined}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Increase ${name}`.trim()}
          onClick={() => set(num + 1)}
          disabled={num >= max}
        >
          <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
