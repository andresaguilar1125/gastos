# Logic

Domain logic of **Gastos**, a personal spending PWA in Costa Rican colones (CRC).

## 1. Core concept

The app has exactly **one** budgeting primitive: the **piggy bank** (*sobre*).

> A piggy bank is a category-level account that receives a fixed monthly contribution
> (*aporte*) and is drained by the real spending of its category. Its balance (*saldo*)
> carries over forever and may go negative.

There are no caps, no ranges, and no per-category "tope". The **aporte doubles as the
monthly budget reference**: the app reports what share of it the current month has used
(`budgetPct`), and marks a month in the danger colour when its spend exceeds the aporte. A cap is just a piggy
bank whose leftover is thrown away every month; here nothing is thrown away.

## 2. The math

For category `c` and reference month `m`:

    aporte(c)       = fixed monthly contribution (from Configuración)
    gasto(c, k)     = Σ Monto of the sheet rows of c in month k
    aportado(c, m)  = elapsedMonths(c, m) × aporte(c)
    saldo(c, m)     = aportado(c, m) − Σ_{k ≤ m} gasto(c, k)
    budgetPct(c, m) = gasto(c, m) / aporte(c)

- `saldo` is measured in CRC, may be negative, and is shown in the danger colour when negative.
- `budgetPct` is the share of the **current month's** budget already spent. It is **"—"
  when the aporte is 0**, because the division is undefined.
- `over(c, k)` is true when `gasto(c, k) > aporte(c)` **and** the aporte is configured (> 0).
  It drives the danger highlighting in the month grid and the month-over-month table.
- `gastado` (the cumulative spend up to the reference month) still exists internally because
  `saldo` is derived from it, but the UI no longer shows it: every "Gastado" figure is the
  **current month's** spend (`esteMes`).
- `aporte` is one number per category and applies to **every** month (retroactive).
- Aportes ship with a sensible starting plan (see §8) and are tunable in Configuración.

Worked example — Recibos, reference month = October (10 elapsed months), `aporte = 110,000`:

    aportado  = 10 × 110,000           = 1,100,000
    gasto     = Σ recibos(Jan..Oct)   =   970,000
    saldo     = 1,100,000 − 970,000   =  +130,000
    budgetPct = gasto(Oct) / 110,000  =   e.g. 0.32  →  "32%"

## 3. Data source and schema

A single published Google Sheets CSV. The URL lives in `config.ts` and can be overridden in
Configuración.

### 3.1 Only columns A–G are read

    A Categoria | B Fecha | C Persona | D Comercio | E Descripcion | F Monto | G Mes
    H (blank)   | I Super_Group | J Super_key   ← stray product catalog, IGNORED

Columns **H–J are never read.** I/J are a product catalog that does not belong to the
ledger. The parser reads the CSV **positionally** (`header: false`, indices `0..6`) so those
columns can never leak into a row.

> Historical note: the published sheet removed its last column (`Super_Match`) and folded
> that value into **column C `Persona`**, which now carries each category's sub-group (see
> §7). `Descripcion` (E) remains the only free-text item column.

### 3.2 Row handling

- Drop any row whose `Categoria` (A) or `Monto` (F) is empty (footer/spacer rows).
- `Monto` may contain thousands separators (`"5,600"`). Strip every character that is not a
  digit, `.`, `-`; then round **up** (`Math.ceil`).
- `Monto` is treated as **signed**. No negatives exist today, but the engine does not assume
  positivity, so a future adjustments table can feed it without changes.
- `Mes` (G) is redundant and is ignored for ordering (see §5).

## 4. Derived fields

