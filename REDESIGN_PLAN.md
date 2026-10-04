# NetArchitect Redesign Plan (saved as REDESIGN_PLAN.md)

## Context
NetArchitect works: the engine in `src/engine/` is tested (25 tests) and the demo numbers are right. But the UI is a single dark navy/teal screen that reads as a generated demo. The goal is to make it a polished, deployable site:
- a warm, minimal, editorial landing page (`/`)
- a refined designer tool (`/app`)
- a docs page (`/docs`) and a 404 page
- a light/dark theme with no flash on load
- SEO, accessibility, performance, linting and deploy configs for Vercel and Netlify

Engine logic stays the same apart from bug fixes, and every existing test must still pass.

**First step after approval:** copy this plan to `CN/REDESIGN_PLAN.md`. Then execute it end to end with a task list.

## What exists today (I wrote it earlier in this session)
- **Engine (pure JS):**
  - `designNetwork.js` runs the pipeline: validation → `evaluateRules` → `buildSegments` → `calculateVlsm` → `buildGraph` → `computeSummary` → `explainDesign`.
  - `constants.js` holds `demoRequirements`, `emptyRequirements`, `buildDepartments`, `defaultDeptName`, `NEED_KEYS`, plus the neon `SEGMENT_COLORS`.
  - `icons.js` holds the neon `TYPE_COLORS` and SVG data URIs. This is UI code that happens to live in engine/.
- **UI:**
  - 13 components in `src/components/`, one `src/styles/theme.css` with a navy palette, and `App.jsx` holding all the state.
  - `NetworkGraph.jsx` uses vis-network with hardcoded colors and a `beforeDrawing` background fill.

## Design system
- **`src/styles/tokens.css`:** a single source for all tokens.
  - Light and dark colors exactly as you specified. Light is the default; `[data-theme="dark"]` overrides it.
  - Earthy segment colors `--seg-1…8`, set separately per theme: terracotta #B4532A, olive #6E7444, ochre #B8892F, slate #5E6B73, clay #9A6A55, sage #87997A, umber #7A5C3E, stone #8C8478. Dark mode gets lifted variants of each.
  - Diagram tokens: `--node-fill`, `--node-stroke`, `--edge`, `--edge-redundant` (= accent), `--edge-wireless` (= slate).
- **Type scale:** `--fs-12/14/16/20/28/40/64/88`.
  - Fonts: Instrument Serif for display, Inter Tight (variable) for UI at 15px base / 1.6 line-height, JetBrains Mono for numbers and addresses.
  - All three are self-hosted via `@fontsource`.
  - Large headings get letter-spacing −0.02em. Uppercase tracking is used only on `.label` (12px).
- **Spacing:** 8px scale `--s-1…--s-12` (4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128).
- **Shape and depth:** radius 6px / 10px. Borders are 1px; there are no shadows except a single 1px focus ring.
- **Grid:** `.container` max 1200px with 24px gutters, and a `.grid-12` utility.
- **Motion:** 150–250ms ease. Landing sections fade and slide in via IntersectionObserver (`useReveal`). Everything is disabled under `prefers-reduced-motion`.
- **Other base styles:**
  - focus ring: `outline: 2px solid var(--accent); outline-offset: 2px`
  - themed scrollbars
  - `::selection` uses accent-soft
- **Global CSS files:**
  - `src/styles/base.css` (reset, typography, utilities)
  - `src/styles/app.css` (designer layout)
  - `src/styles/landing.css`
  - Component-specific CSS sits next to each primitive.

## Theme switching
- **Inline script in `index.html`, before paint:**
  - It reads `?theme=` (useful for screenshots), then `localStorage['na-theme']`, then `prefers-color-scheme`.
  - It sets `data-theme` on `<html>` and the `color-scheme` property.
- **`src/lib/theme.js`:** `ThemeProvider` plus `useTheme()`, which provides `{theme, toggle}`.
  - It persists the user's choice. It also listens to the system preference until the user picks a theme explicitly.
- **`ThemeToggle`:** a lucide Sun/Moon button with an `aria-label` like "Switch to dark theme".
- **`src/lib/cssVars.js`:** `readVars(names)` uses `getComputedStyle(document.documentElement)` so the diagram can read the current theme colors.

