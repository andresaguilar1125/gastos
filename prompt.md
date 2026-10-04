# PROJECT BRIEF: Personal Finance PWA — Finanzas CRC

## 1. GOAL
Build a **Progressive Web App (PWA)** deployable to **GitHub Pages** that visualizes personal finance data pulled **exclusively** from a public Google Sheets CSV URL. No backend, no auth, no database. The app is a **chart-first** dashboard (PowerBI-style), not a raw table viewer. It must work well on **mobile and desktop** and expose a **Settings page** where budget ranges (`min` → `max`) can be configured per category.

## 2. TECH STACK
- **Framework:** SvelteKit 2 + Svelte 5 (runes)
- **Build:** Vite (built into SvelteKit)
- **Routing:** SvelteKit file-based routing (built-in)
- **Charts:** ECharts via `svelte-echarts` (do NOT use `echarts-for-svelte` — abandoned since 2019)
- **CSV Parsing:** PapaParse
- **Styling:** Tailwind CSS
- **State:** Svelte 5 runes (`$state`, `$derived`, `$effect`) + `localStorage` persistence
- **PWA:** `@vite-pwa/sveltekit` or scaffold via `create-pwa-sv`
- **Deploy:** `@sveltejs/adapter-static` + GitHub Actions
- **Currency:** Costa Rican Colones (₡ CRC) — integers only, always rounded up, never decimals

## 3. DATA SOURCE
- Single public CSV URL from Google Sheets (`File → Publish to web → CSV`).
- User maintains a consolidated worksheet named `data`.
- URL stored in a single constant (`DATA_URL`) so it can be swapped easily. Optionally exposed in Settings for runtime override.

### 3.1 Expected Raw Columns (approximate — infer from data)
| Column | Meaning |
|---|---|
| Fecha / Mes | Date or month key |
| Categoria | Familiar, Medico, Restaurantes, Recibos, Super, Viajes, Ahorro |
| Subcategoria / Grupo | e.g. Super → Bebidas, Carnes, Granos, Harinas, Hogar, Lacteos, Postres, Salsas, Vegetales |
| Persona | Andres, Andres#, Mari, Mari#, Trabajo |
| Nota / Sobre | e.g. Gas, IPTV, Idema, Kolbi, AYA, CNFL, Telecable, Marchamo, IBM, Auto |
| Monto | Integer CRC (no decimals, rounded up) |

### 3.2 Data Rules (CRITICAL)
- **Currency:** Costa Rican Colones (₡). NO decimals. All values are **rounded up** to whole numbers.
- **Normalization — names:**
  - `Andres#` → `Andres`
  - `Mari#` → `Mari`
- **Ahorro (Savings):** This category is **NOT** in the raw CSV. It must be **duplicated N times** per the config. Treat as a synthetic category injected into aggregates.
- **Recibos (Bills) budget goal:** The objective is to **exhaust the budget entirely** each cycle. Highlight when unused.
- **Restaurantes / Super:** Target a **cap / max budget**.
- **Familiar / Medico:** Volatile, sporadic. No fixed budget — visualize trend & variance only.
- **Viajes:** Top spending category. Split by `Persona` (Andres, Mari, Trabajo).

## 4. SCREENS / VIEWS

### 4.1 KPI Header (top strip)
- Total spend (current period)
- Total min budget sum, total max budget sum
- Restante (Remaining)
- % used
- Overall status: `X / Y categories in range`
- Per-category mini-cards

### 4.2 Category Breakdown (Donut + Bar)
- Donut: % share per `Categoria`
- Bar: Sum per `Categoria` vs budget range (three-zone bar: min zone, ok zone, over zone)
- Reference values from screenshot: Ahorros 540 (43%), Familiar 89 (7%), Medico 25 (2%), Restaurantes 49 (4%), Recibos 89 (7%), Super 192 (15%), Viajes 93 (7%) → Total 1250 (100%)