| Field | Source | Rule |
|---|---|---|
| `categoria` | A `Categoria` | Canonical casing (`Comida`, `Extras`, `Recibos`, `Super`, `Viajes`, `Ahorros`). |
| `yearMonth` | B `Fecha` | `YYYY-MM`, e.g. `06/22/26 09:07 AM` → `2026-06`. |
| `persona` | C `Persona` | Raw value preserved; display label via §7. |
| `personaLabel` | C `Persona` | Display label resolved from the raw value via §7. |
| `comercio` | D `Comercio` | Raw value preserved. |
| `descripcion` | E `Descripcion` | Raw product / description text. |
| `monto` | F `Monto` | Signed integer CRC, rounded up. |

### 4.1 `Persona` (column C)

`Persona` is now the **category sub-group**, and its meaning depends on the category:

- **Super** → the aisle (`Vegetales`, `Carnes`, `Lacteos`, `Hogar`, `Bebidas`, `Granos`,
  `Harinas`, `Salsas`, `Postres`, …).
- **Comida / Viajes / Extras** → the person (`Andres`, `Mari`, `Salidas`, `Medico`, `Express`,
  `Trabajo`, `Casa`, `Marvin`, …).
- **Recibos** → `Andres` / `Casa`, but Recibos groups by `Comercio` (§8).

Consequence: each category's breakdown (by `Persona`) must reconcile with the category total,
and no other category's rows may appear under it.

## 5. Time model

- `Mes` (`Jan`..`Dec`) carries **no year**, so it can never order data across years.
- `yearMonth` (`YYYY-MM`) is the **only** key used for ordering, filtering and comparison.
- Consequence: January 2025 and January 2026 are two distinct periods and are never summed.

`elapsedMonths(c, m)` = number of months from the category's epoch up to and including `m`.
Months with no rows still count, because the `aporte` is paid every month.

- **Category epoch** = that category's first month with data.
- **Ahorros epoch** = the **global epoch** (the first month with any data), because Ahorros
  has no rows of its own.

## 6. Reference month

- The **reference month** is always the **latest month** present in the sheet. Pinning a
  different month was removed; everything after the reference month is excluded from totals,
  tables and the grid.
- A **data window** (Configuración, default **6** months, one of `3 / 6 / 9 / 12`) further clips
  the ledger to the N months ending at the reference month (inclusive). This window applies to
  the **whole app**: totals, charts, tables, piggy banks and the month grid. Because the epoch
  moves with the window, `elapsedMonths`/`saldo` reflect only the visible window.

## 7. Personas

`Persona` (column C) is the category sub-group. Raw values arrive **already finalized** — the
old trailing-`#` convention is gone, so labels that used to be derived (`Salidas`, `Medico`) now
come straight from the sheet. Only accented names need a label; everything else is title-cased.

| Raw | Label |
|---|---|
| `Andres` | Andrés |
| `Mari` | Mari |
| `Salidas` | Salidas |
| `Medico` | Medico |
| `Express` | Express |
| `Trabajo` | Trabajo |
| `Casa` | Casa |
| `Marvin` | Marvin |
| `Vegetales` … (Super aisles) | same value |

There is no pairing/merging: each distinct `Persona` value is its own group on the chart and in
the tables.

## 8. Categories

Every category is a piggy bank. The **breakdown dimension** is the column used for the
per-category detail table.

| Categoría | Aporte default | Breakdown | Notes |
|---|---|---|---|
| Recibos | 100 | `Comercio` (AYA, CNFL, Kolbi, Telecable, IPTV) | One piggy bank for the whole category, **not** one per bill. |
| Super | 200 | `Persona` (Super aisle) | Strict `Categoria == Super` filter. |
| Comida | 80 | `Persona` | Fast food by who ordered it. |
| Extras | 100 | `Comercio` | Genuinely irregular purchases. |
| Viajes | 120 | `Persona` | Every persona is its own group (no pairing). |

> `Ahorros` is **not** a piggy bank/category. It therefore has no entry in `CATEGORIES`
> or `DEFAULT_APORTES` and never appears in the sobres table or the month grid (§9).

### 8.1 Recibos

