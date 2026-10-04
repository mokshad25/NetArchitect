# NetArchitect — Implementation Plan

## Context
College Computer Networks project, built from scratch in the empty folder `/Users/mokshad/Desktop/c/CN` (Node 24 / npm 11 available). The user types in **requirements** (device counts and needs), not a topology. The app runs Analyze → Recommend Topology → Draw → Explain → VLSM IPs → Summary, all in the browser. It must be ready to demo: the "Load Demo" button has to reproduce the exact VLSM numbers in the brief, and `npm run build` and `npm test` both have to pass.

Once this plan is approved, my first step is to copy it into the project as `PLAN.md`. After that I build everything end to end and track progress with a task list.

## Key design decisions (from working through the demo numbers)
1. **A segment's host count includes its gateway.** Each department gets a switch/SVI, and that switch takes the first usable address. The Wi-Fi AP takes the first Wi-Fi address and R1 takes the first router-link address. So the hosts in a segment are the end devices + 1. This is the only way the demo numbers work. For example, Servers with 6 hosts becomes a /29 with 6 usable addresses: gateway plus 5 servers. Dept B with 30 hosts becomes a /27 with 30 usable addresses: SW-B plus 29 devices.
   - Demo inputs: PCs 92 (A 55, B 27, Admin 10), Printers 7 (4/2/1), Servers 5, Laptops 4, 3 departments.
   - Resulting segments: Dept A 60, Dept B 30, Admin 12, Servers 6, Router link 2, Wi-Fi 5 (4 laptops + AP).
2. **VLSM runs in two phases.** The *core* segments (departments, servers, router link) are sorted and allocated first. *Extension* segments (Wi-Fi) are allocated afterwards from the free space. The output reports both:
   - `core` stats: 124/256 used, free .124–.255 (132). These are the numbers the brief expects.
   - `total` stats after Wi-Fi: Wi-Fi /29 at .128, 132 used, free ranges .124–.127 and .136–.255.
   - The UI shows both lines, so every number in the brief is visible and every device still gets an address.
3. **Laptops when Wi-Fi is off:** each department row gets a laptops column, laptops are wired into the departments, and they count toward that department's segment.
4. **Collapsed nodes** ("+N more") store `count: N` and an IP range. Summary stats add up the `count` values, so the totals cover every device even though the diagram stays readable.

## Folder structure
```
CN/
  PLAN.md  README.md  package.json  vite.config.js (+ vitest config)  index.html
  .claude/launch.json            # dev server for preview
  src/
    main.jsx  App.jsx
    styles/theme.css             # CSS variables, dark theme, layout
    engine/                      # pure JS, no React imports
      constants.js               # device types, colors, demo preset, default requirements
      ipUtils.js                 # ip<->int, mask, CIDR parse/validate, formatting
      validation.js              # form validation → {errors[], warnings[]}
      ruleEngine.js              # data-driven rules → {topology, components, features, reasons}
      segments.js                # requirements → VLSM segment list
      vlsm.js                    # VLSM calculator
      graphBuilder.js            # layered nodes/edges + IP assignment
      explainer.js               # "Why this design?" items
      summary.js                 # stat cards computed from the graph + vlsm
      designNetwork.js           # pipeline orchestrator
      icons.js                   # inline SVG data-URIs for node images
    components/
      Header.jsx  InputForm.jsx  DepartmentEditor.jsx  Tabs.jsx
      DiagramView.jsx  NetworkGraph.jsx  NodeDetails.jsx  Legend.jsx
      ExplanationPanel.jsx  IpPlan.jsx  VlsmTable.jsx  AddressBar.jsx  SummaryCards.jsx
  tests/
    vlsm.test.js  ruleEngine.test.js  graphSummary.test.js  validation.test.js
```
Dependencies: `react`, `react-dom`, `vis-network`, `vis-data`. Dev dependencies: `vite`, `@vitejs/plugin-react`, `vitest`.

