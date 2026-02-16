## 1. Product Overview

**Product name:** Membership Management Tracker (MERN)  
**Goal:** A web app for small gyms/studios to manage memberships, time slots, peak-hour pricing, and business settings, with dashboards for activity and revenue.

**Tech stack (mandated):**

- **Backend:** Node.js, Express, MongoDB, Mongoose, Zod (validation)
- **Frontend:** React (Vite), Material UI (MUI), Notistack, react-hook-form, zod, @hookform/resolvers, Axios, Day.js, Recharts, Framer Motion
- **Project layout:** Root `client/` and `server/` folders, root scripts to run both (via `concurrently`)

This PRD is written to be directly used as a blueprint to implement the full app from scratch.

---

## 2. Scope

- **In scope**
  - Manage business-wide settings (labels, timings, pricing mode, etc.).
  - Manage plans (CRUD, deactivate, default seeding).
  - Manage slots (CRUD, deactivate, generate missing slots based on settings).
  - Manage pricing rules (plan + slot multipliers).
  - Manage members (CRUD, server-side search, snapshotting plan/slot/pricing at save time).
  - Dashboard with membership status summaries, activity, and revenue charts.
  - REST APIs with consistent JSON responses and server-side validation via Zod.
  - Modern SPA with 3 pages: Dashboard, Member, Configuration.
- **Out of scope**
  - Multi-tenant support (single business only).
  - Payments integration.
  - Multi-branch/locations.
  - Timezone configuration (assumes server and UI in same business timezone).

---

## 3. User Roles & Use Cases

**Roles:**  
- **ADMIN**
- **STAFF**
- **VIEWER**

**Key use cases:**

- **Business Settings**
  - View and edit business settings.
  - Immediately see updated labels (`memberLabel`, `planLabel`, `slotLabel`) across UI after saving.
- **Plans**
  - Auto-seed default plans into an empty database.
  - CRUD operations on plans; activate/deactivate plans.
- **Slots**
  - Auto-generate default hourly slots based on settings.
  - CRUD operations on slots; activate/deactivate slots.
  - Generate missing slots when settings change, without deleting or overwriting existing slots.
- **Pricing Rules**
  - Create/edit/delete multipliers for plan+slot combos.
- **Members**
  - Create a member with plan/slot selection, auto-calculated end date and default price.
  - Edit existing members; snapshot rules ensure existing data never auto-changes when settings/plans/slots change.
  - Search members by name or mobile (server-side partial match).
- **Dashboard**
  - See counts of active, expired, and nearing expiry members.
  - See “active now” members count based on snapshot slot times and current time.
  - See revenue aggregates (monthly, quarterly, yearly for current periods).
  - See charts for monthly revenue trend (last 12 months) and active vs expired.

---

## 4. Functional Requirements

### 4.1 Global Concepts & Definitions

- **Business Settings**: Single-document configuration that defines business name, labels, slot duration, timings, and pricing behavior.
- **Plan**: Membership plan with base price and validity (in months).
- **Slot**: Time window (HH:mm–HH:mm) representing session times; used for schedule and “active now” logic.
- **Pricing Rule**: Optional peak-hour multiplier per (plan, slot) pair.
- **Member**: A subscriber with chosen plan+slot, schedule, price, and payment state. Contains snapshots of plan/slot/build-time pricing.
- **Active member:** `endDate >= today` (date-only comparison).
- **Expired member:** `endDate < today`.
- **Nearing expiry:** `today <= endDate <= today + nearingExpiryDays`.
- **Active now:** Current time (HH:mm) falls within member’s `slotSnapshot.startTime` (inclusive) and `slotSnapshot.endTime` (exclusive).

All date/time logic uses Day.js (frontend) and native/Day.js (backend), with consistent interpretation of “day” (no time-of-day for endDate comparisons).

---

### 4.2 Business Settings

**Model fields (single document only):**

- **`businessName`** (string, required)
- **`businessType`** (string, required; e.g. “Gym”, “Yoga Studio”)
- **`logoUrl`** (string, optional, URL format)
- **`contactPhone`** (string, optional)
- **`memberLabel`** (string, required; default: `"Member"`)
- **`planLabel`** (string, required; default: `"Plan"`)
- **`slotLabel`** (string, required; default: `"Slot"`)
- **`currencySymbol`** (string, required; default: `"₹"`)
- **`openTime`** (string, required, format `HH:mm`, default: `"05:00"`)
- **`closeTime`** (string, required, format `HH:mm`, default: `"21:00"`)
- **`slotDurationMinutes`** (number, required, default: `60`, > 0)
- **`nearingExpiryDays`** (number, required, default: `7`, >= 0)
- **`pricingMode`** (enum, required: `"PLAN_ONLY"` or `"PLAN_PLUS_SLOT_MULTIPLIER"`; default `"PLAN_ONLY"`)