## Routing (react-router-dom v7)
`main.jsx` sets up `BrowserRouter` → `ThemeProvider` → `ToastProvider` → `ErrorBoundary` → `Layout` (SkipLink, Navbar, `<main id="content">`, Footer). Routes:
- `/` → `Landing` (eager)
- `/app` → `lazy(() => import('./pages/DesignerPage'))`. vis-network sits behind a further `lazy` NetworkGraph chunk.
- `/docs` → lazy `DocsPage`
- `*` → `NotFound`

`usePageMeta(title, description)` sets the document title, meta description and OG title for each route. On route change, the page scrolls to the top, or to the hash target if there is one.

## Landing page (`src/pages/Landing.jsx` + `src/components/landing/*`)
The layout is left-aligned and editorial: a label column plus a content column on the 12-column grid, with thin rules between sections. Sections:
1. **Hero:** an 88px serif headline, the sub-copy, and the primary "Open the designer" and secondary "See how it works" (#how) buttons. `HeroDiagram.jsx` is a static line-art SVG of the layers (Internet → R1 → SW-CORE → SW-A/B/ADM → devices), drawn with `currentColor`/token strokes. It includes the dashed accent redundant links and the dotted wireless links, plus monospace IP captions.
2. **The problem:** two short paragraphs set in a two-column layout.
3. **How it works** (`#how`): an `<ol>` of 6 steps, each with a mono number "01…06", a title and one or two sentences. It runs horizontally on desktop (6 columns with top rules) and vertically below 900px.
4. **Architecture:** a bordered box diagram in HTML/CSS grid with 1px connector lines. Input → Rule Engine → {Diagram Generator, Explanation Engine, VLSM Calculator} → Summary. A paragraph explains that the engine is plain JavaScript, independent of the UI, and unit tested.
5. **Topology rules:** a two-column `<table>` (condition → result), with a one-line description and trade-off under each result.
6. **VLSM explained** (`#vlsm`): an explanation, then the 3 steps, then the worked example.
   - `useMemo(() => designNetwork(demoRequirements()))` computes the example at render time. The table shows only the 5 core segments, built from `vlsm.allocations.filter(phase==='core')`.
   - The "124 of 256 used, .124–.255 free (132)" line comes from `vlsm.core`.
   - The `AddressBar` component is shared with the app.
7. **What you get:** a list of 4 rows, each with text on the left and a live mini-component on the right:
   - a node-details card for SW-A from the real demo graph
   - an explanation excerpt
   - the first 3 rows of the IP table
   - the summary numbers
8. **Tech** (`#tech`): a definition list (React 19, Vite, vis-network, Vitest, CSS variables, react-router) with one factual line each.
9. **Roadmap:** a list of 4 items with "Planned" badges.
10. **Closing CTA:** the serif line and the "Open the designer" button.
11. **Footer:** project name, the SRM line, the team names and GitHub link from `src/config/site.js` (`SITE`, `TEAM_NAMES`, `GITHUB_URL`, `SITE_URL`), and the year.

**Navbar:** a serif "NetArchitect" wordmark, then links to How it works (`/#how`), VLSM (`/#vlsm`), Tech (`/#tech`) and Docs, a GitHub icon link, the theme toggle, and an "Open the app" primary button. On mobile these collapse into a menu button that opens a full-width panel.

## Designer page (`/app`)
The state moves out of `App.jsx` into a `useDesigner()` hook (`src/features/designer/useDesigner.js`). It carries the existing `resplit` / handlers logic over unchanged.
- **Layout:** a sticky sidebar (360px, scrolls independently) and a main area with an underline `Tabs` bar (keyboard: arrow keys, Home/End, roving `tabindex`, `role=tab`/`tabpanel`).
  - Under 900px the sidebar becomes a collapsible top sheet. Its "Requirements" header has a chevron and shows a summary of the current inputs. It starts open until the first design, then collapses.
- **Form** (`RequirementsForm`, `DepartmentTable`, `DeviceCounts`, `NeedsChecklist`, `BaseNetworkField`):
  - grouped sections with `.label` headings
  - a `NumberStepper` primitive (− / input / + buttons with aria-labels)
  - a styled `Checkbox` primitive
  - an `Input` with inline errors (`aria-invalid`, `aria-describedby`)
  - errors appear grouped under the form and also inline on the CIDR field and the department totals
  - one primary "Design network" button; "Load demo" and "Reset" are secondary
  - `?demo=1` auto-loads the demo (used for screenshots and as a shareable link)
- **Empty state:** a short instruction and a "Load demo" button.
- **Loading:** clicking Design shows a brief "Designing…" state (one `requestAnimationFrame` tick plus `startTransition`). The lazy graph chunk uses a Suspense skeleton.
- **Toast:** `ToastProvider` + `useToast()`. It shows VLSM overflow errors and "Design updated". It uses `role=status` and dismisses itself after 4s.
- **Diagram** (`features/designer/diagram/`):
  - **`NetworkGraph.jsx`:**
    - Builds node and edge styles from `readVars()`. Node icons are SVG data URIs from `diagramIcons.js` (moved out of engine/), drawn as 1.5px-stroke line icons in `--text`/`--accent` on a `--surface` fill.
    - Edge colors: solid uses `--edge`, redundant is dashed `--accent`, wireless is dotted slate.
    - Fonts are Inter Tight and JetBrains Mono.
    - When `theme` changes it rebuilds the styles and calls `nodes.update` / `edges.update` rather than recreating the network, so the view position is kept.
    - The `beforeDrawing` background uses `--surface`, so PNG export follows the theme.
  - **`DiagramToolbar`:** zoom in, zoom out, fit and export, as lucide icon buttons with labels and tooltips. Keyboard: `+`/`-`/`0` work while the graph has focus.
  - **`Legend`:** a row of icons and line samples.
  - **`NodeDrawer`:** a right-side panel (or a bottom sheet on mobile) with monospace values and a close button. It has `aria-live`. Neighbours are buttons that focus the matching node.
- **IP Plan:**
  - `AddressBar` with labels above (segment names and mono offsets) and earthy colors from `--seg-n`
  - a `Table` primitive with mono columns, zebra rows on `--surface-2`, and right-aligned numbers
  - usage lines
  - an overflow error card with the "Use suggestion" button
- **Summary:** a grid of large serif numbers with small labels, separated by 1px dividers (no boxed cards), and a topology line.
- **Explanation:** a numbered `<ol>` grouped by category, `max-width: 65ch`.

## UI primitives (`src/components/ui/`)
`Button` (primary/secondary/ghost/icon, sizes), `Section`, `Card`, `Tabs`, `Table`, `Toggle` (theme), `Input`, `NumberStepper`, `Checkbox`, `Badge`, `Toast`, `ErrorBoundary`, `SkipLink`.

## Cleanup / engine
- Move `src/engine/icons.js` → `src/features/designer/diagram/diagramIcons.js`, and make it theme-aware: `iconFor(type, colors)`, cached by theme.
- Remove `SEGMENT_COLORS` from `constants.js`; colors now come from CSS tokens.
- Delete the old `theme.css`, `Header.jsx`, the old components and `App.jsx` as they are replaced.
- Delete the stale `docs/screenshots` placeholders and replace them with real screenshots.
- Engine bug review: `graphBuilder`'s ring closing flag, the `formatIpRanges` en-dash spacing, and validation. Fix only real bugs and add tests for any fix.
- Add `tests/landing.test.js`. It checks that the landing data helper (`src/features/landing/vlsmExample.js`, which calls the engine) returns the exact demo rows. This guarantees the landing page and the engine agree.

## SEO / assets / deploy
- **`index.html`:** title, meta description, canonical URL, Open Graph and Twitter card tags (absolute URL from `SITE_URL`, default `https://netarchitect.vercel.app`; change it after you deploy), `theme-color` per scheme, favicon.svg, and apple-touch-icon.png.
- **`public/`:** favicon.svg (a minimal node mark with an "NA" monogram in terracotta on beige), apple-touch-icon.png (180px), og-image.png (1200×630), robots.txt, sitemap.xml, and `_redirects` (`/* /index.html 200`).
- **`scripts/generate-assets.mjs`:** uses `sharp` (a dev dependency) to render the SVG sources to PNG. Run it as `npm run assets`, and commit the outputs.
- **Deploy configs:**
  - `vercel.json`: SPA rewrite plus cache headers for `/assets`
  - `netlify.toml`: build command, publish `dist`, SPA redirect
- **Performance:** Vite `manualChunks` puts `vis-network` in its own chunk, loaded only on `/app`. The landing page doesn't import vis. Fonts are subset to latin with `font-display: swap`.

## Tooling
- **ESLint 9 flat config** (`eslint.config.js`): `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and `globals`, plus `eslint-config-prettier`.
- **Prettier:** `.prettierrc` (single quotes, printWidth 120) and `.prettierignore`.
- **Scripts:** `lint`, `format`, `assets`.
- **New dependencies:**
  - `react-router-dom`, `lucide-react`
  - `@fontsource/instrument-serif`, `@fontsource-variable/inter-tight`, `@fontsource-variable/jetbrains-mono`
  - dev: `eslint` + plugins, `prettier`, `sharp`
  - `vis-data` was installed earlier but only `vis-network/standalone` is used, so remove `vis-data`.

## README
Sections: overview, screenshots (light and dark of the landing page and the app), features, how it works, tech stack, local setup, tests, deployment on Vercel (CLI and Git import) and Netlify, project structure, roadmap and team.
- **Screenshots:** headless Chrome (`/Applications/Google Chrome.app`) loads `?theme=light|dark` and `/app?demo=1&theme=…`, saving to `docs/screenshots/*.png`.

## Execution order
1. Copy the plan to REDESIGN_PLAN.md and install the dependencies.
2. Tokens, base CSS, fonts and the theme script/provider.
3. UI primitives, Layout, Navbar, Footer, ErrorBoundary, Toast, the router, and the 404 page.
4. Designer page: `useDesigner`, the form, tabs, the themed diagram, the IP plan, summary and explanation. Remove the old components.
5. Landing page, then the Docs page.
6. SEO assets, the asset script, and the deploy configs.
7. ESLint/Prettier, then fix lint.
8. QA in the browser pane: both themes at 375/768/1366/1920 on `/`, `/app` (demo), `/docs` and a 404. Check the console for errors and warnings, theme toggle on the diagram, PNG export colors, keyboard tab navigation and focus rings.
9. Screenshots via headless Chrome. Run Lighthouse via `npx lighthouse` against `npm run preview`, aiming for 90+ in every category.
10. Update the README. Final run of `npm run build && npm test && npm run lint`.

## QA checklist
- [ ] Searching CSS/JSX for purple, blue, navy or neon hex values (#8b7cf6, #38bdf8, #22d3c5, #0a1220, #111f38, …) finds nothing.
- [ ] No gradients, glows, emoji or heavy shadows; radius is ≤ 10px everywhere.
- [ ] No flash on hard reload in dark mode. The toggle persists across reloads and routes.
- [ ] The diagram's nodes, labels, edges, legend and PNG background all switch with the theme.
- [ ] The landing page's VLSM table equals the app's IP plan for the demo, and the test enforces it.
- [ ] Tabs work with the keyboard. The skip link works. Focus is visible. Every icon button has an aria-label.
- [ ] Contrast is AA (text and muted text against bg/surface in both themes; I'll verify the accent on beige: #B4532A on #F4EFE6 ≈ 4.6:1).
- [ ] At 375px there's no horizontal scroll, the top sheet works and the diagram can still be panned and zoomed.
- [ ] The browser console has no errors or warnings on any route.
- [ ] `npm run build`, `npm test` and `npm run lint` all pass with no warnings.

## Verification
- `npm test`: the existing 25 tests plus the new landing test pass.
- `npm run lint` and `npm run build` are clean.
- Dev server via a background Bash process, viewed in the browser pane (the preview launcher can't open the Desktop folder, so I attach to the URL instead). Go through the checklist with `resize_window` at 375/768/1366/1920 and `colorScheme` emulation plus the toggle. Check `read_console_messages`.
- **Deploy command:** `npx vercel --prod`. This needs your Vercel login, so you run it.
