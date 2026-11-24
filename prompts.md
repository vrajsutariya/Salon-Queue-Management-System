# Chronological Prompts Log (`prompts.md`)

> **Project:** Salon Queue Management System (Crown & Blade Luxury Salon)  
> **Course / Lab:** MSc IT Vibe Coding Lab  
> **Author:** Vraj Sutariya  
> **Repository:** `salon-queue-management-system`  
> **Stack:** React 18 (Vite) + Node.js (Express) + MongoDB (Mongoose) + Socket.io + Bootstrap 5 / Atelier Noir Theme  

---

## Overview

This document maintains a complete, chronological log of all prompts utilized to design, scaffold, implement, debug, polish, and deploy the Salon Queue Management System. It tracks initial feature prompts, failed attempts, edge-case bug fixes, performance optimizations, and deployment resilience iterations.

---

## Phase 1: Architecture, Documentation & Scaffolding

### Prompt 1: Project Setup, Documentation & Foundation

* **Timestamp / Step:** Step 1
* **Objective:** Establish clean directory structure, generate lab rule documentation (`docs/`), configure global development standards (`AGENTS.md`), and scaffold minimal `client/` and `server/` boilerplate.
* **Prompt Text:**
  ```markdown
  You are the lead developer building the "Salon Queue Management System" based on the MSc IT Vibe Coding Lab specifications. 

  #### 1. Setup Project Architecture & Folders
  Create a root project structure containing `docs/`, `client/`, and `server/`:
  - `salon-queue/`
    ├── `AGENTS.md` (instructions and rules at project root)
    ├── `docs/`
    │   ├── `01-brief.md`
    │   ├── `02-screens.md`
    │   └── `03-flows-rules.md`
    ├── `client/` (Frontend: React + Vite + Bootstrap)
    └── `server/` (Backend: Node.js + Express + MongoDB + Socket.io)

  #### 2. Documentation Creation
  Generate the 3 documentation files inside `docs/` capturing all rules from the lab handout:
  - `docs/01-brief.md`: Problem statement, 4 user roles (Customer, Receptionist, Barber, Owner), must-have features (7 screens), the strict "Don't build" list (no online payment, no future bookings, no SMS/WhatsApp, no loyalty, no multi-branch), and theme definition.
  - `docs/02-screens.md`: Detailed specs for all 7 screens (1. Home `/`, 2. Join Queue `/join`, 3. My Status `/status/:id`, 4. Reception `/reception`, 5. Barber View `/barber/:name`, 6. Waiting Area TV `/display`, 7. Owner Settings `/admin`).
  - `docs/03-flows-rules.md`: Queue state transitions (`Waiting` -> `Called` -> `In chair` -> `Done`), barber matching logic (earliest matching barber or 'Any'), wait time estimation formula (`total service minutes ahead / active barbers`), 10-minute no-show rule, and the complete 8-item verification checklist.

  #### 3. Root `AGENTS.md` Setup
  Create `AGENTS.md` in the project root containing our tech stack and these mandatory development guidelines:
  - **Stack**: React (Vite) + Bootstrap 5 + Node.js/Express + MongoDB (Mongoose) + Socket.io (for real-time multi-device sync across phone, tablet, and TV).
  - **Core Rules**:
    - Always write clean code and follow React & JavaScript best practices.
    - Follow senior frontend coding standards and keep components reusable.
    - Follow a responsive-first approach, semantic HTML5, and accessibility (WCAG).
    - Use Bootstrap 5 for responsive layout and grid.
    - **Theme & Styling**: Premium dark salon feel. Use **CSS variables only** (never hardcode colors):
      - Primary dark background: `--bg-charcoal: #1F2937;`
      - Accent: `--accent-gold: #D4A017;`
      - Neutral text and surface variables for cards, badges, and modals.
    - **Animations**: Use performant animations (e.g., Framer Motion / CSS transforms & opacity), respect `prefers-reduced-motion`, smooth transitions, and viewport-triggered animations.
    - **Localization**: All labels must use a centralized EN/GU translation file/context; no hard-coded English text in components.
    - **Single Source of Truth**: Queue rules and statuses live in one place; reuse them everywhere.
    - Respect the "Don't build" list.

  #### 4. Initialize `client/` (Frontend)
  - Initialize a React + Vite application.
  - Install `bootstrap`, `bootstrap-icons` (or `lucide-react`), and `socket.io-client`.
  - Set up a central CSS file defining the theme variables (`--bg-charcoal`, `--accent-gold`, etc.) and basic card styling.
  - Set up React Router with placeholder/skeleton pages for all 7 screens:
    - `Home.jsx` (`/`)
    - `JoinQueue.jsx` (`/join`)
    - `MyStatus.jsx` (`/status/:id`)
    - `Reception.jsx` (`/reception`)
    - `BarberView.jsx` (`/barber/:name`)
    - `WaitingAreaTV.jsx` (`/display`)
    - `AdminSettings.jsx` (`/admin`)
  - Create a basic language context with an English/Gujarati (`en`/`gu`) dictionary toggle visible in a common header/navbar.

  #### 5. Initialize `server/` (Backend)
  - Initialize a Node.js project with `express`, `mongoose`, `socket.io`, `cors`, and `dotenv`.
  - Set up the server entry point (`server.js`) connecting to MongoDB via an environment variable (`MONGODB_URI`).
  - Initialize Socket.io integration to broadcast events across clients.
  - Create a basic `/api/health` health check endpoint.

  #### 6. Completion Condition
  Ensure both client and server start cleanly without syntax or dependency errors. List all created files, summarize how the stack is wired, and explain how to run both `client` and `server`. Do not implement the detailed screen forms yet.
  ```
* **Outcome:** Clean scaffold created. `docs/` contained 3 Markdown rule specifications. Basic routing configured in React. Express server with Socket.io attached.
* **Issues Encountered & Fixes:** None at this step. Baseline verified with `npm run build` and server health check `GET /api/health`.

---

## Phase 2: Core Customer Intake & Queue Joining

### Prompt 2: Build Screen 1 (Home) & Screen 2 (Join Queue)

* **Timestamp / Step:** Step 2
* **Objective:** Implement data schemas for Barbers, Services, and Queue Tickets. Build Screen 1 (Home landing page with live wait banner) and Screen 2 (Multi-service join form with duplicate phone number protection).
* **Prompt Text:**
  ```markdown
  Read `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, and `docs/03-flows-rules.md`. Implement Screen 1 (Home) and Screen 2 (Join Queue), including the required backend models and API endpoints.

  #### 1. Backend: Data Models & Endpoints (`server/`)
  - **Mongoose Models**:
    - `Barber`: name, photo/avatar, status (`free`, `busy`, `break`), isOnDuty (boolean). Seed with 3 default barbers: Ravi, Amit, Imran.
    - `Service`: name (EN & GU), durationMinutes, priceInr, isActive (boolean). Seed with default services: Haircut (30 min, ₹150), Beard Trim (15 min, ₹80), Hair Spa (45 min, ₹400), Head Massage (20 min, ₹150).
    - `QueueTicket`: token (e.g., "S-1"), customerName, phone, services (array of Service refs), preferredBarber ("any" or Barber ref), assignedBarber, status (`waiting`, `called`, `in-chair`, `done`, `cancelled`, `no-show`), joinedAt, estimatedWaitTimeMinutes.
  - **API Endpoints**:
    - `GET /api/salon/live-status`: returns salon open status ("Open · Closes 9 PM"), waiting count, active barbers with their current statuses, and estimated general wait time.
    - `GET /api/services`: returns active services.
    - `GET /api/barbers`: returns barbers on duty.
    - `POST /api/queue/join`: validates payload, enforces the **one active spot per phone number** rule (returns existing ticket if already waiting), generates token sequence (S-1, S-2...), saves to MongoDB, emits a Socket.io event (`queue:updated`), and returns the created ticket.

  #### 2. Frontend: Screen 1 — Home (`client/src/pages/Home.jsx`)
  - **Route**: `/`
  - **Header**: Salon branding/logo, status badge (`Open · Closes 9 PM`), and language toggle (EN/GU).
  - **Live Queue Hero Card**:
    - Styled with CSS variables (`--bg-charcoal`, `--accent-gold`, rounded borders).
    - Shows dynamic stats: e.g., *"6 people waiting · about 50 min wait"*.
  - **Barber Status Chips**:
    - Grid/flex chips for active barbers with colored indicator badges: Ravi (`Busy`), Amit (`Free`), Imran (`On break`).
  - **Call-to-Action**:
    - Prominent, full-width gold button: **[ Join Queue ]** navigating to `/join`.
  - Respect reduced motion and add smooth entrance animations using CSS or Framer Motion.

  #### 3. Frontend: Screen 2 — Join Queue (`client/src/pages/JoinQueue.jsx`)
  - **Route**: `/join`
  - **Form Fields**:
    - **Customer Name**: Text input with validation.
    - **Phone Number**: 10-digit numeric phone validation with real-time feedback.
  - **Service Selection Cards**:
    - Multi-select card grid using Bootstrap responsive columns (`col-12 col-md-6`).
    - Displays service name (bilingual via context), duration (min), and price (₹).
    - **Rule**: Enforce maximum 3 services limit. Once 3 are selected, visually disable unselected service cards with a friendly tooltip/notice.
  - **Barber Picker**:
    - Option 1: *"Any barber (fastest)"* card (default selected).
    - Option 2: Individual barber cards with photo/avatar and name.
  - **Live Summary Bar / Sticky Card**:
    - Automatically recalculates in real-time as services are toggled:
      - *Total Duration* (e.g., "45 min")
      - *Total Price* (e.g., "₹230")
      - *Expected Wait* (e.g., "~35 min" based on current queue).
  - **Submit Action**:
    - **[ Confirm & Join ]** button.
    - On submit, call `POST /api/queue/join`. On success, navigate to `/status/:id` with the generated ticket ID.
    - If the phone number already has an active spot, gracefully show an alert and route directly to their existing `/status/:id`.

  #### 4. Coding & Theme Standards
  - Use **Bootstrap 5** utility classes for layout/flex/grid and **CSS variables** for all colors (no hardcoded HEX or arbitrary colors).
  - Ensure all labels and buttons pull from the EN/GU dictionary context.
  - Keep tap targets at least 44px for mobile devices.

  #### 5. Verification & Test Output
  - Verify that selecting up to 3 services correctly updates the total time and price.
  - Verify attempting to select a 4th service is blocked.
  - Verify submitting redirects to `/status/:id`.
  - List the files created/modified and provide clear test instructions.
  ```
