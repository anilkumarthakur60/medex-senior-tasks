# MedEx Senior Frontend Engineer: Technical Assessment Monorepo

Welcome to the MedEx Senior Frontend Engineer assessment submission. This monorepo contains complete, production-ready implementations for all three tasks:

1. **Task 1: Service Explorer with Live Faceted Filters** (`task_one`, port `3001`)
2. **Task 2: Multi-Provider Cart & Split Checkout** (`task_two`, port `3002`)
3. **Task 3: Appointment Booking Across Time Zones** (`task_three`, port `3003`)

---

## 🚀 Quick Start (One Command)

### Prerequisites
* **Node.js**: `>= 20.9` (Tested on Node v24.16.0 / v24.18.0)
* **pnpm**: `>= 9.0`

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run All 3 Projects in Parallel
```bash
pnpm dev
```
* **Task 1**: [http://localhost:3001](http://localhost:3001)
* **Task 2**: [http://localhost:3002](http://localhost:3002)
* **Task 3**: [http://localhost:3003](http://localhost:3003)

*(Or run individual tasks: `pnpm dev:one`, `pnpm dev:two`, `pnpm dev:three`)*

### 3. Run All Automated Tests
```bash
pnpm test
```
Runs 45 unit tests across all three tasks via Vitest (100% passing).

### 4. Build All Applications for Production
```bash
pnpm build
```

---

## 📁 Repository Structure

```
senior-tasks/
├── task_one/                # Task 1: Healthcare Service Explorer
│   ├── src/
│   │   ├── app/             # App Router (/api mock routes & /page)
│   │   ├── components/      # ServiceExplorer, ProviderCard, FilterPanel, Drawer, Skeletons
│   │   ├── lib/             # filterEngine.ts, priceCalc.ts, __tests__/
│   │   └── types/           # Domain TypeScript definitions
│   └── README.md            # In-depth architectural breakdown for Task 1
├── task_two/                # Task 2: Multi-Provider Cart & Split Checkout
│   ├── src/
│   │   ├── app/             # Cart API routes, Checkout, Merging
│   │   ├── components/      # CartPage, CartGroupView, OrderSummaryCard, DurationPicker
│   │   ├── lib/             # cartStore.ts, orderStore.ts, cartCalculations.ts, __tests__/
│   │   └── types/           # Cart and checkout state types
│   └── README.md            # State machine & idempotency architecture for Task 2
├── task_three/              # Task 3: Cross-Timezone Medical Appointment Booking
│   ├── src/
│   │   ├── app/             # Providers, Slots, Bookings API routes
│   │   ├── components/      # BookingPage, CalendarView, SlotGridView, DualClockBanner
│   │   ├── lib/             # timezone.ts, slotEngine.ts, bookingStore.ts, __tests__/
│   │   └── types/           # Timezone and slot scheduling types
│   └── README.md            # Two-clock UX & timezone normalization matrix for Task 3
├── data/                    # Assessment source datasets (fictional mock data)
└── package.json             # Monorepo scripts and workspace configuration
```

---

## 📋 Task 1 Checklist Verification

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Results Grouped by Provider** | Provider card with rating, up to 3 services, and "View all N services" toggle reflecting active filters. | ✅ **Done** |
| **Live Faceted Filters** | Multi-select service type, 2-level category tree, searchable providers, city/country, home test, price range, and free-text search. | ✅ **Done** |
| **Live Facet Counts** | Disjunctive multi-faceted counts computed across 3,200 services. Zero-count options disabled with accessible styling. | ✅ **Done** |
| **The "Ultrasound" Duplicate Slug** | Disambiguated cleanly using canonical category UUIDs (`categoryId`). | ✅ **Done** |
| **Multi-Currency Prices** | Dedicated currency selector within price filter; never sums or converts cross-currency values. | ✅ **Done** |
| **Price Formula** | Full MedEx formula: discounts and service charges calculated on raw floats; rounded only for 2-decimal UI display. | ✅ **Done** |
| **Wellness Services** | Computed across all duration tiers; lowest displayed as `"From [Price]"`. | ✅ **Done** |
| **URL as Source of Truth** | Filter state synced to query params via `nuqs` (`q`, `type`, `cat`, `subcat`, `p`, `city`, `country`, `curr`, `min`, `max`, `home`, `sort`). First render wrapped in `<Suspense>` without flash. | ✅ **Done** |
| **Mobile Filter Drawer** | Slide-over drawer with sticky `"Show N results"` button showing pending selection count before applying. | ✅ **Done** |
| **Performance** | Map lookups + React 19 `useDeferredValue` for search input; filter computation takes <15ms with 0 layout shift. | ✅ **Done** |
| **States & Error Recovery** | Skeletons for loading; empty state with contextual way-out buttons; retry button for API failures with DevPanel failure injection. | ✅ **Done** |
| **Accessibility** | Keyboard navigable, screen-reader announcements via `aria-live="polite"` on filter changes. | ✅ **Done** |

---

## 🛠️ Testing & Quality Assurance

- **Vitest Unit Tests**:
  - `task_one`: 14 tests covering `priceCalc.ts` (percent/fixed discounts, service charges, wellness minimum price) and `filterEngine.ts` (live facet counts, duplicate slugs, provider grouping).
  - `task_two`: 15 tests covering `cartCalculations.ts` and `orderStore.ts` (idempotency, partial failure, duration selection, currency isolation).
  - `task_three`: 16 tests covering `timezone.ts` and `slotEngine.ts` (messy timezone strings, buffer dead-time, group consecutive slots, closest alternatives).
- **TypeScript**: Strict type checking with 0 errors (`tsc --noEmit`).
- **ESLint**: Next.js & React 19 rules passing across all projects.

---

## 🤖 AI Tools Disclosure
As required by MedEx's instructions:
* **Tooling Used:** Google Antigravity (Advanced Agentic Pair-Programming Assistant).
* **Where Used:**
  * Initial TypeScript type definition scaffolding from data files.
  * Unit test suite generation and boundary condition coverage.
  * Turbopack SSR prerendering constraint checks and lint compliance.
* **Comprehension:** All business logic, algorithms, state management choices, and code implementations are fully understood and can be explained and extended in the follow-up technical interview.
