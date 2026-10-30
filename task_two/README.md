# MedEx Senior Frontend Engineer: Task 2 - Multi-Provider Cart & Split Checkout

A resilient multi-provider cart and split checkout experience that supports independent booking flows, multi-currency accounting, optimistic updates, guest cart merging, and robust partial-failure handling.

🌐 **Live Deployed Demo:** [https://medex-task-two.vercel.app](https://medex-task-two.vercel.app)

---

## 1. Quick Start

Run the application with one command:

```bash
# From repository root
pnpm --filter task-two dev

# Or directly from the task_two directory:
cd task_two
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

To run the test suite:
```bash
cd task_two
npx vitest run
```

---

## 2. State Machine for Checkout

Each group in the cart has an independent lifecycle state machine:

```
                  ┌────────────────────────┐
                  │          IDLE          │
                  │ (Items in Cart Group)  │
                  └───────────┬────────────┘
                              │
                    [Click Group Checkout]
                              │
                              ▼
                  ┌────────────────────────┐
                  │       SUBMITTING       │
                  │   Idempotency Key Sent │
                  └──────┬───────────┬─────┘
                         │           │
            [HTTP 201/200]           [HTTP 402/409/500]
                         │           │
                         ▼           ▼
         ┌───────────────────┐   ┌───────────────────────────┐
         │     CONFIRMED     │   │          FAILED           │
         │ (Order generated, │   │ (Error banner displayed,  │
         │  items removed)   │   │  Idempotency Key Retained)│
         └───────────────────┘   └─────────────┬─────────────┘
                                               │
                                         [Click Retry]
                                               │
                                               ▼
                                      Re-enter SUBMITTING
                                     (Same Idempotency Key)
```

---

## 3. Key Architecture & Design Decisions

### Prevention of Double Charges (Idempotency Key)
* **The Problem:** Healthcare bookings and card authorizations can be charged multiple times if a user double-clicks, experiences network packet loss, or retries a failed step.
* **Our Solution:**
  1. For each group checkout attempt, the client generates a cryptographically random UUID idempotency key (`getIdempotencyKey(groupType)`).
  2. The idempotency key is stored in `sessionStorage` and sent in the payload of `POST /api/checkout`.
  3. The mock server maintains an `idempotencyMap`. If a request arrives with an existing key, the server **never duplicates the order or charge**; it returns the previously generated order with HTTP 200.
  4. Only after a successful 201 confirmation is the idempotency key cleared.

### Partial Failure Handling (The Core Requirement)
* **The Scenario:** A customer checks out 3 groups at once (e.g., Lab Tests, Wellness, and Health Package) and the second group fails (e.g., card declined or slot taken).
* **Our Implementation:**
  * Group 1 generates a confirmed order with order ID and moves to the confirmed order list.
  * Group 2 encounters the failure (e.g. HTTP 402/409). It does **not** roll back or cancel Group 1.
  * Group 3 proceeds independently and confirms.
  * In the UI, the customer sees the confirmed orders clearly listed, and Group 2 is highlighted with an explanatory banner and a **"Retry Checkout"** button. Retrying uses the same idempotency key and only retries Group 2.

### Reload Safety
* All confirmed orders and active group idempotency keys are persisted in `sessionStorage`.
* If the user reloads the browser, closes the tab, or navigates back, the page immediately restores the true state of every order from `sessionStorage` without restarting from scratch.

### Optimistic Quantity Updates with Anti-Race Debouncing
* When tapping `+` or `−`, the UI updates the item count and line total immediately.
* A customer tapping `+` 5 times in rapid succession does not fire 5 competing network requests. We debounce rapid clicks with a 350ms window: intermediate taps update local UI state immediately, and one request sends the final target quantity.
* If the server rejects the request (e.g. stock limit or 500 error), the UI automatically rolls back to the previous quantity and alerts the customer.

### Multi-Currency Subtotals & Grand Summary
* A single cart group can contain services from different countries (e.g., a Bangkok lab test in THB alongside a Kathmandu blood panel in NPR).
* We strictly avoid summing cross-currency values.
* Group cards show per-currency subtotals (`THB 1,677.00` and `NPR 12,520.00`).
* The summary sidebar displays a dedicated breakdown listing the total due in each currency.

### Wellness Treatments: Mandatory Duration Picker
* Wellness treatments (`price: null`, `priceUnknown: true`) cannot be priced until a duration option is chosen.
* Until the customer selects a duration (e.g., 60 min vs. 90 min), the item is clearly marked with `"Select duration"`, and it is **not counted as 0** in any subtotal.
* The group's checkout button remains disabled until all wellness items have a duration selected.

### Unavailable Services
* Line items with an empty `product: {}` represent services deleted by providers.
* They are highlighted with a prominent red notice: `"This service has been discontinued"`.
* The checkout button is disabled with an explanatory tooltip until the user removes the discontinued item with one click.

### Guest Cart Merge Logic
When merging `guestCart` into `serverCart`:
1. **Existing items:** If a guest item already exists in the cart by `productId` (e.g., Liver Function Profile), we add the quantities (2 + 3 = 5).
2. **Wellness duration choice:** If the guest picked a duration option (`wellnessPricingId`), that selection is applied to the server item.
3. **New items:** Added to the appropriate group in the cart.
4. **Customer notification:** Returns an audit log of `changes` displayed in an alert banner.

---

## 4. Testing
Automated unit tests in `src/lib/__tests__/`:
* `cartCalculations.test.ts`: Currency separation, unpriced item exclusion, unavailable item detection, group validation.
* `orderStore.test.ts`: Idempotency key preservation, double-charge prevention, 402 payment failure simulation, 409 conflict.

Run tests:
```bash
npx vitest run
```
All 15 tests pass.

---

## 5. Dev Panel
A floating **Dev Tools** button in the bottom right corner allows evaluators to:
* Adjust simulated network latency (0ms, 300ms, 1000ms, 2500ms).
* Inject checkout outcomes: Normal 201, Payment Failed 402, Conflict 409, or Server Error 500.
* Reset the cart back to the initial data payload in one click.

---

## 6. What Was Left Out / Future Enhancements
* **Payment Gateway SDK Integration:** Real Stripe / Omise / eSewa embedded hosted fields (mocked currently via robust idempotency-controlled endpoints).
* **Saved Payment Methods:** Vaulting multi-currency cards per user profile to streamline consecutive checkouts.

---

## 7. AI Tools Usage
In accordance with MedEx's instructions to disclose AI-assisted tooling:
* **Tooling Used:** Google Antigravity (Advanced Agentic Pair-Programming Assistant).
* **Where Used:**
  * **State Machine & Store Design:** Defining the state machine transition types and session-storage persistence layer for split multi-provider checkout.
  * **Test Suite Expansion:** Writing unit tests for idempotency key preservation, currency subtotal calculations, and optimistic update rollback.
  * **Review & Refactoring:** Ensuring clean React 19 hook discipline and zero console errors.
* **Comprehension:** All lines of code, state machine models, and business logic are fully understood and can be defended and expanded in the follow-up technical interview.