**Functional rules:**

- **Load-on-start:**  
  - Backend will expose `GET /api/settings` returning current settings.
  - Frontend must call this at app bootstrap and store in a global settings context/hook.
- **Immediate UI updates:**
  - After successful `PUT /api/settings`, frontend’s global settings state is updated.
  - All UI labels use this state directly (e.g., “Add Member” uses `memberLabel`).
- **No retroactive data mutation:**
  - Updating settings must not change existing members’ stored data or snapshots.
  - Derived dashboard calculations depend on existing member records only, not current settings.

---

### 4.3 Plans

**Model fields:**

- **`planName`** (string, required, unique, case-insensitive uniqueness ideally).
- **`basePrice`** (number, required, `>= 0`).
- **`validityMonths`** (number, required, integer, `>= 1`).
- **`isActive`** (boolean, required, default `true`).
- **Timestamps:** `createdAt`, `updatedAt`.

**Seeding logic:**

- On server startup (or first plan-read request), if `plans` collection is empty:
  - Insert the following active plans:

    | planName   | basePrice | validityMonths |
    |-----------|-----------|----------------|
    | Monthly   | 1000      | 1              |
    | Quarterly | 2000      | 3              |
    | Half Yearly | 5000    | 6              |
    | Yearly    | 10000     | 12             |

- Seeding must be **idempotent**: only runs when collection is completely empty.

**Behavior:**

- Only `isActive === true` plans appear for new member creation.
- Deactivating a plan:
  - Does **not** affect existing members (they rely on snapshots).
  - Removes it from selection for new members.
- Optionally, back-end can support fetching:
  - All plans (`GET /api/plans`) with a filter parameter `includeInactive` (boolean).

---

### 4.4 Slots

**Model fields:**

- **`slotLabel`** (string, required, unique; e.g. `"05:00-06:00"`).
- **`startTime`** (string, required, format `HH:mm`).
- **`endTime`** (string, required, format `HH:mm`).
- **`isActive`** (boolean, required, default `true`).
- **Timestamps:** `createdAt`, `updatedAt`.

**Business rules:**

- **Time interval:**
  - `startTime` inclusive, `endTime` exclusive.
  - Enforce `startTime < endTime`.
- **Uniqueness:**
  - `slotLabel` unique.
  - Additionally, a compound uniqueness on `(startTime, endTime)` is recommended.
- **Default generation (initial seeding):**
  - On startup (or first slot-read request), if `slots` collection is empty:
    - Read current settings (`openTime`, `closeTime`, `slotDurationMinutes`).
    - Auto-generate contiguous slots from open to close:
      - Example with defaults:
        - From `05:00` to `21:00`, 60-minute slots:
        - 05:00–06:00, 06:00–07:00, …, 20:00–21:00.
      - `slotLabel` convention: `"HH:mm-HH:mm"` with zero-padding.
    - All generated slots are `isActive = true`.

**Generate slots action:**

- **Intent:** “Generate missing slots based on current settings” **without** deleting or overwriting existing ones.
- **Endpoint behavior (e.g. `POST /api/slots/generate-missing`)**:
  - Read current settings (`openTime`, `closeTime`, `slotDurationMinutes`).
  - Compute the full theoretical list of slots.
  - For each theoretical slot:
    - If no existing slot with same `startTime` and `endTime`, create new slot with `isActive = true`.
    - If exists, leave as-is (do **not** change label or `isActive`).
  - Do **not** delete or modify any existing slots, even if they fall outside the new open/close times.
- **UI rules:**
  - Provide a clear action (button) on Configuration → Slots tab: **“Generate Missing Slots”**.
  - Confirmation dialog explaining:
    - “This will only create new missing slots based on current settings. Existing slots will not be modified or removed.”

- **Deactivation effect:**
  - `isActive === false` slots **must not** appear in the dropdown for new member selection.
  - Existing member snapshots still reference deactivated slots without change.

---

### 4.5 Pricing Rules

**Model fields:**

- **`planId`** (ObjectId, ref `Plan`, required).
- **`slotId`** (ObjectId, ref `Slot`, required).
- **`multiplier`** (number, required, `>= 0`, can be decimal e.g. `1.5`).
- Unique constraint on `(planId, slotId)`.

**Behavior:**

