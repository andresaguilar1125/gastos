# Logic

Domain logic of **Gastos**, a personal spending PWA in Costa Rican colones (CRC).

## 1. Core concept

The app has exactly **one** budgeting primitive: the **piggy bank** (*alcancía*).

> A piggy bank is a category-level account that receives a fixed monthly contribution
> (*aporte*) and is drained by the real spending of its category. Its balance (*saldo*)
> carries over forever and may go negative.

There are no caps, no ranges, and no per-category "tope". The **aporte doubles as the
monthly budget reference**: the app reports what share of it the current month has used
(`budgetPct`), and marks a month red when its spend exceeds the aporte. A cap is just a piggy
bank whose leftover is thrown away every month; here nothing is thrown away.

## 2. The math

For category `c` and reference month `m`:

    aporte(c)       = fixed monthly contribution (from Configuración)
    gasto(c, k)     = Σ Monto of the sheet rows of c in month k
    aportado(c, m)  = elapsedMonths(c, m) × aporte(c)
    saldo(c, m)     = aportado(c, m) − Σ_{k ≤ m} gasto(c, k)
    budgetPct(c, m) = gasto(c, m) / aporte(c)

- `saldo` is measured in CRC, may be negative, and is shown in red when negative.
- `budgetPct` is the share of the **current month's** budget already spent. It is **"—"
  when the aporte is 0**, because the division is undefined.
- `over(c, k)` is true when `gasto(c, k) > aporte(c)` **and** the aporte is configured (> 0).
  It drives the red highlighting in the month grid and the month-over-month table.
- `gastado` (the cumulative spend up to the reference month) still exists internally because
  `saldo` is derived from it, but the UI no longer shows it: every "Gastado" figure is the
  **current month's** spend (`esteMes`).
- `aporte` is one number per category and applies to **every** month (retroactive).
- **All aportes default to 0.** The app ships with an empty plan on purpose; the user fills
  rows and sets aportes on demand in Configuración.

Worked example — Recibos, reference month = October (10 elapsed months), `aporte = 110,000`:

    aportado  = 10 × 110,000           = 1,100,000
    gasto     = Σ recibos(Jan..Oct)   =   970,000
    saldo     = 1,100,000 − 970,000   =  +130,000
    budgetPct = gasto(Oct) / 110,000  =   e.g. 0.32  →  "32%"

## 3. Data source and schema

A single published Google Sheets CSV. The URL lives in `config.ts` and can be overridden in
Configuración.

### 3.1 Only columns A–H are read

    A Categoria | B Fecha | C Persona | D Comercio | E Descripcion | F Monto | G Mes | H Super_Match
    I (blank)   | J Super_Group | K Super_key   ← stray product catalog, IGNORED

Columns **I–K are never read.** They are a product catalog that does not belong to the
ledger. The parser reads the CSV **positionally** (`header: false`, indices `0..7`) so those
columns can never leak into a row, and so the blank `I` column can never become a key.

> Historical note: the sheet's columns were renamed on 2026-10-05. Column H (once `Grupo`,
> briefly `Super`) is now **`Super_Match`**; the old `Nota` column is gone. `Descripcion` (E)
> is the only free-text item column.

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
| `superMatch` | H `Super_Match` | Real Super aisle; `null` or empty → `(Sin categoría)`. |
| `monto` | F `Monto` | Signed integer CRC, rounded up. |

### 4.1 `Super_Match` (column H)

`Super_Match` holds the real Super aisle (`Vegetales`, `Carnes`, `Lacteos`, `Hogar`,
`Bebidas`, `Granos`, `Harinas`, `Salsas`, `Postres`, …). For **non-Super** rows the sheet
publishes the literal string `null` (or a stray `.`), which normalizes to
`(Sin categoría)`. This is **expected**, not a bug: the column simply means "which Super
aisle", and is empty for anything that is not a grocery row.

Consequence: the Super breakdown (by `Super_Match`) must reconcile with the Super category
total, and no non-Super row may appear as an aisle.

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

