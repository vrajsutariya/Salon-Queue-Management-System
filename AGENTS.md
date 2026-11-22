# Salon Queue Management System - Developer & Agent Guidelines

## 1. Project Overview & Tech Stack
The **Salon Queue Management System** is a real-time, multi-device queue coordination platform engineered for modern walk-in salons based on MSc IT Vibe Coding Lab specifications.

### Technology Stack:
- **Frontend**: React (Vite build tool), Bootstrap 5 (grid & responsiveness), Bootstrap Icons / Lucide, Socket.io Client.
- **Backend**: Node.js, Express.js REST API, Mongoose (MongoDB ODM), Socket.io Server (bidirectional real-time state synchronization).
- **Architecture**: Decoupled Client-Server repository with shared domain schemas and status definitions.
- **Target Devices**: Mobile phones (customers), Tablets/Laptops (reception & barbers), Large screens/Smart TVs (waiting area public display).

---

## 2. Core Development Rules & Standards

### A. Clean Code & Senior Standards
- Write modular, readable, self-documenting JavaScript / React components.
- Keep components focused on a single responsibility; extract reusable primitives (e.g., StatusBadge, QueueCard, LanguageSwitch, TimerBadge).
- Prop validation or clear defaults must be used across all components.
- Handle edge cases gracefully (empty queues, network disconnections, reconnection states, invalid IDs).

### B. Responsive & Accessible Design (Mobile-First)
- Use Bootstrap 5 grid, containers, and flexbox utilities for mobile-first layouts.
- Follow semantic HTML5 standards (`<main>`, `<section>`, `<header>`, `<article>`, `<nav>`).
- Adhere to WCAG 2.1 AA accessibility guidelines: proper contrast ratios, ARIA live regions for real-time status updates on screen readers, keyboard navigability, and clear focus states.

### C. Theme & Styling Guidelines (Strict CSS Variables)
- **Aesthetic**: Premium Dark Luxury Salon atmosphere.
- **Rule**: **NEVER hardcode hex/rgb colors** in JSX, inline styles, or component CSS. Always reference design token CSS variables.
- Standard Theme Variables:
  ```css
  :root {
    /* Backgrounds */
    --bg-charcoal: #1F2937;
    --bg-dark: #111827;
    --bg-card: #2D3748;
    --bg-card-hover: #374151;
    --bg-input: #1A202C;

    /* Accents */
    --accent-gold: #D4A017;
    --accent-gold-hover: #B8860B;
    --accent-gold-light: rgba(212, 160, 23, 0.15);

    /* Text */
    --text-main: #F9FAFB;
    --text-muted: #9CA3AF;
    --text-dark: #111827;

    /* Borders */
    --border-color: #374151;
    --border-focus: #D4A017;

    /* Statuses */
    --status-waiting: #F59E0B;
    --status-called: #3B82F6;
    --status-in-chair: #10B981;
    --status-done: #6B7280;
    --status-noshow: #EF4444;
  }
  ```

### D. Animations & Transitions
- Use lightweight, performant CSS transforms and opacity transitions.
- Strictly support `@media (prefers-reduced-motion: reduce)` to disable non-essential animations for users with vestibular sensitivities.
- Subtle entrance animations for queue list additions and status changes.

### E. Internationalization & Localization (EN / GU)
- Provide dual-language support: **English (EN)** and **Gujarati (GU)**.
- **Rule**: Never hardcode English strings directly inside UI components.
- Centralize all strings in a translation dictionary (`client/src/locales/translations.js`) and access them through a shared `LanguageContext`.
- Ensure language toggle is accessible in the global header across all screens.

### F. Single Source of Truth
- Queue statuses, service lists, and calculation rules must follow a unified contract between client and server.
- The standard Queue States:
  - `WAITING`: In line, awaiting turn.
  - `CALLED`: Barber has called the customer to the chair.
  - `IN_CHAIR`: Service actively in progress.
  - `DONE`: Service finished and customer checked out.
  - `NO_SHOW`: Customer did not arrive within 10 minutes of being called.
  - `CANCELLED`: Cancelled by customer or receptionist.

### G. Strict "Don't Build" List
Per project specification, **DO NOT BUILD** the following features:
1. ❌ **No online payment integrations** (e.g., Stripe, Razorpay, UPI gateway). Walk-ins pay offline at desk.
2. ❌ **No future appointment booking** (today's live walk-in queue only).
3. ❌ **No external SMS or WhatsApp APIs** (Twilio, Gupshup, etc.). Real-time communication happens via WebSockets and screen updates.
4. ❌ **No loyalty programs, reward points, or discount promo codes**.
5. ❌ **No multi-branch / multi-tenant franchise architecture**. Single-location salon focus.

---

## 3. Directory Layout
```
salon-queue/
├── AGENTS.md                  # Development standards and guidelines
├── docs/
│   ├── 01-brief.md            # Problem statement, roles, features & constraints
│   ├── 02-screens.md          # In-depth UX/UI specs for 7 screens
│   └── 03-flows-rules.md      # State machine, matching, wait time math, checklist
├── client/                    # React + Vite + Bootstrap frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── locales/
│       ├── pages/
│       ├── styles/
│       ├── App.jsx
│       └── main.jsx
└── server/                    # Node.js + Express + MongoDB + Socket.io backend
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── config/
    ├── models/
    ├── routes/
    ├── controllers/
    └── sockets/
```