### 4.3 "Sobre" (Envelope) View — Recibos drill-down
Horizontal bar chart of Nota → Sobre with Sum:
- Gas 0, IPTV 5, Idema 10, Kolbi 10, AYA 50, CNFL 30, Telecable 30, Marchamo 40, IBM 200, Auto 300 → Total 675
- Rule: **Recibos budget must be fully exhausted**. Show "Untouched" warnings when under `max` in `exhaust` mode.

### 4.4 "Super" Group View
Bar chart by Grupo: Bebidas, Carnes, Granos, Harinas, Hogar, Lacteos, Postres, Salsas, Vegetales.
- Show Oct totals and highlight top 3.

### 4.5 "Viajes" Person View
Bar chart by Persona after normalization:
- Mari (0), Mari# → Mari (10), Andres (0), Andres# → Andres (5), Trabajo (0), Total 15

### 4.6 Ahorro View
Line/area chart of synthetic Ahorro duplicated N times. Show cumulative savings target.

### 4.7 Settings View
- Per-category budget range editor (min, max, mode)
- Dual-thumb range slider + numeric CRC inputs (integer, no decimals)
- Mode selector: `exhaust` | `cap` | `range` | `target`
- Live preview mini-bar showing current spend within `[min, max]`
- Validation: `min ≤ max`, both integers ≥ 0
- Reset-to-default per row + Reset All
- Global settings: Ahorro duplicate factor (default 3), optional DATA_URL override
- Persisted to `localStorage` (key: `finanzas-budgets`)

## 5. CONFIG (`src/lib/config.js`)
```js
export const DATA_URL = "https://docs.google.com/.../pub?gid=...&single=true&output=csv";

export const AHORRO_DUPLICATE_FACTOR = 3;

export const DEFAULT_BUDGETS = {
  Recibos:      { min: 500, max: 600, mode: 'exhaust' },
  Restaurantes: { min: 0,   max: 60,  mode: 'cap'     },
  Super:        { min: 0,   max: 200, mode: 'cap'     },
  Familiar:     { min: 50,  max: 150, mode: 'range'   },
  Medico:       { min: 0,   max: 50,  mode: 'range'   },
  Viajes:       { min: 0,   max: 150, mode: 'range'   },
  Ahorro:       { min: 400, max: 600, mode: 'target'  },
};

export const CATEGORY_COLORS = {
  Familiar:     "#f4b400",
  Medico:       "#0f9d58",
  Restaurantes: "#7cb342",
  Recibos:      "#f9ab00",
  Super:        "#f9ab00",
  Viajes:       "#f9ab00",
  Ahorro:       "#db4437",
};
```

## 6. REFERENCE DATA (from screenshot — use as mock fixture)
Use this as `mockData.json` while developing before wiring the live CSV.