- If `pricingMode === "PLAN_PLUS_SLOT_MULTIPLIER"` and a pricing rule exists for `(selectedPlanId, selectedSlotId)`, default price on member form is:
  - `priceDefault = plan.basePrice * multiplier`.
  - Precision: round to 2 decimal places on frontend for display; store as number (float) in DB.
- Otherwise:
  - `priceDefault = plan.basePrice`.

**UI:**

- Configuration → **Pricing Rules** tab/section.
- Ability to:
  - Add a new rule: select `plan`, `slot`, enter `multiplier`.
  - Edit existing rule’s `multiplier`.
  - Delete rule.
- Validations must enforce `multiplier >= 0`.

---

### 4.6 Members

**Model fields:**

- **Core fields:**
  - **`name`** (string, required).
  - **`mobile`** (string, required, exactly 10 digits; store as string to preserve leading zeros).
  - **`email`** (string, optional; validate email format if present).
  - **`selectedPlanId`** (ObjectId, ref `Plan`, required; used only for reference and future editing, not for historical calculations).
  - **`selectedSlotId`** (ObjectId, ref `Slot`, required).
  - **`startDate`** (date, required; default: today’s date, date-only).
  - **`endDate`** (date, required; auto-calculated from `startDate` and `validityMonths`, but editable).
  - **`price`** (number, required, `>= 0`; final agreed price, editable).
  - **`fullyPaid`** (boolean, required).
  - **`pendingAmount`** (number, required, `>= 0`; business rules below).
- **Snapshot fields (MUST NOT be auto-updated):**
  - **`planSnapshot`** (embedded object, required):
    - `planId` (ObjectId)
    - `planName` (string)
    - `basePrice` (number)
    - `validityMonths` (number)
  - **`slotSnapshot`** (embedded object, required):
    - `slotId` (ObjectId)
    - `slotLabel` (string)
    - `startTime` (string, `HH:mm`)
    - `endTime` (string, `HH:mm`)
  - **`finalPrice`** (number, required) – the price at the time of save; always equals `price` at save time.
- **Other:**
  - **`notes`** (optional string; optional user story).
  - **Timestamps:** `createdAt`, `updatedAt`.

**Validation rules:**

- **Mobile:**
  - Must be exactly 10 digits (`^[0-9]{10}$`).
- **Email:**
  - If present, must be a valid email format.
- **End date vs start date:**
  - `endDate >= startDate` (date-only comparison).
- **Price:**
  - `price >= 0`.
- **Payment fields:**
  - If `fullyPaid === true` then `pendingAmount` must be exactly `0`.
  - If `fullyPaid === false` then `pendingAmount >= 0` (allow `0` for edge cases, but typical scenario `> 0`).
- **Snapshot rule:**
  - On **create** and **update** save:
    - Snapshot is recalculated from the selected current plan/slot at that moment.
    - `planSnapshot` stores current plan data; `slotSnapshot` stores current slot data; `finalPrice` stores `price`.
  - **Existing members must never be auto-modified** when plans/slots/settings change.
    - No background jobs or side effects should update snapshots or `finalPrice`.
    - Dashboard and searches always rely on data stored on member records.

**Default calculations on Member form:**

- **Default `startDate`:** Today’s date.
- **Default `endDate`:**
  - On selecting a plan (when `startDate` already set):
    - `endDate = startDate + validityMonths` months.
    - Implementation detail: end-exclusive vs inclusive? For simplicity and consistency:
      - Use Day.js `startDate.add(validityMonths, 'month')`.
  - User can override `endDate` manually with UI constraints still enforcing `endDate >= startDate`.
- **Default `price`:**
  - When plan+slot selected:
    - Read current `settings.pricingMode`.
    - If `"PLAN_PLUS_SLOT_MULTIPLIER"` and pricing rule exists:
      - `priceDefault = basePrice * multiplier`.
    - Else:
      - `priceDefault = basePrice`.
    - Set `price` field to this default. User can modify.
- **`pendingAmount`:**
  - Optionally auto-suggested as `0` if `fullyPaid` checked; or `price` if not.
  - But final values must pass validation rules above.

---

### 4.7 Search

**Requirements:**

- Backend `GET /api/members` supports optional query param `q`:
  - `q` applies **partial, case-insensitive match** on:
    - `name`
    - `mobile`
- Behavior:
  - If `q` is not provided or empty, return paginated full list.
  - If provided, filter by:
    - `name` contains `q` OR `mobile` contains `q`.
- Implementation details:
  - Mongo query using regex (with caution for performance) or text indexes.
- Pagination:
  - Basic skip/limit query params (`page`, `limit`) can be defined; at minimum:
    - `page` (1-based)
    - `limit` (default 20–50).