- The **reference month** defaults to the latest month present in the sheet.
- The user may pin a different month in Configuración; that month becomes the reference for
  every "this month" figure in the app.
- Everything after the reference month is excluded from totals, tables and the grid.

## 7. Personas

`Persona` identifies *who* the money was for. A trailing `#` marks "not the default person,
keep it separate".

| Raw | Label | Kind |
|---|---|---|
| `Andres` | Andrés | Personal |
| `Andres#` | Salidas | Social |
| `Mari` | Mari | Personal |
| `Mari#` | Citas | Medical |
| `Trabajo` | Trabajo | Work |
| `Casa` | Casa | Household |
| `Marvin` | Marvin | (other) |

## 8. Categories

Every category is a piggy bank. The **breakdown dimension** is the column used for the
per-category detail table.

| Categoría | Aporte default | Breakdown | Notes |
|---|---|---|---|
| Recibos | 0 | `Comercio` (AYA, CNFL, Kolbi, Telecable) | One piggy bank for the whole category, **not** one per bill. |
| Super | 0 | `Super_Match` (column H) | Strict `Categoria == Super` filter. |
| Comida | 0 | `Comercio` | Fast food by merchant (restaurant / delivery apps). |
| Extras | 0 | `Comercio` | Genuinely irregular purchases. |
| Viajes | 0 | `Persona` | `Andres#` (Salidas) must stand out. |

> `Ahorros` is **not** a piggy bank/category any more. It is a list of named savings
> lines owned by the `/ahorro` tab — see §9. It therefore has no entry in `CATEGORIES`
> or `DEFAULT_APORTES` and never appears in the alcancías table or the month grid.

### 8.1 Recibos

Bills swing hard (AYA/CNFL can go from ₡2,000 to ₡80,000). A single piggy bank absorbs that
swing: an expensive month lowers the balance, a cheap month preserves the cushion. There is
no per-bill budget and no "Excedido".

### 8.2 Super

Most rows have no aisle, so `(Sin categoría)` carries the bulk of the spend — that is the
sheet's reality, not a data bug. Groceries must never leak into another section, and other
sections must never leak into Super.

### 8.3 Comida

Fast food only, restaurant or delivery, grouped by **merchant** so the heavy hitters
(restaurants, delivery apps) are obvious at a glance.

## 9. Ahorros

Ahorros is a **list of savings lines**, not a single aporte. Each line is a named goal
with an icon and a fixed monthly contribution (in thousands of colones), managed entirely
on the `/ahorro` tab:

    SavingsLine { id, name, icon, amountMil }

- **There are no `Ahorros` rows in the sheet.** Savings are reported from the plan, not
  from the ledger.
- A line is a piggy bank with **zero withdrawals**: `acumulado = Σ aportes`.
- Every line uses the **Ahorros epoch** (the global epoch) and **resets every January**:
  October is month 10 and the end-of-year goal is a full 12.
- Lines are edited on `/ahorro` and persisted **immediately** to `finanzas-ahorro`
  (no draft/commit). Amounts are entered in **thousands** (`APORTE_SCALE`).

Per line (elapsed months `m`):

    aporte    = amountMil × APORTE_SCALE
    acumulado = aporte × m
    metaEOY   = aporte × 12

Page totals (Σ over every line; reference month `m`, income `I`):

    aporteMensual = Σ aporte
    acumulado     = Σ acumulado
    metaEOY       = Σ metaEOY
    progress      = m / 12
    pctAhorro     = aporteMensual / I
    disponible    = I − gastoTotal(sin Ahorros) − aporteMensual

`pctAhorro` and `disponible` render as **"—"** until an income is configured. Helpers live
in `src/lib/budget/savings.ts` (`savingsMonths`, `savingsProgress`, `savingsTotals`).

## 10. Derived views

### 10.1 Category table

One table shape for every category:

| Categoría | Aporte | Gastado | % este mes | Saldo |

### 10.2 Month grid

