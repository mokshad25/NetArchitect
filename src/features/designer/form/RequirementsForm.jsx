import { CircleAlert } from 'lucide-react';
import DeviceCounts from './DeviceCounts.jsx';
import DepartmentTable from './DepartmentTable.jsx';
import NeedsChecklist from './NeedsChecklist.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import Button from '../../../components/ui/Button.jsx';
import { parseCidr } from '../../../engine/ipUtils.js';

const DEPT_ERROR = /^Department|department needs a name|Department names/;

/** The requirements form (left sidebar on desktop, top sheet on mobile). */
export default function RequirementsForm({ designer }) {
  const { req, manual, validation, busy, actions } = designer;
  const cidr = parseCidr(req.baseNetwork);
  const cidrError = cidr.ok ? null : cidr.error;
  const deptErrors = validation.errors.filter((e) => DEPT_ERROR.test(e));
  const otherErrors = validation.errors.filter((e) => !DEPT_ERROR.test(e) && e !== cidrError);

  return (
    <form
      className="req-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!validation.errors.length) actions.design();
      }}
    >
      <DeviceCounts req={req} onChange={actions.setCount} />
      <DepartmentTable
        req={req}
        manual={manual}
        errors={deptErrors}
        onEdit={actions.editDept}
        onResplit={actions.resplit}
      />
      <NeedsChecklist needs={req.needs} onChange={actions.setNeed} />

      <fieldset className="form-group">
        <legend className="label">Base network</legend>
        <TextField
          id="f-base"
          inputClassName="mono"
          aria-label="Base network in CIDR notation"
          value={req.baseNetwork}
          placeholder="192.168.10.0/24"
          spellCheck={false}
          autoComplete="off"
          error={cidrError}
          hint="All subnets are carved out of this block."
          onChange={(e) => actions.setBase(e.target.value)}
        />
      </fieldset>

      {(otherErrors.length > 0 || validation.warnings.length > 0) && (
        <div className="form-messages">
          {otherErrors.map((e) => (
            <p key={e} className="notice notice-danger notice-sm" role="alert">
              <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" />
              {e}
            </p>
          ))}
          {validation.warnings.map((w) => (
            <p key={w} className="notice notice-warning notice-sm">
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={validation.errors.length > 0 || busy}
          className="form-submit"
        >
          {busy ? 'Designing…' : 'Design network'}
        </Button>
        <div className="form-secondary">
          <Button variant="secondary" size="md" onClick={actions.loadDemo}>
            Load demo
          </Button>
          <Button variant="ghost" size="md" onClick={actions.reset}>
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
}