---

### 4.8 Dashboard

**Definitions (repeated for clarity):**

- **Active:** `endDate >= today`.
- **Expired:** `endDate < today`.
- **Nearing expiry:**  
  - `endDate` between `today` and `today + nearingExpiryDays` inclusive.
  - `nearingExpiryDays` from Business Settings.
- **Current activity:**
  - A member is “active now” if **current time** (HH:mm) is:
    - `>= slotSnapshot.startTime` and `< slotSnapshot.endTime`.

**Revenue logic:**

- Only include members where `fullyPaid === true`.
- Use `finalPrice` field for all revenue summaries.
- Period is defined based on `member.startDate`:
  - **Monthly total (current month):**
    - `startDate` in [first day of current calendar month, last day of current calendar month].
  - **Quarterly total (current quarter):**
    - Quarter 1: Jan–Mar, 2: Apr–Jun, 3: Jul–Sep, 4: Oct–Dec.
    - `startDate` in current quarter.
  - **Yearly total (current year):**
    - `startDate` in current calendar year.

**Charts (Recharts):**

- **Monthly revenue trend chart:**
  - Last 12 months, including current month.
  - For each month `M`:
    - Total revenue = sum of `finalPrice` for fully paid members with `startDate` in that month.
  - Response structure (example):

    ```json
    [
      { "month": "2025-03", "label": "Mar 2025", "revenue": 23000 },
      ...
    ]
    ```

- **Active vs expired chart:**
  - At the moment of API call:
    - `activeCount` = number of members with `endDate >= today`.
    - `expiredCount` = number with `endDate < today`.
  - Response structure:

    ```json
    { "active": 45, "expired": 12 }
    ```

**Dashboard summary endpoint (`GET /api/dashboard/summary`):**

