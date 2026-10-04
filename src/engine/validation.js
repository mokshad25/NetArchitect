/**
 * validation.js — friendly checks on the input form before designing.
 * Returns { errors: string[], warnings: string[] }. Errors block the design.
 */
import { parseCidr } from './ipUtils.js';

const FIELDS = [
  ['pcs', 'PCs'],
  ['laptops', 'Laptops'],
  ['servers', 'Servers'],
  ['printers', 'Printers'],
];

const isCount = (v) => Number.isInteger(v) && v >= 0;

export function validateRequirements(req) {
  const errors = [];
  const warnings = [];

  for (const [key, label] of FIELDS) {
    if (!isCount(req[key])) errors.push(`${label} must be a whole number of 0 or more.`);
  }
  if (!Number.isInteger(req.departmentCount) || req.departmentCount < 1) {
    errors.push('You need at least 1 department.');
  } else if (req.departmentCount > 26) {
    errors.push('Please use 26 departments or fewer.');
  }

  const total = FIELDS.reduce((s, [k]) => s + (Number(req[k]) || 0), 0);
  if (total === 0) errors.push('Add at least one device (PC, laptop, server or printer).');

  const depts = req.departments || [];
  const names = depts.map((d) => String(d.name || '').trim());
  if (names.some((n) => !n)) errors.push('Every department needs a name.');
  const dupes = names.filter((n, i) => n && names.findIndex((m) => m.toLowerCase() === n.toLowerCase()) !== i);
  if (dupes.length) errors.push(`Department names must be unique ("${dupes[0]}" is used twice).`);
  if (depts.some((d) => !isCount(d.pcs) || !isCount(d.printers) || !isCount(d.laptops || 0))) {
    errors.push('Department device counts must be whole numbers of 0 or more.');
  }

  const sum = (k) => depts.reduce((s, d) => s + (Number(d[k]) || 0), 0);
  if (sum('pcs') !== req.pcs)
    errors.push(`Department PCs add up to ${sum('pcs')}, but you entered ${req.pcs} PCs in total.`);
  if (sum('printers') !== req.printers) {
    errors.push(`Department printers add up to ${sum('printers')}, but you entered ${req.printers} printers in total.`);
  }
  if (!req.needs.wifi && sum('laptops') !== req.laptops) {
    errors.push(`Department laptops add up to ${sum('laptops')}, but you entered ${req.laptops} laptops in total.`);
  }

  const cidr = parseCidr(req.baseNetwork);
  if (!cidr.ok) errors.push(cidr.error);

  if (req.needs.multipleDepartments && req.departmentCount < 2) {
    warnings.push('"Multiple departments" is ticked but there is only 1 department — increase the department count.');
  }
  if (req.needs.wifi && req.laptops === 0)
    warnings.push('Wi-Fi is on but there are no laptops; an access point is still added for future devices.');
  if (!req.needs.wifi && req.laptops > 0)
    warnings.push('Wi-Fi is off, so laptops will be plugged into their department switches with cables.');

  return { errors, warnings };
}