```json
{
  "sobre_recibos": [
    {"nota":"Gas","sobre":"Recibos","sum":0},
    {"nota":"IPTV","sobre":"Recibos","sum":5},
    {"nota":"Idema","sobre":"Recibos","sum":10},
    {"nota":"Kolbi","sobre":"Recibos","sum":10},
    {"nota":"AYA","sobre":"Recibos","sum":50},
    {"nota":"CNFL","sobre":"Recibos","sum":30},
    {"nota":"Telecable","sobre":"Recibos","sum":30},
    {"nota":"Marchamo","sobre":"Ahorro","sum":40},
    {"nota":"IBM","sobre":"Ahorro","sum":200},
    {"nota":"Auto","sobre":"Ahorro","sum":300}
  ],
  "promedio_categoria": [
    {"categoria":"Ahorros","avg":540,"pct":43},
    {"categoria":"Familiar","avg":89,"pct":7},
    {"categoria":"Medico","avg":25,"pct":2},
    {"categoria":"Restaurantes","avg":49,"pct":4},
    {"categoria":"Recibos","avg":89,"pct":7},
    {"categoria":"Super","avg":192,"pct":15},
    {"categoria":"Viajes","avg":93,"pct":7}
  ],
  "suma_oct": [
    {"categoria":"Ahorros","oct":540,"pct":43},
    {"categoria":"Familiar","oct":0,"pct":0},
    {"categoria":"Medico","oct":0,"pct":0},
    {"categoria":"Restaurantes","oct":0,"pct":0},
    {"categoria":"Recibos","oct":0,"pct":0},
    {"categoria":"Super","oct":41,"pct":3},
    {"categoria":"Viajes","oct":15,"pct":1}
  ],
  "super_grupo": [
    {"grupo":"Bebidas","oct":2},
    {"grupo":"Carnes","oct":13},
    {"grupo":"Granos","oct":2},
    {"grupo":"Harinas","oct":8},
    {"grupo":"Hogar","oct":14},
    {"grupo":"Lacteos","oct":2},
    {"grupo":"Postres","oct":0},
    {"grupo":"Salsas","oct":0},
    {"grupo":"Vegetales","oct":0}
  ],
  "viajes_persona": [
    {"persona":"Mari","oct":0},
    {"persona":"Mari#","oct":10},
    {"persona":"Andres","oct":0},
    {"persona":"Andres#","oct":5},
    {"persona":"Trabajo","oct":0}
  ]
}
```

## 7. RESPONSIVE STRATEGY

### 7.1 Breakpoints
| Breakpoint | Width | Layout |
|:---|:---|:---|
| base | < 768px | Single column, bottom nav |
| md | ≥ 768px | Two-column grid, top nav |
| lg | ≥ 1024px | Three-column PowerBI grid |

### 7.2 Mobile Rules
- Single-column stacked chart cards
- Bottom navigation: `Dashboard | Super | Recibos | Viajes | Settings`
- KPI strip = horizontally scrollable pills
- Charts use `aspect-ratio` containers
- Touch targets ≥ 44×44px
- `viewport-fit=cover` + `env(safe-area-inset-*)` padding for notched phones
- `overscroll-behavior: contain` on scrollable chart containers

### 7.3 Desktop Rules
- Top nav bar with horizontal links
- 3-column grid (main chart spans 2, side chart spans 1)
- KPI strip = single row
- PowerBI-style slicers (period selector, category filter) pinned to top

### 7.4 Svelte-specific Responsive
```svelte
<svelte:window bind:innerWidth />
{#if innerWidth < 768}
  <BottomNav />
{:else}
  <TopNav />
{/if}
```

## 8. BUDGET RANGE MODEL & STATUS LOGIC

### 8.1 Modes
| Category | Default Mode | Behavior |
|:---|:---|:---|
| Recibos | `exhaust` | Target = spend exactly `max`. Warn if under or over. |
| Restaurantes | `cap` | Warn if over `max`. Soft warning if under `min`. |
| Super | `cap` | Same as Restaurantes. |
| Familiar | `range` | Healthy if within `[min, max]`. Volatile, no hard fail. |
| Medico | `range` | Same as Familiar. |
| Viajes | `range` | Same, split by `Persona`. |
| Ahorro | `target` | Aim for ≥ `max` (higher is better). |

### 8.2 `budgetStatus(spend, {min, max, mode})` returns:
| Condition | Status | Color |
|:---|:---|:---|
| `spend < min` (mode=cap/range) | "Bajo mínimo" | blue |
| `min ≤ spend ≤ max` | "En rango" | green |
| `spend > max` | "Sobre presupuesto" | red |
| mode=exhaust && `spend == max` | "Agotado ✓" | green |
| mode=exhaust && `spend < max` | "Sin agotar: ₡X" | yellow |
| mode=target && `spend ≥ max` | "Meta cumplida" | green |

### 8.3 Progress bar (3-zone)
```
[--min zone (blue)--][--ok zone (green)--][--over zone (red)--]
                      ▲ current spend marker
```