- Returns a JSON structure like:

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalMembers": 120,
      "activeMembers": 80,
      "expiredMembers": 40,
      "nearingExpiryMembers": 10,
      "activeNowMembers": 15
    },
    "revenue": {
      "currentMonth": 50000,
      "currentQuarter": 150000,
      "currentYear": 600000
    },
    "charts": {
      "monthlyRevenueTrend": [
        { "month": "2025-03", "label": "Mar 2025", "revenue": 23000 }
      ],
      "statusDistribution": {
        "active": 80,
        "expired": 40
      }
    }
  }
}
```

---

## 5. Non-Functional Requirements

- **Performance:**
  - Dashboard summary must complete within ~1–2 seconds on a dataset of up to ~50k members (reasonable indexing).
- **Reliability:**
  - Use Mongo indexes for common queries (e.g., `endDate`, `startDate`, `mobile`, `name`).
- **Usability:**
  - Responsive layout (desktop-first but mobile-friendly).
  - Clear validation messages and inline field-level errors.
  - Accessible color contrast and form controls.
- **Security:**
  - CORS restricted to configured client origin in `.env`.
  - No direct user auth but provide baseline security best practices (e.g., no eval, sanitized inputs).

---

## 6. System Architecture

- **Overall Architecture:**  
  - MERN, split into:
    - `server/`: Node.js + Express + Mongoose + Zod.
    - `client/`: Vite + React + MUI + Axios + Notistack + Recharts + Framer Motion + Day.js + RHF + zod.
- **API Style:** REST JSON.
- **Response format (global):**
  - **Success:** `{ "success": true, "data": <payload> }`
  - **Error:** `{ "success": false, "message": "Human-readable error", "errors": { ...optional field-level details... } }`

---

## 7. Data Model (MongoDB Collections)

### 7.1 `settings` collection

- Single document, schema as in 4.2.
- Consider storing a fixed `_id` or enforce single-document via logic:
  - `findOne()` on each access; if none, create defaults.

### 7.2 `plans` collection

- Fields from 4.3.
- Indexes:
  - Unique index on `planName` (case-insensitive if using collation).
  - Optional: index on `isActive`.

### 7.3 `slots` collection

- Fields from 4.4.
- Indexes:
  - Unique index on `slotLabel`.
  - Unique compound index on `{ startTime, endTime }`.

### 7.4 `pricing_rules` collection

- Fields from 4.5.
- Unique compound index on `{ planId, slotId }`.

### 7.5 `members` collection

- Fields from 4.6.
- Indexes:
  - `{ mobile: 1 }` (unique or at least indexed).
  - `{ name: 1 }` (for search).
  - `{ endDate: 1 }` (for dashboard).
  - `{ startDate: 1 }` (for revenue).
  - Optionally `{ "slotSnapshot.startTime": 1, "slotSnapshot.endTime": 1 }` for “active now” queries.

---

## 8. API Design

All endpoints base path prefixed with `/api`.

### 8.1 Settings

- **GET `/api/settings`**
  - **Purpose:** Return current business settings.
  - **Response (200):** `{ success: true, data: { ...settings } }`
  - If no settings exist, create and return defaults.

- **PUT `/api/settings`**
  - **Body:** Full or partial settings update (but validated by Zod).
  - **Validation:** Using Zod schema matching Settings model.
  - **Responses:**
    - 200 on success with updated settings.
    - 400 with `{ success: false, message, errors }` on validation failure.

### 8.2 Plans

- **GET `/api/plans`**
  - Query params:
    - `includeInactive` (optional, default `false`).
  - Returns list of plans.

- **GET `/api/plans/:id`**
  - Returns a single plan or 404 if not found.

- **POST `/api/plans`**
  - Create new plan.
  - Zod validation for `planName`, `basePrice`, `validityMonths`, optional `isActive`.
  - 201 on success.

- **PUT `/api/plans/:id`**
  - Update an existing plan.

- **PATCH `/api/plans/:id/deactivate`**
  - Toggle `isActive` (e.g., body: `{ isActive: false }`).
  - Return updated plan.

- **DELETE `/api/plans/:id`** (optional)
  - If implemented, enforce safe delete:
    - Check whether any member references this `planId`.
    - If yes, return 400 with message “Plan is in use and cannot be deleted” and suggest deactivation instead.

### 8.3 Slots

- **GET `/api/slots`**
  - Query params:
    - `includeInactive` (default `false`).
  - Returns list.

- **GET `/api/slots/:id`**

- **POST `/api/slots`**
  - Create a slot.
  - Validate times and uniqueness.

- **PUT `/api/slots/:id`**

- **PATCH `/api/slots/:id/deactivate`**

- **POST `/api/slots/generate-missing`**
  - No body.
  - Uses current settings.
  - Returns summary:
    - `{ createdCount: number, totalSlots: number }`.

- **DELETE `/api/slots/:id`** (optional safe delete like Plans).

### 8.4 Pricing Rules

- **GET `/api/pricing-rules`**
  - Optional filters: `planId`, `slotId`.

- **POST `/api/pricing-rules`**
  - Body: `{ planId, slotId, multiplier }`.
  - Enforce uniqueness of (planId, slotId).

- **PUT `/api/pricing-rules/:id`**
  - Update `multiplier`.

- **DELETE `/api/pricing-rules/:id`**

### 8.5 Members

- **GET `/api/members`**
  - Query params:
    - `q` – optional search term.
    - `page` (default 1).
    - `limit` (default 20–50).
  - Returns:
    - `data.items`: array of members.
    - `data.pagination`: `{ page, limit, totalItems, totalPages }`.

- **GET `/api/members/:id`**

- **POST `/api/members`**
  - Body: member creation payload.
  - Server responsibilities:
    - Validate all fields with Zod:
      - Field-level rules including relationships (like `endDate >= startDate`).
    - Look up plan and slot by IDs to construct snapshots.
    - Calculate `finalPrice = price`.
    - Save and return created record.

- **PUT `/api/members/:id`**
  - Update existing member.
  - Same validation and snapshot logic as create:
    - If plan/slot changed, update snapshots from new references.
    - Even if plan/slot remain same, snapshots are re-derived from current plan/slot; this is acceptable for editing, provided that when the member was first created we snapshot correctly.  
      - **Alternative stricter rule (if desired):** snapshots should only update when plan/slot change, not on other edits — can be clarified in implementation.

- **DELETE `/api/members/:id`**
  - Hard delete; optional (could be restricted).

### 8.6 Dashboard

- **GET `/api/dashboard/summary`**
  - No input.
  - Returns: counts, revenue aggregates, and chart datasets as described in 4.8.

---

### 8.7 API Validation & Error Handling

- **Validation:**
  - Each route uses a dedicated Zod schema for body/query params.
  - On validation error:
    - Standard 400 with structure:
      - `{ success: false, message: "Validation error", errors: { field: "error message", ... } }`
- **Centralized error handler middleware:**
  - Catches thrown errors and unhandled rejections inside routes.
  - Maps:
    - ZodError to 400.
    - Mongoose validation/duplicate key errors to 400 or 409.
    - Unknown errors to 500 with generic message.

---

## 9. Frontend Application

### 9.1 Layout & Navigation

- **Top-level layout:**
  - MUI `AppBar` with business name and navigation.
  - Responsive drawer or navigation bar with links to:
    - Dashboard
    - Member
    - Configuration
  - All labels for `Member`, `Plan`, `Slot` should use `settings.memberLabel`, etc, when displayed in headings/labels (e.g. “Add {memberLabel}”).

- **Pages (exactly 3):**
  - **Dashboard**
  - **Member**
  - **Configuration** (with inner tabs/sections)

### 9.2 Global State & Data Fetching

- **Settings Context:**
  - Custom React context/hook (e.g. `useSettings`) to hold:
    - Current business settings.
    - A method to refresh settings from API.
  - App loads settings once on startup; used throughout.
- **API layer:**
  - Use Axios instance with:
    - `baseURL` from environment (Vite env variables).
    - `withCredentials` left false unless needed.
    - Success handler to unwrap `data.data`.
    - Error handler to handle `success: false` or HTTP errors.
- **Notifications:**
  - Use Notistack `SnackbarProvider` at root.
  - All API success/error messages use snackbars (success: green, error: red).

### 9.3 Forms

- **Form implementation:**
  - All forms built with `react-hook-form` + `zod` + `@hookform/resolvers/zod`.
  - Use MUI form components, integrated with RHF.
  - Field-level errors displayed under inputs with MUI `FormHelperText`.
- **Client-side validation:**
  - Mirror Zod schemas used on server.
  - Catch validation issues before submit where possible.

### 9.4 Dashboard Page

- **Content:**
  - Summary cards:
    - Total members
    - Active members
    - Expired members
    - Nearing expiry
    - Active now
  - Revenue summary cards:
    - Current month
    - Current quarter
    - Current year
  - Charts:
    - Line or bar chart: Monthly revenue trend (last 12 months).
    - Pie or bar chart: Active vs expired.
- **Behavior:**
  - Fetch `GET /api/dashboard/summary` on page load.
  - Loading state: skeletons/spinners.
  - Error state: error message + retry button.
- **Framer Motion:**
  - Apply subtle fade/slide transitions when dashboard mounts.

### 9.5 Member Page

- **Sections:**
  - Member search and list.
  - Add/Edit Member dialog or side panel.

- **Member list:**
  - Search input box with `q` (name/mobile).
  - Debounced typing (e.g. 300–500ms) before sending search request.
  - Table/ List showing:
    - Name, Mobile, Plan (from `planSnapshot.planName`), Slot (`slotSnapshot.slotLabel`), Start date, End date, Status (Active/Expired), Fully paid indicator.
  - Pagination controls.

- **Add/Edit member form (dialog/panel):**
  - Fields mapped from Member model.
  - Plan & Slot selects:
    - Only show active plans & slots.
    - When plan selected, set default `endDate` and recompute `price` default.
    - When slot selected, possibly recompute `price` default (if needed).
  - Pricing defaults:
    - On selecting plan+slot, fetch required data (or pre-fetched lists) and apply pricing rules logic.
  - Payment:
    - Checkbox `fullyPaid`; when checked:
      - `pendingAmount` auto-set to `0` (user can override but validation enforces).
  - Validation:
    - Enforce all rules with Zod and react-hook-form.
  - Behaviors:
    - On submit success:
      - Close dialog.
      - Refresh member list.
      - Show success snackbar.
    - On error:
      - Display field-level errors & snackbar error.

### 9.6 Configuration Page

Single page with tabs:

1. **Business Settings**
2. **Plans**
3. **Slots**
4. **Pricing Rules**

**Business Settings tab:**

- Form to edit settings.
- On load: fetch settings from context.
- On save success:
  - Update settings context.
  - Immediate label updates across other pages.
  - Snackbar success.

**Plans tab:**

- Table listing plans:
  - Columns: Plan name, Base price (with `currencySymbol`), Validity months, Active status, Actions (Edit, Deactivate).
- Buttons:
  - “Add {planLabel}”.
- Forms:
  - Add/Edit plan using RHF+zod.
- Deactivation:
  - Confirm dialog before toggling `isActive`.

**Slots tab:**

- Similar to Plans:
  - List of slots with label and times.
  - Filter by active/inactive.
- Button: “Generate Missing Slots”.
  - Shows confirmation dialog and calls `/api/slots/generate-missing`.
- Add/Edit slot forms.

**Pricing Rules tab:**

- Table listing rules:
  - Columns: Plan name, Slot label, Multiplier, Actions (Edit, Delete).
- Form:
  - Plan dropdown, Slot dropdown, Multiplier input.
  - Uses active plans/slots lists.
  - Validates `multiplier >= 0`.

### 9.7 Transitions & Animations

- **Framer Motion usage (light):**
  - Page-level fade/slide-in transitions when navigating between routes.
  - Dialog open/close subtle scaling/fade.
- No heavy animations or complex sequences.

---

## 10. Error Handling & Notifications (Frontend)

- **Global Axios error interceptor:**
  - If response body has `success: false`, show `message` in snackbar.
  - If network error, show generic “Network error, please try again”.
- **Form submit:**
  - If server returns `errors` object, map to RHF `setError` for each field.
- **404/500 pages (optional):**
  - Minimal fallback error UI for unhandled routes or server errors.

---

## 11. Environment & Project Setup

### 11.1 Repository Structure

- Root:
  - `client/` – Vite React app.
  - `server/` – Express API.
  - `package.json` – root scripts using `concurrently`.
  - `README.md` – dev setup instructions.
- **Server `.env.example`:**
  - `MONGO_URI=mongodb://localhost:27017/membership_tracker`
  - `PORT=5000`
  - `CLIENT_ORIGIN=http://localhost:5173`

