/** Rows for the summary stat grid: [label, value, note]. */
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function summaryStats(summary, design) {
  const infra = summary.totalDevices - summary.endDevices;
  return [
    [
      'Total devices',
      summary.totalDevices,
      `${plural(summary.endDevices, 'end device')} + ${plural(infra, 'network device')}`,
    ],
    [
      'Switches',
      summary.switches,
      design.structure.deptSwitches ? 'Core and department switches' : 'One central switch',
    ],
    ['Routers', summary.routers, summary.routers ? 'Connects the LAN to the internet' : 'No internet requested'],
    [
      'Connections',
      summary.connections,
      `${summary.redundantLinks} redundant, ${summary.wirelessLinks} wireless, as drawn`,
    ],
    [
      'Departments',
      summary.departments,
      design.features.includes('vlan') ? 'Each on its own VLAN' : 'One shared network',
    ],
    ['Segments', summary.segments, 'Subnets in the VLSM plan'],
  ];
}