Bills swing hard (AYA/CNFL can go from ₡2,000 to ₡80,000). A single piggy bank absorbs that
swing: an expensive month lowers the balance, a cheap month preserves the cushion. There is
no per-bill budget and no "Excedido".

### 8.2 Super

Groceries must never leak into another section, and other sections must never leak into Super.
The aisle now lives in column C `Persona`, so the Super chart and stats group by that column
(§10.4).

### 8.3 Comida

Fast food only, restaurant or delivery, grouped by **persona** (who ordered) so the heavy
hitters are obvious at a glance.

## 9. Ahorros

Savings are a single fixed **Ahorro mensual** (`AHORRO_MENSUAL_DEFAULT`, tunable in
Configuración) that the Dashboard doughnut draws as one slice. The old named
savings-line plan, its `/ahorro` tab and the `savings.ts` helpers were **removed**.
`Ahorros` is still reserved as a category name that is excluded from spending totals
(§12.6), and any legacy `Ahorros` aporte is dropped on hydrate so it can never
resurrect as a piggy bank.

## 10. Derived views

### 10.1 Home (`/`)

Home is four charts over the **current month** (`refMonth`), all in the **nk scale**
(thousands of colones, rounded up) and using the app's fixed **convention palette** (§10.4.1).
The four cards form a responsive **2×2 grid** (one column on small screens): **Ingreso-Mensual**
| **Semanal-Mensual** on the first row, **Sobres-Mensual** | **Delta-Mensual** on the second.
Chart titles are the exact card headers (dash-separated); charts have **no subtitles**.

1. **Ingreso-Mensual** — a doughnut (`AllocationDoughnut`) of the income slices: every
   category's spend (convention colours) + **Ahorros** (`ahorroMensual`, chrome) + **Restante** =
   `ingreso − Σcategorías − ahorros`. Percentages are one decimal and sum to 100%. Hidden while
   `ingreso` is 0.
2. **Semanal-Mensual** — a **horizontal stacked** bar chart (`StackedMonthChart`): one bar per
   category (**biggest total first**), each segmented by **week** (`W1`–`W4`) of the reference
   month (`weekTotalsForMonth`). Week colours are four distinct `SERIES_PALETTE` slots
   (`W1`–`W4`).
3. **Sobres-Mensual** — a **horizontal tornado** (`SpendRemainingChart`): one row per envelope,
   **Gastado** (this month) in DANGER and **Restante** (`max(0, aporte − gastado)`) in ACCENT_4,
   so the two halves total the aporte.
4. **Delta-Mensual** — a **categories × months heatmap** (`Heatmap`, `formatThousands`): one row
   per category (A–Z) with a **Total** column and footer row. Cells are scaled **per row** on a
   discrete scale (SUCCESS → WARNING → DANGER, green → teal → deep blue) with neutral
   (`accent-4/15`) grid lines, so one dominant category can't flatten the grid. Only the **highest
   month total** in the footer is highlighted in danger text.

The old one-shape category table (`PiggyBankTable`) and the categories × months grid (`MonthGrid`)
are no longer used on the Dashboard; `CategoryDetail` retains the legacy table but is unused.

### 10.2 Month grid (legacy)

Categories × months. Each cell shows that month's `gasto`; the cell is highlighted when
`gasto > aporte` **and** the aporte is configured (> 0). This is the month-over-month signal:
it answers "am I improving?" instead of surprising you at month end. Each category page
repeats the same signal as a **"Presupuesto por mes"** table over the last 12 months with a
per-month `% del presupuesto` and a month-over-month delta. The table prints amounts in
**thousands** (`formatThousands`), matching the scale aportes are entered in.

### 10.3 Category page

A category page (`CategoryDetail`) has no page title or description: the route label already
says it. It leads with three pills — **Aporte**, **Gastado** (the current month, colour-coded)
and **% del presupuesto** — followed by the current month's total, the 12-month budget table and
the breakdown. It is currently **unused**: every category shares the chart page below.