### 11.2 Root Scripts (example spec)

- `npm run dev` – run both client and server through `concurrently`:
  - `concurrently "npm run dev --prefix server" "npm run dev --prefix client"`
- `npm run install-all` – optional script to install deps for client and server.

### 11.3 CORS

- Server uses CORS middleware:
  - `origin: process.env.CLIENT_ORIGIN`
  - `methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS"`
  - `credentials: false` (unless extended later).

---

## 12. Assumptions & Clarifications (Design Decisions)

- **Time zone:**  
  - Assumed same for server and clients (use server local time for dashboard and “active now”).
- **End-date calculation semantics:**  
  - `endDate = startDate.add(validityMonths, "month")`. Membership considered active through that `endDate` date (i.e. end-of-day).
- **Snapshot on update:**  
  - When editing a member:
    - If plan/slot changed, snapshot from new plan/slot.
    - If only other fields changed (like payment), snapshot can remain as-is (recommended).
- **Search performance:**  
  - Regex-based search is acceptable for moderate dataset; index `name` and `mobile`.
- **Mobile uniqueness:**  
  - Optional: enforce unique `mobile` per member. If enforced, server returns 409 on duplicates.

---

## 13. Authentication and Roles

### 13.1 Goal and Scope

- **Current state:** Secure authentication + role-based access control (RBAC) is active.
- **Goal:** Protect data and actions by authenticated identity and role, without redesigning existing business workflows/pages.