Categories × months. Each cell shows that month's `gasto`; the cell is highlighted when
`gasto > aporte` **and** the aporte is configured (> 0). This is the month-over-month signal:
it answers "am I improving?" instead of surprising you at month end. Each category page
repeats the same signal as a **"Presupuesto por mes"** table over the last 12 months with a
per-month `% del presupuesto` and a month-over-month delta. The table prints amounts in
**thousands** (`formatThousands`), matching the scale aportes are entered in.

### 10.3 Category page

A category page (`CategoryDetail`, used by every category) has no page title or description:
the route label already says it. It leads with three pills — **Aporte**, **Gastado** (the
current month, colour-coded) and **% del presupuesto** — followed by the current month's total,
the 12-month budget table and the breakdown.

### 10.4 Charts (Viajes only)

Every category page still uses tables, because tables are easier to read and verify.
The **exception is `/viajes`**, which uses **Apache ECharts** to answer two questions at a
glance: *who spends the most, and how far am I from my monthly limit?*

The Viajes page is bespoke (it does **not** use `CategoryDetail`) and renders:

- **Gasto por mes** — a stacked bar chart, one stack per persona group, x = month,
  y = **thousands of colones**. A dashed **trend line** (least squares) shows the direction,
  and a red **`markLine` = the monthly limit** (editable, default `VIAJES_LIMIT_DEFAULT`).
  The `CM / 3M / 6M / ALL` toggle (`RangeToggle`) filters the window locally.
- **Promedio por viaje** — count and mean fare per group, split by service.
- **Meta: carro eléctrico** — target price ÷ monthly saving → months to goal.

Chart groups (`VIAJES_GROUPS`): **Andrés / Mari / Trabajo** only. The `#` variants
(`Salidas`, `Citas`) and any other persona are deliberately excluded from the chart; they
only surface in the full `persona` breakdown elsewhere.

**Trip rules.** One CSV row = one trip. The service is read from `Comercio`
(`/uber/i` → Uber, `/didi/i` → Didi); a row can match neither, in which case it only counts
in the group total and average. `tripStats()` returns count + mean fare per group and per
service; `linearTrend()` fits the trend line; `carGoalMonths()` converts the goal.

Chart axis and labels use the **thousands scale** (`formatThousands`); tooltips multiply back
by 1000 to show full CRC.

## 11. Configuration

| Setting | Meaning |
|---|---|
| Ingreso mensual | Monthly income (thousands of CRC). Enables `pctAhorro` and `disponible`. |
| Aporte (per category) | The single tunable number per piggy bank; defaults to 0. |
| Mes de referencia | Which month counts as "current". |
| URL del CSV | Data source override. |

Savings lines (name + icon + monthly amount) are **not** in Configuración: they are edited
on `/ahorro` and saved immediately (§9). Configuración keeps only the income, the per-
category aportes, the reference month and the CSV URL.

**Suggest aporte** = the average `gasto` of the last 6 months for that category. It is a hint
only; a manual value always wins.

All settings use a **draft / commit** workflow: nothing persists until "Guardar cambios".

## 12. Invariants

1. A category's `saldo` changes only through `aporte` (up) or `gasto` (down).
2. `saldo` is never clamped; negative is a valid, meaningful state.
3. Savings lines are independent of the ledger: they accrue from the global epoch and are
   never modified by spending.
4. `yearMonth` never mixes years.
5. Aporte is paid for every elapsed month, including months with no data.
6. Spending totals **exclude Ahorros**.
7. Only columns A–H are read; I–K are never parsed.
8. `budgetPct` and `over` are `null`/`false` until an aporte is configured (> 0).

## 13. Out of scope (v1)

- **Adjustments.** A separate table (its own format, later) may record money moving in or out
  of a piggy bank outside the sheet. The engine already tolerates it, because `Monto` is
  signed and `saldo` is a plain sum. Not implemented in v1.
- **Initial balance** per category (seeding a piggy bank).
- **Per-month aporte overrides.**
- **Per-bill piggy banks** for Recibos (explicitly rejected in favor of one per category).