## Data models
```js
requirements = {
  pcs, laptops, servers, printers, departmentCount,
  departments: [{ name, pcs, printers, laptops }],
  needs: { internet, multipleDepartments, separation, wifi, redundancy, security, scalability },
  baseNetwork: '192.168.10.0/24'
}
design (ruleEngine) = {
  topology: 'star'|'hierarchical'|'ring'|'hybrid',
  topologyLabel: 'Hybrid (Hierarchical Star + Partial Mesh)',
  components: [{ topology:'hierarchical', part:'core → dept switches → devices' }, ...],
  structure: { core:bool, deptSwitches:bool, ring:bool, mesh:bool, backupCore:bool },
  features: ['vlan','wifi','internet','serverSegment'],
  firedRules: ['hierarchical', ...],
  reasons: [{ ruleId, text }]
}
segment = { id, name, hosts, kind:'department'|'wifi'|'servers'|'router', phase:'core'|'extension', vlan? }
vlsmResult = {
  ok, error?, suggestion?,            // e.g. "Try 192.168.10.0/23"
  base: { network, prefix, size },
  allocations: [{ id, name, hosts, blockSize, network, prefix, cidr, mask,
                  firstUsable, lastUsable, broadcast, usableCount, phase }],
  skipped: [names with 0 hosts],
  core:  { used, free, freeRanges:[{start,end,size}] },
  total: { used, free, freeRanges }
}
graph = { nodes:[{ id, label, type, level, dept?, ip?, ipRange?, subnet?, mask?, count, vlan? }],
          edges:[{ id, from, to, kind:'normal'|'redundant'|'wireless' }] }
```

## Module 2 — Rule engine (`ruleEngine.js`)
Every rule is `{ id, kind:'structure'|'feature', condition(req, ctx), action(design, req, ctx), reason(req, ctx) }`. The `ctx` holds derived values: totalDevices, deptCount, and an estimated switch count. `evaluateRules(req, rules = RULES)` runs each rule whose condition is true, applies its action, and pushes its reason. After that, `resolveTopology()` picks the topology label. To add a rule, you add one object to the array.

| id | condition | effect |
|---|---|---|
| `star` | totalDevices ≤ 24 && deptCount === 1 && !scalability | base = star (one switch) |
| `ring` | 2 ≤ deptCount ≤ 4 && totalDevices ≤ 24 && !internet && !scalability | base = ring of dept switches (backbone only) |
| `hierarchical` | (deptCount > 1 \|\| totalDevices > 24 \|\| scalability) && !ring fired | core switch → dept switches |
| `redundancy` | needs.redundancy | mesh = true: dashed links between adjacent dept switches (partial mesh). In star mode this adds a backup core SW-CORE-2 |
| `hybrid` (resolver) | 2 or more structural rules fired | topology = hybrid; components list which part comes from which topology |
| `vlan` | security \|\| separation | feature: one VLAN per dept (VLAN 10, 20, 30…) |
| `wifi` | needs.wifi && laptops > 0 (or wifi alone → AP with 0 clients, warning) | AP-1 + Wi-Fi segment |
| `internet` | needs.internet | R1 + Internet cloud + /30 router link |
| `servers` | servers > 0 | server segment attached to the core (or first ring switch) |

"Total devices" means PCs + laptops + servers + printers.

## Module 5 — VLSM (`vlsm.js`)
`calculateVlsm(baseCidr, segments)`:
1. Parse and validate the base network. It must be a network address; otherwise return an error that suggests the correct one.
2. Skip segments with 0 hosts (record them in `skipped`).
3. For each phase in order (core, then extension): sort by hosts descending (ties keep input order). For each segment, `block = nextPow2(hosts + 2)`, with a minimum of 4. Find the lowest free aligned start that fits inside the base by scanning the free ranges. Allocate the block.
4. If a segment doesn't fit, return `ok:false` with an error. The suggestion is the smallest prefix that would hold everything: `32 - log2(nextPow2(sum of blocks))`, starting from the base network address.
5. Compute the mask, first/last usable, broadcast, free ranges and used counts for each phase.

`assignIps(allocation, n)` hands out addresses in order: the first usable goes to the gateway, then devices in sequence.

## Module 3 — Graph builder (`graphBuilder.js`)
`buildGraph(req, design, vlsm)` returns `{nodes, edges}`. The levels are:
- L0: Internet
- L1: R1
- L2: SW-CORE (and SW-CORE-2 when needed)
- L3: SW-A / SW-B / SW-ADM, SRV-n, AP-1
- L4: PCs, printers, laptops

Naming:
- "Dept X" gets code X; any other name gets its first 3 letters, uppercased and made unique (Admin → ADM).
- Devices: PC-A1, PRN-A1, LAP-1, SRV-1.

In a ring there's no core: dept switches link in a cycle, and servers and the AP hang off the first switch. In a star, devices attach straight to SW-CORE.

Any group with more than 8 devices draws 3 samples plus a `+N more` node, which carries `count` and an IP range. Edge kinds:
- `redundant`: dashed teal
- `wireless`: dotted blue (AP→laptops)
- everything else: solid

Every node gets its IP, subnet, mask, department and VLAN from its segment. The router-link /30 gives R1 .121 and SW-CORE .122.

`NetworkGraph.jsx` builds the vis-network view:
- hierarchical layout (UD), using `level`, with physics off
- SVG icons from `icons.js`
- a `beforeDrawing` hook that paints the dark background, so the exported PNG isn't transparent
- **Fit** (`network.fit()`) and **Export PNG** (canvas `toDataURL` → download link) buttons
- clicking a node calls `onSelect` → `NodeDetails` shows type, name, IP, subnet, dept, VLAN, link count and the list of neighbours