* **Outcome:** Successfully created `Barber`, `Service`, and `QueueTicket` models. Live status endpoint returned accurate counts. Join queue screen enforced 3-service max and duplicate phone check.
* **Failed Attempt / Bug:** When a user with an active spot re-entered their phone number, the backend previously threw a `400 Bad Request` with an unhandled exception in the frontend catch block, showing a blank screen.
* **Fix Applied:** Modified `POST /api/queue/join` to return `{ alreadyJoined: true, ticket: existingTicket }` with status 200, allowing the client to trigger a friendly toast notification (*"You already have an active ticket in line"*) and cleanly navigate to `/status/:id`.

---

## Phase 3: Visual Identity & Real-Time Tracking

### Prompt 3: Luxury UI/UX Overhaul & Build Screen 3 (My Status)

* **Timestamp / Step:** Step 3
* **Objective:** Elevate visual aesthetics to luxury dark salon branding with gold accents. Implement Screen 3 (`/status/:id`) with SVG circular progress wait timer, "Start Coming" alert (2nd in line), and full-screen gold "It's Your Turn" modal with sound/vibration alerts.
* **Prompt Text:**
  ```markdown
  You are a **Senior UI/UX & Lead Frontend Designer** with deep expertise in modern luxury branding, micro-interactions, and motion design.

  The current UI looks like a flat prototype. Your task is to elevate the visual system into an **aesthetic, real-world luxury salon experience** using refined Bootstrap styling, custom CSS variables, and fluid motion animations (Framer Motion or hardware-accelerated CSS), and then build the full **Screen 3: My Status (`/status/:id`)**.

  #### 1. Design System & Luxury Theme Upgrade (`client/src/index.css` / variables)
  Revamp the global CSS variables and theme to create a sleek, modern aesthetic:
  - Deep Dark Background: `--bg-base: #0D1117;`, `--bg-surface: #161B22;`, `--bg-card: #21262D;`
  - Metallic Champagne Gold Accents: `--gold-primary: #D4A017;`, `--gold-gradient: linear-gradient(135deg, #F3E7C4 0%, #D4A017 50%, #996515 100%);`
  - Subtle Gold Glow: `--gold-glow: 0 0 20px rgba(212, 160, 23, 0.25);`
  - Text: `--text-primary: #F0F6FC;`, `--text-secondary: #8B949E;`, `--text-gold: #E5C07B;`
  - Semantic: `--color-success: #2EA043;`, `--color-warning: #D29922;`, `--color-danger: #F85149;`
  - Glassmorphism & Borders: Rounded corners (16px), subtle translucent dark surfaces with border highlights.

  #### 2. Build Screen 3: My Status (`client/src/pages/MyStatus.jsx`)
  - Route: `/status/:id`
  - Data Fetching & Socket Integration: Listen to `queue:updated`, `ticket:called`, `ticket:cancelled` for instant state updates.
  - UI Elements:
    1. Salon Header with live connection indicator dot.
    2. Hero Token Card (Token badge, customer name, services, live position pill).
    3. Interactive Circular Countdown / Wait Timer (SVG progress indicator).
    4. "Start Coming" Alert Banner (Triggered when 2nd in line with pulsing amber banner).
    5. Full-Screen "It's Your Turn!" Gold Takeover (Triggered when status is `called`, with chime & vibration).
    6. Cancel Spot Action with confirmation modal.

  #### 3. Backend Support for Step 3 (`server/`)
  - `GET /api/queue/:id`: Returns ticket details, calculated live queue position, and dynamic estimated wait time.
  - `POST /api/queue/:id/cancel`: Marks ticket status as `cancelled`, recalculates queue positions, and emits `queue:updated`.
  ```
* **Outcome:** Screen 3 rendered with high-fidelity glassmorphism, countdown SVG circle, and full-screen modal. Audio chime implemented via Web Audio API.
* **Failed Attempt / Bug:** Audio playback failed on mobile browsers due to the browser's autoplay security policy (`AudioContext was not allowed to start`).
* **Fix Applied:** Implemented a silent unlock listener on first user interaction (touch/click) and synthesized Web Audio chime tones with fallback to HTML5 Audio element.

---

## Phase 4: Receptionist Tablet Experience & Matching Algorithm

### Prompt 4: Portfolio Aesthetic Integration & Build Screen 4 (Reception Dashboard)

* **Timestamp / Step:** Step 4
* **Objective:** Align typography to Fraunces and Jost luxury pairing. Build Screen 4 (`/reception`) tablet layout with Active Barbers panel, Live Waiting Queue table, walk-in modal, >60 min amber alerts, and the core FIFO + barber preference allocation algorithm.
* **Prompt Text:**
  ```markdown
  You are an expert Frontend Architect and UI/UX Designer.

  #### 1. Adopt Portfolio Design System & Typography
  Upgrade the entire app's global styling (`client/src/index.css`) to match the luxury aesthetic:
  - Google Fonts Import: Fraunces (serif headings) + Jost (clean sans-serif body).
  - Color Variables: `--bg-color: #0A0A0A;`, `--heading-color: #F8F6F0;`, `--text-color: #B8B8B8;`, `--accent-color: #E8DCC8;`, `--dark-accent-color: #A79276;`, `--card-color: #141414;`, `--border-color: #262626;`.

  #### 2. Build Screen 4: Reception Dashboard (`client/src/pages/Reception.jsx`)
  - Route: `/reception`
  - Layout Target: Designed for a 10-inch tablet in landscape / desktop view using Bootstrap responsive grid (`container-fluid py-4`).
  - Live Sync: Connect with Socket.io for automatic real-time updates without page refresh.
  - Header: Reception title with live clock, current waiting summary, and **[ + Add Walk-in ]** button.
  - Left Section: Active Barbers Panel (`col-lg-5 col-xl-4`) with current customer, elapsed timer, and **[ Call Next ]** button.
  - Right Section: Live Waiting Queue Table (`col-lg-7 col-xl-8`) with token, name, services, wait timer, >60 min amber highlight, and No-show / Cancel actions.

  #### 3. Backend: "Call Next" Rules & Endpoints (`server/`)
  - Implement `POST /api/queue/call-next` with strict barber matching logic:
    - Customer requesting Ravi must NEVER be called by Amit or Imran.
    - If preferredBarber == "any" OR preferredBarber == barberId, pick earliest customer.
    - If barber already has an active customer in chair, reject call.
  - Implement `POST /api/queue/walkin` and `POST /api/queue/:id/no-show`.
  ```
* **Outcome:** Reception dashboard successfully displayed dual-pane layout. "Call Next" respected strict barber preference.
* **Failed Attempt / Bug:** In initial testing, when Amit clicked "Call Next" and the next person in queue requested Ravi, the algorithm assigned Ravi's customer to Amit because the query used `$or` without checking whether Ravi was currently on duty or free.
* **Fix Applied:** Refined MongoDB matching query:
  ```javascript
  const candidate = await QueueTicket.findOne({
    status: 'waiting',
    $or: [{ preferredBarber: barberId }, { preferredBarber: 'any' }, { preferredBarber: null }]
  }).sort({ joinedAt: 1 });
  ```
  This guarantees Amit only receives customers who selected Amit or "Any".

---

## Phase 5: Barber Mobile View, Waiting Area TV & Vector Avatars

### Prompt 5: Barber View (`/barber/:name`), Waiting Area TV (`/display`) & Vector Avatar System

* **Timestamp / Step:** Step 5
* **Objective:** Replace external photo URLs with consistent, lightweight SVG vector avatars. Build Screen 5 (mobile barber station view with break toggle and service timer) and Screen 6 (10-foot TV display with chime and flash animations).
* **Prompt Text:**
  ```markdown
  You are a Senior Frontend Architect and UI/UX Designer.

  In this step, implement **Screen 5 (Barber View)**, **Screen 6 (Waiting Area TV Display)**, resolve image/avatar sizing issues across the application, and wire the real-time lifecycle transitions across all views.

  #### 1. Vector Avatar System & Image Sizing Fix (Global & Home Page)
  - Replace Real Photos with Sleek Vector/SVG Avatars:
    - Create a reusable `<BarberAvatar name={name} size={size} status={status} />` component that dynamically renders vector avatars with champagne-gold accents `#E8DCC8`.
  - Fix avatar stretching and enforce strict aspect ratio across Home and Join pages.

  #### 2. Build Screen 5: Barber View (`client/src/pages/BarberView.jsx`)
  - Route: `/barber/:name` (e.g., `/barber/Ravi`, `/barber/Amit`, `/barber/Imran`)
  - Mobile ergonomics: minimum 48px tap targets.
  - Barber Header with live duty status and **[ Available / On Break ]** toggle.
  - Active Customer card with running elapsed timer and **[ Start Service ]** / **[ Done / Complete ]** buttons.
  - "Next for You" preview card showing the next waiting customer.

  #### 3. Build Screen 6: Waiting Area TV Display (`client/src/pages/WaitingAreaTV.jsx`)
  - Route: `/display`
  - High-resolution 10-foot TV display readable from 5 meters away.
  - Left Section: Barber Station Status Rows (`col-md-7`) showing avatar, name, and current token (`Now: S-12`).
  - Right Section: "Up Next in Line" Column (`col-md-5`) showing next 5 tokens.
  - Visual gold flash animation and Web Audio synthesized chime when a customer is called.

  #### 4. Backend Lifecycle & Real-Time Sync (`server/`)
  - Endpoints: `POST /api/barbers/:name/toggle-break`, `POST /api/queue/:id/start`, `POST /api/queue/:id/done`.
  - Sync Requirement: State changes must reflect across Phone, Reception, and TV in under 5 seconds via WebSockets.
  ```
* **Outcome:** Barber view and TV display fully connected. Transitions (`called` $\rightarrow$ `in-chair` $\rightarrow$ `done`) synchronizing across all open browser instances in < 500ms.
* **Failed Attempt / Bug:** The TV display chime triggered multiple times consecutively when several clients connected simultaneously due to redundant socket reconnect emissions.
* **Fix Applied:** Implemented a client-side audio debounce ref (`lastChimeTimestampRef`) on the TV component to prevent duplicate sound triggers within 3 seconds of the last chime.

---

## Phase 6: Owner Admin Console & Security Controls

### Prompt 6: Owner Settings (`/admin`) with PIN Lock & Management Controls

* **Timestamp / Step:** Step 6
* **Objective:** Secure `/admin` with a 4-digit PIN lock (`1234`). Implement Master Online Queue Open/Close toggle, Service CRUD, Barber CRUD with on-duty toggles, and daily analytics cards.
* **Prompt Text:**
  ```markdown
  You are a Senior Full-Stack Engineer and UI/UX Designer.

  Build **Screen 7: Owner Settings (`/admin`)** with a secure PIN entry screen, complete management capabilities (add/edit barbers, add/edit services, toggle on-duty/active states), master queue switch, and daily analytics.

  #### 1. Security: PIN Lock Protection (PIN: `1234`)
  - Protect the `/admin` route with a sleek PIN verification lock.
  - Centered luxury card with 4-digit PIN input, keypad, and shake animation on wrong PIN.
  - Default PIN: `1234`. Session stored securely in `sessionStorage` with Lock/Logout option.

  #### 2. Master Queue Switch & Business Hours Control
  - Master switch: **Online Queue: [ OPEN / CLOSED ]**.
  - When closed: disables online joining on `/` and `/join` while keeping reception walk-in active. Broadcasts via Socket.io.

  #### 3. Service Management (Add, Edit, Toggle)
  - Full CRUD modal for services (EN & GU name, duration in minutes, price in ₹, active toggle).

  #### 4. Barber Management (Add, Edit, On-Duty Toggle)
  - Staff panel with on-duty toggle. Toggling off removes them from wait time math and call-next rotation.

  #### 5. Today's Analytics & Stats Cards
  - Cards for: Customers Served, Average Wait Time, No-Show Count, and Today's Estimated Revenue.

  #### 6. Backend API Endpoints & DB Updates (`server/`)
  - `POST /api/admin/verify-pin`, `GET /api/admin/stats`, `POST /api/admin/queue-toggle`, CRUD for `/api/services` and `/api/barbers`.
  ```
* **Outcome:** Owner settings dashboard operational. Toggling master switch instantly updated Home and Join screens via WebSockets.
* **Failed Attempt / Bug:** When an owner edited a service's price, existing tickets in the queue had their historical pricing unexpectedly recalculated in backend aggregations.
* **Fix Applied:** Snapshot service names and prices inside each `QueueTicket` at creation time, preserving historical accuracy while allowing real-time catalog edits.

---

## Phase 7: Edge Cases, Gujarati Localization & Full Verification

### Prompt 7: Rules, Edge Cases, Gujarati Polish & Full Verification

* **Timestamp / Step:** Step 7
* **Objective:** Enforce all queue edge cases (strict state machine, no-show re-queue at end of line, on-break customer alerts, accurate wait time formula, 30-min auto-close), audit 100% Gujarati localization, and execute the 10-point lab verification checklist.
* **Prompt Text:**
  ```markdown
  You are a Senior QA Engineer and Frontend Architect.

  In this step, implement all edge cases and queue rules specified in `docs/03-flows-rules.md`, polish empty states and Gujarati translations, ensure touch target accessibility (>= 44px), and execute the full lab verification checklist.

  #### 1. Implement Strict Queue Rules & Edge Cases
  1. Strict Status State Machine: `waiting` -> `called` -> `in-chair` -> `done`. Abort paths: `cancelled`, `no-show`.
  2. Re-Adding No-Show Customers: Must be placed at the end of the queue with a fresh token.
  3. Barber On-Break Experience: Customers who chose an on-break barber see an amber notification on `/status/:id`.
  4. Dynamic Wait Time Formula: ceil(total service minutes ahead / active barbers).
  5. Auto-Close Online Queue 30 Minutes Before Closing.
  6. Friendly Empty States for Home, Reception, and TV display.

  #### 2. Bilingual Polish (English & Gujarati)
  - Audit all 7 screens in Gujarati (`gu`). Zero untranslated text, no layout overflow, natural typography.

  #### 3. Mobile Touch & Usability Polish
  - Enforce >= 44px touch targets across all mobile viewports.

  #### 4. Lab Verification Checklist (Run & Report)
  - Execute tests against the 10 criteria from the lab handout and output a clear `[Pass / Fail]` report.
  ```
* **Outcome:** All 10 verification checklist tests passed. Full Gujarati translation dictionary completed with seamless switching.
* **Failed Attempt / Bug:** In Gujarati mode, the circular progress timer badge broke onto two lines due to longer Gujarati string length (`અંદાજિત પ્રતીક્ષા સમય`).
* **Fix Applied:** Adjusted font scaling in CSS using `clamp()` and container queries so text dynamically scales down on smaller circular displays.

---

## Phase 8: Production Deployment, CORS & Resilience Iterations

### Prompt 8: Production CORS & Render Cold-Start Resilience

* **Timestamp / Step:** Post-Verification Deployment (Commit `2fafe9c`)
* **Objective:** Resolve cross-origin resource sharing (CORS) rejections between Vercel frontend and Render backend, and eliminate timeout failures caused by Render free-tier cold-starts.
* **Prompt Text:**
  ```markdown
  Our production deployment has the client hosted on Vercel and the backend hosted on Render.
  1. Address CORS origin errors: allow requests from Vercel production domains, preview domains (*.vercel.app), and localhost.
  2. Address Render cold-start latency (50-60s delay on spin-up):
     - Implement exponential backoff retry in `client/src/services/api.js`.
     - Add a lightweight health check ping on app mount.
     - Display an unobtrusive "Waking up server..." status toast instead of a crash/error screen if the initial fetch takes longer than 3 seconds.
  3. Ensure WebSocket connection handles reconnection gracefully with auto-reconnect fallback.
  ```
* **Outcome:** Added dynamic origin checking in Express `corsOptions`. Added 3-stage retry logic in Axios/Fetch client with server wakeup banner.

---

### Prompt 9: Mobile Ergonomics & Responsive Polish

* **Timestamp / Step:** Final Mobile Polish (Commit `634b7f7`)
* **Objective:** Guarantee flawless mobile phone usability across iPhone SE (375px), iPhone 14/15/16 (390-430px), and modern Android devices.
* **Prompt Text:**
  ```markdown
  Audit and optimize mobile phone experience across all 7 screens:
  1. Add a mobile-friendly bottom navigation dock (`MobileNavDock.jsx`) for quick role switching and status checking.
  2. Optimize Reception dashboard so that it provides a tabbed view on mobile (Switch between "Barber Stations" and "Queue List") while preserving side-by-side view on desktop/tablet.
  3. Ensure all modals (Walk-in, Cancel, Service Form) have scrollable bodies and sticky action buttons for short phone screens.
  4. Ensure touch targets meet WCAG 2.1 AA (>= 44px x 44px) on all cards, buttons, and toggles.
  ```
* **Outcome:** Reception view dynamically toggles between tabbed mode on `< 992px` and side-by-side mode on `>= 992px`. Added `MobileNavDock.jsx`. Clean mobile testing across 375px to 430px screens.

---

## Verification & Prompt Engineering Summary

| Phase / Prompt | Primary Focus | Challenges Addressed | Verification Status |
| :--- | :--- | :--- | :--- |
| **Prompt 1** | Scaffolding & Docs | Architecture structuring & rule encoding | ✅ Pass |
| **Prompt 2** | Home & Join Screens | Phone duplicate handling & 3-service cap | ✅ Pass |
| **Prompt 3** | Status Tracking | Web Audio autoplay & SVG timer math | ✅ Pass |
| **Prompt 4** | Reception Dashboard | Strict barber preference matching algorithm | ✅ Pass |
| **Prompt 5** | Barber & TV Views | SVG vector avatar system & TV sound debounce | ✅ Pass |
| **Prompt 6** | Owner Admin Panel | PIN lock security & pricing data snapshots | ✅ Pass |
| **Prompt 7** | Rules & Gujarati Polish | Script overflow & 10-item lab verification | ✅ Pass (10/10) |
| **Prompt 8** | Deployment Resilience | Render cold starts & Vercel CORS configuration | ✅ Pass |
| **Prompt 9** | Mobile Usability | Viewport responsiveness & bottom nav dock | ✅ Pass |