## 9. PWA MANIFEST
```json
{
  "name": "Finanzas CRC",
  "short_name": "Finanzas",
  "start_url": "/finanzas-crc/",
  "scope": "/finanzas-crc/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 10. FILE STRUCTURE
```
src/
├── app.html
├── app.css                    # Tailwind + safe-area utilities
├── lib/
│   ├── config.js              # DATA_URL, DEFAULT_BUDGETS, colors
│   ├── loadData.js            # fetch + parse + normalize CSV
│   ├── aggregate.js           # sumBy*, pctShare
│   ├── budgetStatus.js        # (spend, range) => status
│   ├── format.js              # ₡ integer formatting
│   └── stores/
│       ├── settings.svelte.js # $state budgets + localStorage persist
│       └── data.svelte.js     # $state CSV data + derived aggregates
├── components/
│   ├── layout/
│   │   ├── TopNav.svelte
│   │   ├── BottomNav.svelte
│   │   └── PageShell.svelte
│   ├── charts/
│   │   ├── CategoryDonut.svelte
│   │   ├── CategoryBudgetBar.svelte
│   │   ├── SobreRecibos.svelte
│   │   ├── SuperGrupo.svelte
│   │   ├── ViajesPersona.svelte
│   │   └── AhorroTrend.svelte
│   ├── ui/
│   │   ├── KpiCard.svelte
│   │   ├── StatusBadge.svelte
│   │   ├── RangeSlider.svelte       # dual-thumb
│   │   ├── BudgetProgress.svelte    # 3-zone bar
│   │   └── NumberInputCRC.svelte    # integer, no decimals
│   └── settings/
│       ├── BudgetRow.svelte
│       └── GlobalSettings.svelte
└── routes/
    ├── +layout.svelte         # shell, nav, persist effect
    ├── +layout.js             # export const prerender = true
    ├── +page.svelte           # Dashboard
    ├── super/+page.svelte
    ├── recibos/+page.svelte
    ├── viajes/+page.svelte
    └── settings/+page.svelte
```

## 11. SETTINGS STORE (Svelte 5 runes)
```js
// src/lib/stores/settings.svelte.js
import { DEFAULT_BUDGETS, AHORRO_DUPLICATE_FACTOR } from '$lib/config.js';

export const budgets = $state({ ...DEFAULT_BUDGETS });
export const ahorroFactor = $state(AHORRO_DUPLICATE_FACTOR);

export function updateBudget(cat, patch) {
  budgets[cat] = { ...budgets[cat], ...patch };
}

export function resetBudget(cat) {
  budgets[cat] = { ...DEFAULT_BUDGETS[cat] };
}

export function resetAll() {
  Object.assign(budgets, DEFAULT_BUDGETS);
  ahorroFactor = AHORRO_DUPLICATE_FACTOR;
}
```

Persist in `+layout.svelte`:
```svelte
<script>
  import { budgets, ahorroFactor } from '$lib/stores/settings.svelte.js';
  $effect(() => {
    localStorage.setItem('finanzas-budgets', JSON.stringify({ budgets, ahorroFactor }));
  });
</script>
```

## 12. GITHUB PAGES DEPLOYMENT

### 12.1 `svelte.config.js`
```js
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

export default {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: {
      base: dev ? '' : process.env.BASE_PATH
    }
  }
};
```

### 12.2 `src/routes/+layout.js`
```js
export const prerender = true;
```

### 12.3 `static/.nojekyll`
Create an empty file. GitHub Pages uses Jekyll by default and ignores folders starting with `_` — including SvelteKit's `_app`. `.nojekyll` disables Jekyll.

### 12.4 `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: 'main'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
        env:
          BASE_PATH: '/finanzas-crc'
      - uses: actions/upload-pages-artifact@v3
        with:
          path: 'build'
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

## 13. IMPLEMENTATION STEPS FOR THE LLM