**Comida, Recibos, Super, Viajes and Extras** all use `CategoryBreakdownPage`.

### 10.4 Category charts (Comida, Recibos, Super, Viajes and Extras)

Five categories — **Comida, Recibos, Super, Viajes and Extras** — share one bespoke page
component, `CategoryBreakdownPage`, which renders a **stacked bar** chart plus the shared tables.
They do **not** use `CategoryDetail`.

All five share the same shape:

- **Delta-<Cat>** (the main monthly chart) — every breakdown label is its own series (no `Otros`
  folding), ranked by
  total spend over the visible (reference-filtered) history so order stays stable. The chart
  always shows the **full history**; all five category charts are drawn **horizontal** (months
  down the y-axis, values = **thousands of colones** across the x-axis) and each segment carries
  its own value label, hidden below **20 mil** so micro-values stay off the chart and readable in
  the history table. A danger dashed **`markLine`** marks the category's monthly **aporte** (§11) and
  is hidden while that aporte is 0. **Super** groups the chart by **week of month** (`W1`–`W4`,
  `chartDimension="semana"`) instead of aisle — chart only; the stats table and the history keep
  every aisle. **Comida** lays its page out as a responsive 3-column grid (main chart | comparison
  chart | stats); the comparison is a **mirrored** (tornado) chart — `Salidas` right vs `Express`
  left — excluding every other persona there only, in the same thousands scale and colours as the
  main chart. **Viajes** adds the same tornado, grouping personas instead of using single labels:
  `Andrés` (left) = {Salidas, Trabajo, Andrés} and `Mari` (right) = {Mari, Medico} — the main
  chart, stats table and history keep the individual personas untouched. **Extras** mirrors
  Comida: the same 3-column grid and tornado with single personas `Andrés` (left) vs `Mari`
  (right), persona breakdown.
- **Stats table** (`Producto-<Cat>` / `Categorias-<Cat>` / `Personas-<Cat>` / `Comercio-<Cat>`)
  — one row per label with **Compras**
  (count), **Promedio** (mean ticket) and **Suma**, plus a `Total` footer. Reuses the generic
  `CategoryStatsTable` (`countHeader` per page).
- **Data-<Cat>** — every row of the category, **grouped by month** (newest first,
  e.g. "Oct 2026") with a **search box** that filters every column. Months are **collapsible**;
  the reference month starts expanded and the rest collapsed, and a search auto-expands every
  matching month. Reuses the generic `LedgerHistoryTable`. On **Super only**, a **"Agrupar
  compras"** toggle (default **on**) collapses detailed lines sharing the same `Fecha` into one
  `Compra Total` row (`persona="Compra"`, `comercio`=first, `monto`=Σ) — **history table only**;
  the chart and stats table keep the raw rows.

The breakdown dimension per page (see §8): **Comida / Super / Viajes / Extras → `Persona`**,
**Recibos → `Comercio`**. A missing value falls back to `Sin persona` / `Sin comercio`.

The chart and history tables are the shared components `StackedMonthChart` and
`LedgerHistoryTable`; the data helpers live in `src/lib/budget/breakdown.ts`
(`breakdownMonthSeries`, `breakdownStats`), parameterized by category + dimension. `Heatmap`
is used by Home (§10.1); `CategoryDetail` is retained but currently unused.

#### 10.4.1 Palette

The app uses a **single fixed theme** (`src/lib/ui/palettes.ts`) — there are **no
user-selectable themes**, **no dark mode**, and **no red or yellow**. The palette is a
navy/slate neutral ramp, one blue chrome, and a green/teal/blue accent family:

