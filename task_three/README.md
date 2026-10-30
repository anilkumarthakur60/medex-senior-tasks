# MedEx Senior Frontend Engineer: Task 3 - Appointment Booking Across Time Zones

A robust, international medical appointment booking engine with cross-timezone synchronization, dynamic slot generation with buffers, group booking coordination, and conflict resolution.

🌐 **Live Deployed Demo:** [https://medex-task-three.vercel.app](https://medex-task-three.vercel.app)

---

## 1. Quick Start

Run the application with one command:

```bash
# From repository root
pnpm --filter task-three dev

# Or directly from the task_three directory:
cd task_three
pnpm dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

To run the test suite:
```bash
cd task_three
npx vitest run
```

---

## 2. Timezone Normalization & Handled Formats

Provider timezone data is entered manually and contains inconsistent notations. We normalize every format using Luxon in `src/lib/timezone.ts`:

| Raw Timezone in Data | Provider | Normalized IANA Target | Handling Strategy |
|---|---|---|---|
| `"Asia/Bangkok"` | Riverside Hospital (TH) | `Asia/Bangkok` | Valid standard IANA string. |
| `" UTC+05:45"` | Himal Neo Clinic (NP) | `Asia/Kathmandu` | Leading space trimmed; recognized as Nepal's unique +5:45 offset. |
| `"Nepal Standard Time"` | Annapurna Diagnostics (NP) | `Asia/Kathmandu` | Mapped from Microsoft Windows registry timezone name to standard IANA. |
| `"(GMT+5:45)"` | Pashupati Medical (NP) | `Asia/Kathmandu` | Parentheses and GMT prefix parsed; matched to Nepal's +5:45 offset. |
| `"Asia/Katmandu "` | Lumbini Polyclinic (NP) | `Asia/Kathmandu` | Trailing whitespace trimmed and alternate Katmandu/Kathmandu spelling normalized. |
| `""` (Empty string) | Aravali Hospital (IN) | `Asia/Kolkata` | Fallback to provider's country code (`IN` → `Asia/Kolkata`). |

---

## 3. Key Architecture & Design Decisions

### The Two-Clock Design Pattern
* **The Story:** *"I live in Kathmandu. I'm booking a check-up at a hospital in Bangkok for when I travel there next month. Which time is the appointment, mine or theirs?"*
* **UX Solution:**
  1. **Primary Clock (Hospital Local Time):** Prominently styled in teal with facility branding. The patient must physically be in Bangkok at this wall-clock time.
  2. **Secondary Clock (Patient Local Time):** Styled in indigo. Shows what time that corresponds to on the patient's device in Kathmandu (1 hour 15 minutes earlier).
  3. **Midnight & Day Crossings:** If a late-evening Bangkok slot falls on the previous calendar day in Kathmandu (e.g., 00:30 Bangkok is 23:15 the prior night in Kathmandu), a prominent alert highlights: *"Previous day for you"*.

### Slot Generation & Buffer Intervals
* **Rule:** A specialist's slots start at `consultation.startTime` and repeat every `durationInMinutes + bufferInMinutes`.
* **Important Distinction:** The buffer is dead time (doctor notes, room sanitization, patient transition); it is **not** part of the appointment itself.
* **Example:** 10:00 to 16:00 with 30m duration + 10m buffer:
  * Slot 1: 10:00 to 10:30 (buffer 10:30 to 10:40)
  * Slot 2: 10:40 to 11:10 (buffer 11:10 to 11:20)
  * ...
  * Slot 9: 15:20 to 15:50 (buffer 15:50 to 16:00)
  * *Next slot would start at 16:00 and end at 16:30, which exceeds 16:00, so it is strictly excluded.*
* **Operating Hours Overlap:** A slot is offered only if it lies entirely within the provider's opening hours that day. If a specialist advertises hours outside facility hours (e.g. Saturday closing at 13:00 while consultation ends at 16:00), only overlapping slots are bookable, accompanied by an explanatory note.

### What "Today" Means (Provider Clock)
* **The Problem:** When it is 00:15 AM in Bangkok, it is still 11:00 PM the previous day in Kathmandu.
* **Our Solution:** "Today" is strictly measured by the wall-clock at the **provider's facility**, not the patient's device. Slots on "today" that have already started in Bangkok time are marked as `isPast: true` and disabled.

### Group Bookings (N Consecutive Slots)
* Booking for N people (1 to 4) requires N consecutive free slots with the same specialist.
* An appointment slot at index $i$ is only eligible as a start time if slots $i, i+1, \dots, i+N-1$ are all unbooked and un-past.
* Buffers between consecutive appointments are preserved.

### 409 Conflict Handling ("Someone Got There First")
* If a race condition occurs and another patient claims the slot before confirmation (HTTP 409):
  1. The patient's entered form data (specialist, date, group size) is preserved.
  2. A gentle, non-blocking amber notification explains what happened.
  3. An automated recommendation engine calculates and displays the **4 closest available alternatives** by time difference on that date. Clicking an alternative updates the selection in one click.

### Reschedule Flow
* The user can toggle into Reschedule mode based on `existingBooking` (`BK-20261008-0042`).
* When confirming a reschedule via `PUT /api/bookings/:id`, an unmistakable comparison is presented:
  `Was: [Old Date & Time] → New: [New Date & Time]` in both provider and patient clocks.

---

## 4. Testing
Automated unit tests in `src/lib/__tests__/`:
* `timezone.test.ts`: Covers all 6 messy timezone formats in the dataset, country fallbacks, and day-crossing detection.
* `slotEngine.test.ts`: Slot step calculation with buffers, provider schedule boundary enforcement, group booking consecutive slot filtering, and closest alternative ranking.

Run tests:
```bash
npx vitest run
```
All 16 tests pass.

---

## 5. Dev Panel
A floating **Dev Tools** button in the bottom right corner lets evaluators:
* Switch between all 6 healthcare providers to test different timezone formats.
* Switch the simulated customer timezone (Kathmandu, Bangkok, Delhi, London, New York).
* Force 409 slot conflicts or 500 server errors on demand.
* Reset the booking store to initial data.

---

## 6. What Was Left Out / Future Enhancements
* **SMS / WhatsApp Confirmation:** Simulated instant SMS reminder dispatch with deep link for quick rescheduling.
* **Recurring Appointments:** Scheduling repeating weekly or monthly check-up consultations across timezones.

---

## 7. AI Tools Usage
In accordance with MedEx's instructions to disclose AI-assisted tooling:
* **Tooling Used:** Google Antigravity (Advanced Agentic Pair-Programming Assistant).
* **Where Used:**
  * **Timezone Parsing Matrix:** Constructing the comprehensive regex and fallback mapping matrix for ambiguous and non-standard timezone notations (e.g., `"(GMT+5:45)"`, `"Nepal Standard Time"`).
  * **Unit Test Cases:** Writing comprehensive unit tests for slot math, dead-time buffer handling, consecutive group slot discovery, and closest alternative ranking.
  * **Build Optimization:** Resolving Next.js 16.4.2 App Router client component prerender checks using `<Suspense>` boundaries.
* **Comprehension:** All lines of code, timezone arithmetic, and slot generation engines are thoroughly understood and ready to be explained in detail during the live technical interview.
