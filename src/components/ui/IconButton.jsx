/** Square icon-only button. `label` is required: it becomes aria-label and tooltip. */
export default function IconButton({ label, className = '', children, ...rest }) {
  return (
    <button type="button" className={`icon-btn ${className}`.trim()} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
