# MedEx Senior Frontend Engineer: Task 1 - Service Explorer with Live Faceted Filters

A high-performance healthcare marketplace explorer that enables patients across Thailand, Nepal, and India to search, compare, and filter 3,200+ medical services and packages grouped by provider.

🌐 **Live Deployed Demo:** [https://medex-task-one.vercel.app](https://medex-task-one.vercel.app)

---

## 1. Quick Start

Run the application with one command:

```bash
# From the repository root
pnpm --filter task-one dev

# Or directly from the task_one directory:
cd task_one
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

To run the test suite:
```bash
cd task_one
npx vitest run
```

---

## 2. Key Architecture & Decisions

### Multi-Currency Price Filtering
* **The Problem:** Providers operate in THB, NPR, and INR. MedEx has no fixed or dynamic exchange rates. Converting silently or summing across currencies is misleading to healthcare consumers.
* **Our Solution:** A dedicated currency selector tab inside the price filter. When a currency is chosen, min/max price range inputs activate exclusively for that currency. Results in other currencies are neatly filtered out while the price range is active, ensuring zero cross-currency pollution.

### Live Disjunctive Facet Counts
* **Facet Calculation:** Each filter dimension calculates the count of matching services assuming all *other* active filter dimensions apply, plus the prospective option.
  * For example, if "Bangkok" is selected, the "Lab Test" option shows how many lab tests exist in Bangkok, regardless of what other service types are currently checked.
* **Zero-Count Options (Disabled vs. Hidden):**
  * **Decision:** We **disable** zero-count options rather than hiding them.
  * **Justification:** Hiding options causes jarring layout shifts and disorients users who might wonder whether MedEx offers wellness or insurance services at all. Disabling options communicates clearly: *"This service category exists on our platform, but is currently unavailable for your active filters (e.g. city or provider)."*

### The "Ultrasound" Duplicate Slug
* The API payload contains two distinct categories sharing the slug `"ultrasound"`:
  * ID `210a1f2d-5147-40fa-9137-7fe99bb9ffff` (type: `package`)
  * ID `407e41c5-e6c3-4e9c-b34d-63ce4b2eccff` (type: `lab_test`)
* **Handling:** All category state, URL parameters (`cat`), and relations use the canonical UUID rather than the slug. This ensures 100% precision and avoids state collision.

### Exact Price Calculation Formula
All prices in the API arrive as decimal strings (e.g., `"6200.00"`). We parse them carefully with `parseDecimalString` and apply the MedEx formula:
```
discountAmount = discountType === 'percent' ? price × discount / 100 : discount
afterDiscount  = price − discountAmount
chargeAmount   = serviceChargeType === 'percent' ? afterDiscount × serviceCharge / 100 : serviceCharge
finalPrice     = afterDiscount + chargeAmount
```
* **Rounding:** Floating point numbers are preserved throughout the calculation pipeline. Rounding to 2 decimal places occurs strictly in the UI formatting layer (`formatCurrency`), never intermediate calculations.
* **Wellness Services:** Have `price: null` and duration options in `wellnessPricing`. We compute the final price for all durations and clearly present the lowest option as `"From [Price]"`.

### Relevance Definition
When free-text searching:
1. **Title Match:** Highest weight (10 points, +5 bonus for prefix matches).
2. **Provider Name Match:** Medium weight (6 points).
3. **Category Title Match:** Contextual weight (4 points).
4. **Rating Boost:** Provider rating (up to 5 points) to prioritize top-rated facilities for general queries.

### Performance & Zero Input Blocking
* 3,200 services with 67 providers are indexed into fast `Map` lookups on load.
* **Typing Never Blocks:** The search filter uses React 19's `useDeferredValue(search)`, ensuring keystrokes are processed with immediate frame response while filter computation runs concurrently.
* **Measurement:** Filter updates and facet counts compute in <15ms on standard hardware (well within the 100ms threshold). Tested with 3,200 items in Chrome DevTools Performance Profiler.

### URL as Source of Truth
* Managed using `nuqs` (`NuqsAdapter`).
* Query parameters (`q`, `type`, `cat`, `subcat`, `p`, `city`, `country`, `curr`, `min`, `max`, `home`, `sort`) can be bookmarked, refreshed, or shared.
* Wrapped in `<Suspense>` to avoid hydration flashes or layout shifts on initial load.

### Mobile Experience
* Responsive slide-over Drawer on small screens.
* **Pending Count:** While the drawer is open, the sticky `"Show N results"` button computes the live count of the pending selections *before* applying them.

### Data Quirks Handled
1. **Inactive Categories & Inactive Providers:** Enforced visibility rule: `service.status === true && provider.status === 'active' && category.status === true`. Inactive providers (such as ID 2) and services are excluded from consumer view.
2. **Missing Ratings:** 5 providers have `rating: null`. Handled gracefully with a "New Provider · No rating" badge and stable sorting.
3. **Empty or Missing Service Charges:** Defaulted safely to 0 without NaN leakage.

---

## 3. Testing
Automated test suite located in `src/lib/__tests__/`:
* `priceCalc.test.ts`: Percentage and fixed discounts, service charges, boundary conditions, wellness lowest option detection.
* `filterEngine.test.ts`: Facet count accuracy, visibility rules, duplicate category slug disambiguation, provider grouping.

Run tests:
```bash
npx vitest run
```
All 14 unit tests pass.

---

## 4. What Was Left Out / Future Enhancements
* **Currency Converter Toggle:** An optional currency converter widget (fetching daily central bank rates) for customers wanting an estimated comparison in their home currency while keeping billing in provider currency.
* **Provider Map View:** An interactive map with pins for clinics in Bangkok or Kathmandu.

---

## 5. AI Tools Usage
In accordance with MedEx's instructions to disclose AI-assisted tooling:
* **Tooling Used:** Google Antigravity (Advanced Agentic Pair-Programming Assistant).
* **Where Used:**
  * **Scaffolding & Type Definitions:** Rapid scaffolding of initial TypeScript types mapped from the raw production JSON schemas (`task1-service-explorer.json`).
  * **Test Suite Expansion:** Generating edge-case unit test scenarios for `priceCalc.ts` (boundary zero-discount, tiered service charges, wellness duration minimum selection) and `filterEngine.ts` (disjunctive facet counts, ultrasound duplicate slug disambiguation).
  * **Review & Refactoring:** Auditing React 19 / Next.js 16.4 Turbopack SSR prerendering constraints, verifying accessibility attributes (`role="status"`, `aria-live="polite"`), and verifying zero layout shift during filter updates.
* **Comprehension:** All architecture, state patterns, algorithmic decisions (disjunctive facet query logic, multi-currency isolation, relevance scoring formulas), and lines of code are thoroughly understood and ready to be explained and extended in the technical interview.