### 13.2 In Scope and Out of Scope

- **In scope**
  - Login/logout with secure sessions.
  - Admin-managed users and roles.
  - RBAC enforcement on backend (source of truth) and frontend route/action visibility.
  - Access + refresh token strategy with rotation and reuse detection.
  - CSRF protection for cookie-based auth endpoints.
  - Audit logging for critical actions.
  - Rate limiting and brute-force protection for login.
  - Security hardening: helmet, strict CORS, secure cookies, strict validation.
- **Out of scope (Phase 2 / future)**
  - Email OTP delivery for reset codes (currently admin-issued reset code flow is implemented).
  - Email verification.
  - 2FA.
  - Multi-tenant business accounts.

### 13.3 Roles and Permissions Matrix

| Module / Action | ADMIN | STAFF | VIEWER |
|---|---|---|---|
| Dashboard (read) | Yes | Yes | Yes |
| Members (list/search/get) | Yes | Yes | Yes |
| Members (create/update/delete) | Yes | Yes | No |
| Settings | Yes | No | No |
| Plans | Yes | No | No |
| Slots | Yes | No | No |
| Pricing Rules | Yes | No | No |
| Users management | Yes | No | No |
| Audit log view | Yes | No | No |

### 13.4 Screen List Impacted

- Existing screens wrapped with auth:
  - Dashboard
  - Members
  - Configuration
- New screens:
  - Setup (one-time owner setup)
  - Login
  - Reset Password (code-based)
  - Change Password (forced when `mustChangePassword === true`)
  - Users (ADMIN only)
  - Access Denied

### 13.5 API List Impacted

- **New APIs**
  - `GET /api/auth/setup-status`
  - `POST /api/auth/setup`
  - `POST /api/auth/login`
  - `POST /api/auth/reset-password`
  - `POST /api/auth/logout` (CSRF protected)
  - `POST /api/auth/refresh` (CSRF protected)
  - `GET /api/auth/me`
  - `POST /api/auth/change-password`
  - `GET /api/users` (ADMIN)
  - `POST /api/users` (ADMIN)
  - `PUT /api/users/:id` (ADMIN)
  - `PATCH /api/users/:id/deactivate` (ADMIN)
  - `POST /api/users/:id/reset-password` (ADMIN)
  - `GET /api/audit-logs` (ADMIN, paginated)
