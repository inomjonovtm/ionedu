# Ionedu — "Atlas" design system (v3)

Audience: school-age students (12–18) learning geography in Uzbekistan. The
site should feel like a **friendly, modern atlas / explorer's notebook** —
playful and energetic, but clean and minimal. NOT a corporate SaaS dashboard.

All UI text is in **Uzbek (Latin)**. Keep existing copy/meaning; you may tighten wording.

## Visual language

- **Map paper**: page background is warm sand `var(--paper)`; cards are `var(--white)`.
- **Navy ink**: text, strong outlines (`var(--line)`), dark panels (`var(--ink)`, always dark — white text on it).
- **Sticker look**: important elements have a 1.5–2px `var(--line)` outline and a hard
  offset shadow (`var(--hard-sm)`, `var(--hard)`, `var(--hard-lg)`) — no blurry drop shadows,
  no gradients, no glassmorphism/backdrop-filter.
  Hover = element lifts `translate(-2px,-2px)` and gains the hard shadow.
- **Quiet by default**: ordinary cards use the soft hairline `1.5px solid var(--border)`;
  only heroes, CTAs, selected/hover states and key callouts get the ink outline + hard shadow.
  Dividers inside cards are `1.5px dashed var(--border)` (like map fold lines).
- **Accent colours** (flat fills, used in blocks — never as gradients):
  `var(--sun)` yellow (primary highlight, active states), `var(--coral)`, `var(--sea)` blue,
  `var(--green-600)` land green (success/progress/correct), `var(--violet)`.
  Soft tints: `--sun-soft --coral-soft --sea-soft --green-100 --violet-soft`.
  On a sun/coral/pastel fill always use dark text `#14213D` (it must stay dark in dark mode).
- **Geography motifs**: contour-line texture (`className="topo"` or `background-image: var(--topo)`),
  dot grid (`.dotgrid`), coordinates in mono (`<span className="coord">41.31°N · 69.24°E</span>`),
  map pins, compass, route/dashed lines, slightly rotated "stamp"/"sticker" tiles (`transform: rotate(-3deg)`),
  big emoji on flat colour tiles. Use them sparingly — one or two per section.
- **Type**: headings `var(--font-display)` (Bricolage Grotesque, weight 700–800, tight tracking −0.03/−0.045em),
  body `var(--font-body)` (Plus Jakarta Sans, weights 500–700), labels/numbers-as-data `var(--font-mono)` uppercase small.
  Big confident headlines (hero 56–84px desktop, page titles ~52px, section titles ~40px). Highlight one word
  with `<span className="mark-sun">…</span>` (also `mark-sea`, `mark-leaf`, `mark-coral`).
- **Radius**: cards 22px (`var(--r-card)`), buttons 14px, small tiles 12–16px, pills 999px.
- **Layout**: break out of "uniform 3-column card grid + centered header" patterns. Prefer asymmetric
  bento grids, a large feature item + smaller ones, numbered steps, horizontal rails, side-by-side
  splits, sticky side panels. Generous whitespace. Everything must stay responsive (stack ≤ 768px).

## Tokens (defined in `src/ioneda.css`, all flip automatically in dark mode)

Surfaces `--white --paper --bg-soft --ink --ink-2`; outline `--line`; text `--text --text-2 --text-3 --text-4`;
hairlines `--border --border-2`; greens `--green-50…800`; `--blue-50 --blue-600 --sea --sea-soft`;
`--amber-50 --amber-600 --sun --sun-soft`; `--red-50 --red-600 --coral --coral-soft`; `--violet --violet-soft`;
shadows `--hard-sm --hard --hard-lg --shadow-soft --shadow-ring`; fonts `--font-display --font-body --font-mono`.

Never hard-code light-only colours (`#fff`, `#F6F7F5`, greys…) for surfaces/text — use tokens so dark mode works.
Exception: text on sun/coral/pastel fills is `#14213D`; text on `var(--ink)` panels is `#fff` / `#B7C0D8`.

## Ready-made classes (global, in `ioneda.css`)

- Buttons: `btn` + `btn-primary` (navy with yellow hard shadow) / `btn-accent` (yellow) / `btn-secondary` / `btn-ghost` / `btn-danger`; sizes `btn-sm`, `btn-lg`, `btn-block`.
- `chip` (outlined pill; `chip on` = selected; `chip chip-sun`), `badge badge-{green|blue|amber|red|gray}`.
- `card`, `card card-hover`, `card card-ink` (ink outline + hard shadow).
- Forms: `field`, `label`, `input`, `select`, `textarea`, `checkbox`, `field-hint`, `field-error`,
  `<label className="switch"><input type="checkbox" /><span /></label>`.
- `eyebrow` (map-pin pill label), `section-title`, `section-sub`, `breadcrumb`, `divider`, `coord`.
- `table-wrap` > `table`, `row-actions`, `icon-btn` (+ `danger`).
- `thumb thumb-{green|blue|amber|rose|teal|violet|slate}`, `avatar avatar-{blue|amber|rose|violet|teal|green}`.
- `progress` > `progress-fill`, `spinner`, `loading-state`, `skeleton`, `empty-state` (`es-ico`, `es-title`, `es-sub`).
- Dash kit (`components/Dash.jsx`): `PageHead`, `StatCard` (tones green/blue/amber/red/gray/violet), `Panel`, `EmptyState`, `CourseStatus`, `Stars`; classes `kpi-grid`, `two-col`, `panel`, `row-line`, `seg-tabs`, `table-toolbar`, `search-box`.
- `modal-backdrop` > `modal`.
- Animations: `fade-up`, `fade-up-d1..d4`, `floaty`.
- Shared components: `Layout` (Navbar+Footer), `DashLayout kind="admin|teacher|student"`, `PageHeader`, `CourseCard`, `FilterBar`, `Pagination`, `Icon` (see `components/Icon.jsx` for names), `Logo`/`LogoMark`.

## Rules for page work

- Page-specific CSS lives in a `const css = \`…\`` template string rendered via `<style>{css}</style>` with a
  short unique class prefix per page (existing convention). Prefer classes over long inline styles.
- Do NOT change data fetching, API endpoints, query keys, routes, business logic, or component props/exports.
  Change markup, layout and styles only (you may reorder/regroup sections and improve empty/loading states).
- Do NOT edit shared files: `ioneda.css`, `responsive.css`, `index.css`, `components/Navbar.jsx`, `Footer.jsx`,
  `DashLayout.jsx`, `Dash.jsx`, `Icon.jsx`, `Logo.jsx`, `api/*`, `store/*`, `App.jsx`, `main.jsx` — if you need
  something global, define it locally in the page.
- No new npm dependencies. Icons come from `components/Icon.jsx` only.
- Verify with `npx eslint <the files you changed>` from `frontend/` (pre-existing `react-hooks/set-state-in-effect`
  errors can be ignored; do not introduce syntax errors or unused imports). Do NOT run `npm run build` or start servers.
