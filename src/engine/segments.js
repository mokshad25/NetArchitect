/**
 * segments.js — turn requirements + design into the list of IP segments
 * that the VLSM calculator will size.
 *
 * Host counts include the segment's gateway device:
 *   department = PCs + printers (+ wired laptops) + 1 switch/gateway
 *   servers    = servers + 1 gateway
 *   Wi-Fi      = laptops + 1 access point     (allocated after the others)
 *   router     = 2 (router + core switch)
 */

/**
 * Short code used in device names: "Dept A" -> "A", "Admin" -> "ADM".
 * Codes are made unique across departments.
 */
export function deptCodes(departments) {
  const used = new Set();
  return departments.map((d, i) => {
    const name = String(d.name || '').trim();
    const m = name.match(/^dept\.?\s*([a-z0-9]+)$/i);
    let code = m
      ? m[1].toUpperCase()
      : name
          .replace(/[^a-z0-9]/gi, '')
          .slice(0, 3)
          .toUpperCase();
    if (!code) code = String.fromCharCode(65 + (i % 26));
    let unique = code;
    let k = 2;
    while (used.has(unique)) unique = `${code}${k++}`;
    used.add(unique);
    return unique;
  });
}

/** Number of end devices wired into a department. */
export function deptDeviceCount(dept, wifi) {
  return (dept.pcs || 0) + (dept.printers || 0) + (wifi ? 0 : dept.laptops || 0);
}

export function buildSegments(req, design) {
  const wifi = design.features.includes('wifi');
  const vlan = design.features.includes('vlan');
  const codes = deptCodes(req.departments);
  const segments = req.departments.map((d, i) => {
    // The backup core switch (redundancy without dept switches) takes a
    // management address in the first department's subnet.
    const devices = deptDeviceCount(d, wifi) + (i === 0 && design.structure.backupCore ? 1 : 0);
    return {
      id: `dept-${codes[i]}`,
      name: d.name,
      kind: 'department',
      phase: 'core',
      devices,
      hosts: devices > 0 ? devices + 1 : 0,
      vlan: vlan ? (i + 1) * 10 : null,
      deptIndex: i,
    };
  });
  if (req.servers > 0) {
    segments.push({
      id: 'servers',
      name: 'Servers',
      kind: 'servers',
      phase: 'core',
      devices: req.servers,
      hosts: req.servers + 1,
      vlan: vlan ? 100 : null,
    });
  }
  if (design.features.includes('internet')) {
    segments.push({
      id: 'router',
      name: 'Router link',
      kind: 'router',
      phase: 'core',
      devices: 2,
      hosts: 2,
      vlan: null,
    });
  }
  if (wifi) {
    segments.push({
      id: 'wifi',
      name: 'Wi-Fi',
      kind: 'wifi',
      phase: 'extension',
      devices: req.laptops,
      hosts: req.laptops + 1,
      vlan: vlan ? 200 : null,
    });
  }
  return segments;
}