- **Existing APIs updated**
  - All existing module routes require authentication.
  - Role permissions are applied per module/action.

### 13.6 Data Model Changes

- **`users` collection**
  - `name`, `email` (unique, required), `mobile` (optional), `passwordHash`
  - `role` enum (`ADMIN`, `STAFF`, `VIEWER`)
  - `isActive` (bool), `mustChangePassword` (bool)
  - `lastLoginAt`, `failedLoginCount`, `lockUntil`, `tokenVersion`
  - timestamps
- **`userSessions` collection**
  - `userId`, `sessionId`, `refreshTokenHash`
  - `createdAt`, `expiresAt`, `revokedAt`, `lastUsedAt`
  - `ipAddress`, `userAgent`
- **`auditLogs` collection**
  - `actorUserId`, `actorRole`, `actionType`, `entityType`, `entityId`
  - `before`, `after`, `ipAddress`, `userAgent`, `createdAt`
- **`passwordResetTokens` collection**
  - `userId`, `tokenHash`, `expiresAt`, `usedAt`, `createdByUserId`
  - timestamps
- **`systemStates` collection**
  - setup state marker (`key: INITIAL_SETUP`, `setupCompleted`, `setupCompletedAt`)

### 13.7 Security Controls (Frontend + Backend)

- **Backend**
  - JWT access token (15m) + refresh token (14d).
  - Access + refresh tokens in `httpOnly` cookies, refresh rotation, reuse detection, per-session persistence.
  - CSRF double-submit token (`XSRF-TOKEN` cookie + `X-CSRF-Token` header).
  - Role middleware: authenticated + active user + permission check.
  - Login protections: IP/email rate limit, account lockout, generic invalid-credentials response.
  - Password policy + bcrypt cost 12.
  - Helmet, strict CORS allowlist, secure cookie attributes, validation with Zod.
  - No secrets/tokens/passwords in logs.
- **Frontend**
  - Cookie-based auth (no auth token storage in localStorage/sessionStorage).
  - Axios interceptor auto-refreshes once on 401 and retries.
  - If refresh fails, force logout + redirect to Login with toast.
  - Route-level protection + role-based UI action hiding.

### 13.8 Audit Logging Requirements

- Must log:
  - `LOGIN_SUCCESS`, `LOGIN_FAIL`, `LOGOUT`, `PASSWORD_CHANGE`
  - `SETUP_COMPLETE`, `USER_CREATE`, `USER_UPDATE`, `USER_DEACTIVATE`
  - `PASSWORD_RESET_ISSUED`, `PASSWORD_RESET_COMPLETE`, `TOKEN_REUSE_DETECTED`
  - Protected CREATE/UPDATE/DELETE operations across core modules.
- Redaction rules:
  - Never persist raw passwords, password hashes, tokens, secrets.
  - `before/after` should contain only safe fields.

### 13.9 Error States and UX Rules

- **401 unauthenticated:** redirect/login flow.
- **403 forbidden:** show Access Denied screen with Go Back action.
- **422 validation:** inline form errors + snackbar.
- **429 rate limit:** clear user-friendly message.
- **Session expiry:** toast + redirect to login.
- **Forced password change:** block app usage until password changed.

### 13.10 Test Plan and Acceptance Criteria

- Unauthenticated users cannot access protected pages/APIs.
- Login/logout/refresh works with rotation and session record updates.
- Refresh/logout fail without CSRF header and succeed with valid CSRF.
- Rate-limiting and account lockout thresholds behave as specified.
- RBAC enforces:
  - ADMIN full access
  - STAFF blocked from settings/users
  - VIEWER blocked from all mutate endpoints
- Security checks:
  - Helmet active
  - CORS allowlist enforced
  - No tokens in local storage
  - Password hashing + policy valid
- Audit logs generated for required events.

### 13.11 Rollout Plan (Phase-wise)

- **Phase 1 (implement now)**
  - Add auth/session backend and secure token flow.
  - Add users + RBAC + route protection.
  - Add frontend login/session handling + protected routing.
  - Add audit logging + basic admin Users/Audit screens.
- **Phase 2 (document only)**
  - Reset flow via email/OTP delivery channel.
  - Email verification.
  - 2FA.
  - Multi-tenant business account architecture.

### 13.12 Backward-Safe Migration Notes

- Existing business modules and pages remain intact; they are wrapped by auth checks.
- API payload format remains consistent (`{ success, data }` / `{ success, message, errors? }`).
- Environment configuration must include auth secrets and client origin before enabling production rollout.
