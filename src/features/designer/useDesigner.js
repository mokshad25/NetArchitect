import { useCallback, useMemo, useState } from 'react';
import { buildDepartments, defaultDeptName, demoRequirements, emptyRequirements } from '../../engine/constants.js';
import { validateRequirements } from '../../engine/validation.js';
import { designNetwork } from '../../engine/designNetwork.js';
import { useToast } from '../../components/ui/useToast.js';

const validCount = (n) => Number.isInteger(n) && n >= 1 && n <= 26;
const isNarrow = () => window.matchMedia('(max-width: 899px)').matches;

/** Re-split devices evenly across departments, keeping names the user typed. */
function resplit(req) {
  const n = validCount(req.departmentCount) ? req.departmentCount : req.departments.length;
  const old = req.departments;
  const names = Array.from({ length: n }, (_, i) =>
    old[i] && old[i].name !== defaultDeptName(i, old.length) ? old[i].name : defaultDeptName(i, n),
  );
  const num = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
  return { ...req, departments: buildDepartments(n, num(req.pcs), num(req.printers), num(req.laptops), names) };
}

/**
 * All state for the designer page: the form, the last design result, the
 * active tab, the selected node and the mobile requirements sheet.
 * @param {boolean} startWithDemo  pre-load the demo (from ?demo=1)
 * @param {string}  initialTab     tab to open first (from ?tab=)
 */
export function useDesigner(startWithDemo = false, initialTab = 'diagram') {
  const { notify } = useToast();
  const [req, setReq] = useState(() => (startWithDemo ? demoRequirements() : emptyRequirements()));
  const [manual, setManual] = useState(startWithDemo);
  const [result, setResult] = useState(() => (startWithDemo ? designNetwork(demoRequirements()) : null));
  const [designedReq, setDesignedReq] = useState(() => (startWithDemo ? req : null));
  const [tab, setTab] = useState(initialTab);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(!startWithDemo);

  const validation = useMemo(() => validateRequirements(req), [req]);

  const run = useCallback(
    (r) => {
      setBusy(true);
      // Let the "Designing…" state paint before the (fast) synchronous work.
      // (A timeout rather than requestAnimationFrame, which never fires in background tabs.)
      setTimeout(() => {
        const out = designNetwork(r);
        setBusy(false);
        if (!out.ok) {
          notify(out.errors[0], { tone: 'danger' });
          return;
        }
        setResult(out);
        setDesignedReq(r);
        setSelected(null);
        if (!out.vlsm.ok) notify('The IP plan does not fit the base network. See the IP Plan tab.', { tone: 'danger' });
        else notify(`Designed: ${out.design.topologyLabel}`, { tone: 'success' });
        if (isNarrow()) setSheetOpen(false);
      }, 30);
    },
    [notify],
  );

  const actions = {
    setCount: (key, value) => {
      const next = { ...req, [key]: value };
      if (key === 'departmentCount') {
        setManual(false);
        setReq(resplit(next));
      } else {
        setReq(manual ? next : resplit(next));
      }
    },
    editDept: (i, key, value) => {
      if (key !== 'name') setManual(true);
      setReq({ ...req, departments: req.departments.map((d, j) => (j === i ? { ...d, [key]: value } : d)) });
    },
    resplit: () => {
      setManual(false);
      setReq(resplit(req));
    },
    setNeed: (key, checked) => setReq({ ...req, needs: { ...req.needs, [key]: checked } }),
    setBase: (value) => setReq({ ...req, baseNetwork: value }),
    design: () => run(req),
    loadDemo: () => {
      const demo = demoRequirements();
      setManual(true);
      setReq(demo);
      setTab('diagram');
      run(demo);
    },
    reset: () => {
      setManual(false);
      setReq(emptyRequirements());
      setResult(null);
      setDesignedReq(null);
      setSelected(null);
      setSheetOpen(true);
    },
    useBase: (cidr) => {
      const next = { ...req, baseNetwork: cidr };
      setReq(next);
      run(next);
    },
  };

  return {
    req,
    manual,
    validation,
    result,
    stale: Boolean(result) && designedReq !== req,
    busy,
    tab,
    setTab,
    selected,
    setSelected,
    sheetOpen,
    setSheetOpen,
    actions,
  };
}