| Token | Hex | Use |
|---|---|---|
| `ACCENT_1` | `#73cc80` | green — success/positive status |
| `ACCENT_2` | `#0fa69d` | teal — reserved UI accent |
| `ACCENT_3` | `#006ecf` | blue — app chrome (buttons, nav, links) |
| `ACCENT_4` | `#52647a` | slate — secondary text/borders/restante |
| `ACCENT_5` | `#2d3f54` | navy — body text / heatmap header |
| `ACCENT_6` | `#f8f8f8` | paper — page background |
| `SUCCESS` | `#73cc80` | heatmap low |
| `WARNING` | `#0fa69d` | heatmap mid / warning |
| `DANGER` | `#004c94` | heatmap high / Gastado / over-budget |
| `SERIES_PALETTE` | 8 blues/teals/greens | categorical chart labels (see below) |

Labelled values (personas, comercios, categories, weeks and unknown labels) draw from
`SERIES_PALETTE`, an eight-colour ramp
(`#004c94`, `#006ecf`, `#3c93fa`, `#00d4c6`, `#0fa69d`, `#028183`, `#73cc80`, `#52647a`).
`SUCCESS`/`WARNING`/`DANGER` are reserved for the heatmap (green → teal → deep blue) and status
cues (Gastado, over-budget). The chrome is `ACCENT_3` (`#006ecf`, set in `app.css`).

`labelColor` (`src/lib/ui/colors.svelte.ts`) resolves a label through fixed maps so a label
keeps the same hue on every page. **`seriesColors(labels)` guarantees no repeats within a
chart**: it assigns each label its stable colour and pushes later clashes to the nearest free
palette slot, so the Extras/Viajes delta charts (five personas), the Recibos comercio chart
(five payees), the Home doughnut (five categories) and the weekly chart each show every series
in a distinct colour. The nine Super aisles intentionally share one colour. Unknown labels hash
across the whole palette.

The Home heatmap uses the per-row scale (**SUCCESS → WARNING → DANGER**, i.e. green → teal →
deep blue) with neutral (`accent-4/15`) grid lines; zero stays neutral.

## 11. Configuration

| Setting | Meaning |
|---|---|
| Ingreso mensual | Monthly income (thousands of CRC). Enables `pctAhorro`, `disponible` and the Dashboard doughnut. Default **1250** (₡1.250.000). |
| Ahorro mensual | Fixed monthly savings (thousands of CRC) used by the Dashboard doughnut. Default **540** (₡540.000). |
| Aporte (per category) | The single tunable number per piggy bank; defaults to `{Recibos:100, Super:200, Comida:80, Extras:100, Viajes:120}`. It is also the danger reference line on the category chart (§10.4). |
| Rango de datos | Data window in months (`3 / 6 / 9 / 12`, default **6**), ending at the reference month; applies to the whole app (§6). |
| URL del CSV | Data source override. |

The page has **one** "Guardar cambios" button (a sticky bar) that commits every setting at
once — the plan draft and the CSV URL — and reloads the data only when the URL changed. Nothing
persists until then.

The reference-month picker, the per-row "Sugerir", the global "Restablecer todo" and the
per-category "Restablecer" / "Restablecer acentos" buttons were all removed; the reference
month is always the latest available month (§6).

## 12. Invariants

1. A category's `saldo` changes only through `aporte` (up) or `gasto` (down).
2. `saldo` is never clamped; negative is a valid, meaningful state.
3. The fixed **Ahorro mensual** is independent of the ledger: it is a plan constant, never
   modified by spending.
4. `yearMonth` never mixes years.
5. Aporte is paid for every elapsed month, including months with no data.
6. Spending totals **exclude Ahorros**.
7. Only columns A–G are read; H–J are never parsed.
8. `budgetPct` and `over` are `null`/`false` until an aporte is configured (> 0).

## 13. Out of scope (v1)

- **Adjustments.** A separate table (its own format, later) may record money moving in or out
  of a piggy bank outside the sheet. The engine already tolerates it, because `Monto` is
  signed and `saldo` is a plain sum. Not implemented in v1.
- **Initial balance** per category (seeding a piggy bank).
- **Per-month aporte overrides.**
- **Per-bill piggy banks** for Recibos (explicitly rejected in favor of one per category).