1. **Scaffold** with `npm create pwa-sv@latest finanzas-crc` (SvelteKit 2 + Svelte 5 + Tailwind + PWA).
2. **Install chart deps:** `npm i papaparse svelte-echarts echarts`.
3. **Set `base` path** in `svelte.config.js` and add `static/.nojekyll`.
4. **Create `src/lib/config.js`** with `DATA_URL`, `DEFAULT_BUDGETS`, `CATEGORY_COLORS`, `AHORRO_DUPLICATE_FACTOR`.
5. **Build `settings.svelte.js`** with runes-based `$state` and `updateBudget` / `resetBudget` / `resetAll`.
6. **Build `data.svelte.js`** — fetch CSV once on layout mount, run `loadData()` pipeline, expose `$derived` aggregates.
7. **Build `budgetStatus.js`** — pure function per §8.2.
8. **Build layout shell** — `PageShell` with `TopNav` (hidden below md) and `BottomNav` (hidden at md+). Apply `pb-[env(safe-area-inset-bottom)]` on mobile.
9. **Build Dashboard** — responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. KPI strip uses `overflow-x-auto` on mobile, `grid` on desktop.
10. **Wire every chart to `settings.svelte.js`** — pass min/max/mode, render `StatusBadge` + `BudgetProgress`. Runes make reactivity automatic.
11. **Build Settings page** — list of `BudgetRow` + `GlobalSettings`. Live-update charts automatically.
12. **PWA manifest** — verify `start_url` and `scope` match the GitHub Pages base path.
13. **Deploy** — push to `main`, GitHub Actions builds and deploys.

## 14. DESIGN LANGUAGE
- Dark-mode-first dashboard, card-based, rounded corners.
- Color coding: green = on track, yellow = warning, red = over budget, blue = under min.
- Font: Inter or `system-ui`.
- Mobile-first (PWA on phone is primary use case).

## 15. NON-GOALS
- No user login, no write-back to Sheets, no backend.
- No decimals in currency, ever.
- Do not display raw table as the primary view.
- Do not use `echarts-for-svelte` (abandoned).

## 16. ACCEPTANCE CRITERIA
- [ ] Pulls live CSV from `DATA_URL`.
- [ ] All 6 categories rendered as charts.
- [ ] `Andres#`/`Mari#` normalized.
- [ ] Ahorro duplicated N times.
- [ ] Recibos shows "budget exhausted" state.
- [ ] Installable as PWA on Android, iOS, and desktop Chrome.
- [ ] Deploys to GitHub Pages via Actions.
- [ ] App is usable and readable on a 375px-wide phone.
- [ ] App uses full PowerBI-style grid at ≥1024px.
- [ ] Bottom nav on mobile, top nav on desktop — no layout overflow.
- [ ] Settings page lets you set `min` and `max` per category with dual slider + numeric inputs.
- [ ] Settings persist across reloads (`localStorage`).
- [ ] Every category card shows a status badge derived from its range/mode.
- [ ] Recibos shows "Sin agotar: ₡X" when under `max` in `exhaust` mode.
- [ ] Over-budget categories turn red on the bar chart and KPI.
- [ ] Safe-area insets respected on notched iPhones.
- [ ] Deep links like `/settings` survive a hard refresh on GitHub Pages.

## 17. KEY GOTCHAS

**Svelte 5 runes syntax is new.** When vibe-coding, ensure AI generates `$state` / `$derived` / `$effect`, NOT Svelte 4's `writable` / `$:`. If AI mixes them, correct manually.

**GitHub Pages `base` path.** Don't set `base` in dev mode — only during production build. The `svelte.config.js` above handles this with `process.argv.includes('dev')`.

**Test locally before deploying.** Run `npm run build` and `npm run preview`. The `preview` mode may behave oddly with `base` paths — that's a known quirk. Trust the `build` output.

**`.nojekyll` is mandatory.** Without it, GitHub Pages strips `_app/` and the site loads blank.

**Chart library.** Use `svelte-echarts`. Do NOT use `echarts-for-svelte` — it's abandoned.