A legend sits below the graph.

## Module 4 — Explainer (`explainer.js`)
`explainDesign(req, design, vlsm, graph)` returns `[{ category, title, text }]`. It includes:
- one item per reason from the rule engine, rewritten as beginner sentences
- per-segment sizing lines ("Dept A got a /26 because it needs 60 hosts + 2 … = 62 … block 64")
- the Wi-Fi extension note
- an address-usage summary

Everything is written at 10th-grade level, one or two sentences per item.

## Module 6 — Summary (`summary.js`)
`computeSummary(graph, vlsm)` derives every number from the data, with nothing hard-coded:
- totalDevices: Σ count over every node except the Internet cloud, with a breakdown of end devices vs infrastructure
- switches, routers
- connections = `edges.length`
- departments = number of distinct dept values
- segments = `allocations.length`

## Module 1 — Input form
- Number inputs for each device type (min 0; departments min 1).
- `DepartmentEditor` shows one row per department with a name and its PCs / printers (and laptops when Wi-Fi is off).
  - Rows auto-split evenly whenever a count changes, unless the user edited them by hand. A "Re-split evenly" button resets the split.
  - Default names are Dept A, B, …, and the last one is "Admin" when there are 3 or more.
  - A live check confirms the row totals match the top-level counts.
- Seven requirement checkboxes and the base CIDR input (validated with a regex and the octet/prefix range, network address required).
- Buttons: Design Network, Load Demo, Reset.
- `validation.js` returns friendly errors, shown inline. Design stays disabled until errors are fixed.

## Layout / UI
- **Header:** "Net" in white, "Architect" in teal, plus the tagline.
- **Grid:** the left column (~340px) holds the form. The main area has tabs: Diagram | Explanation | IP Plan (VLSM) | Summary.
- **Diagram tab:** the graph, with a details panel (~260px) on the right.
- **IP Plan tab:** the table plus an AddressBar. The bar is a horizontal strip with flex widths proportional to each block's size, one color per segment, a hatched area for free space, and a tooltip on each block.
- **Theme:** CSS variables for the given palette (#0a1220 bg, #111f38 cards, teal/blue/purple/amber/coral). Fits a 1366×768 screen.
- The design re-runs when you click Design / Load Demo. Load Demo also designs right away.

## Tests (Vitest, node env)
- vlsm: the demo matches every value in the brief. Each of the 5 core segments is checked for network, mask, usable range and broadcast. Core used = 124, free .124–.255 = 132, and Wi-Fi lands at 192.168.10.128/29.
- vlsm: an overflow case gives `ok:false` with a /23 suggestion. Segments with 0 hosts are skipped. Invalid CIDR gives an error.
- ruleEngine:
  - 1 dept and 10 devices → star
  - 3 depts + scalability → hierarchical
  - hierarchical + redundancy → hybrid, and the components include partial-mesh
  - security → features include `vlan`
  - adding a custom rule to the array works
- graphSummary: the demo summary equals the node/edge counts of the generated graph. Every graph node except the cloud has an IP or IP range. Collapsed nodes add up so the department totals are exact.
- validation: bad CIDR and mismatched department totals each produce errors.

## Execution order
1. Scaffold the project by hand (package.json, vite config, index.html), then `npm install`.
2. Engine: ipUtils → vlsm → segments → ruleEngine → graphBuilder → summary → explainer → designNetwork, with tests alongside. Run `npm test` until it's green.
3. Components and CSS. Wire everything up in App.jsx.
4. Write `.claude/launch.json`, start the dev server, open it in the browser pane, click Load Demo, and verify:
   - the table values and the 124/256 line
   - the Hybrid label
   - the diagram, node clicks, Fit and Export
   - that the console has no errors
5. `npm run build` and `npm test`, and fix any failures.
6. README.md:
   - setup, how to run, how it works (pipeline + rules + VLSM)
   - a screenshots section with placeholders under `docs/screenshots/` and instructions for capturing them
   - Coming soon: IPv6, Packet Tracer export, VLAN/routing config generation, hardware cost estimation

## Verification
- `npm test`: every suite passes.
- `npm run build`: succeeds.
- In the browser pane (dev server on port 5173): Load Demo gives Dept A 192.168.10.0/26 … Router 192.168.10.120/30 and Wi-Fi .128/29. It shows "124 of 256 used, free .124–.255 (132)" and the topology "Hybrid". The summary cards match the drawn graph, and `read_console_messages` with `onlyErrors` comes back empty.
