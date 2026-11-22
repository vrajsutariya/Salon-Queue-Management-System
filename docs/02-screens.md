# 02 - Screen Specifications & Layouts

This document details the layout, data requirements, user actions, responsive behavior, and real-time socket events for each of the 7 core screens in the **Salon Queue Management System**.

---

## 1. Screen 1: Home Landing Page (`/`)

### Purpose
Acts as the central gateway for customers, salon staff, and waiting area displays. Displays the live status of the salon at a glance.

### Key Layout Elements
- **Hero Header**: Salon branding ("Crown & Blade Salon"), operational status badge (`Open` / `Closed`), and current time.
- **Live Waiting Counter**: Large visual badge showing number of active clients waiting in lobby and estimated average wait.
- **Primary Call to Action (Customer)**: Prominent button `Join the Queue` linking to `/join`.
- **Quick Access Grid**:
  - `Customer Portal`: Join queue or check existing ticket.
  - `Reception Desk`: Front-desk control portal (`/reception`).
  - `Barber Stations`: Selector to jump to specific barber view (`/barber/:name`).
  - `Waiting Room TV`: Launch full-screen TV lobby board (`/display`).
  - `Owner Admin`: Access management console (`/admin`).
- **Global Navbar**: Salon logo, Language toggle (English / Gujarati), Theme toggle / status.

### Real-Time Socket Events
- `queue:updated`: Updates the live waiting counter without page refresh.
- `salon:status_changed`: Updates the Open/Closed status banner instantly.

---

## 2. Screen 2: Join Queue (`/join`)

### Purpose
Allows a walk-in customer to enter their details and join the digital queue from their own smartphone (or customer kiosk tablet).

### Form Inputs & Validation
- **Customer Name** *(Required)*: Text input (minimum 2 characters).
- **Phone Number** *(Required)*: 10-digit mobile number for identification and ticket lookup.
- **Service Selection** *(Multi-select)*: Checkbox / card-picker displaying available services (e.g., Haircut - 30m, Beard Trim - 15m, Hair Wash - 15m, Facial - 45m).
- **Barber Preference** *(Dropdown)*:
  - Option 1: `Any Barber (Fastest Available)` [Default]
  - Option 2+: Specific active barbers (e.g., "Rahul", "Amit", "Kunal").
- **Dynamic Preview Box**:
  - Selected services count & list.
  - Total duration (sum of service durations in minutes).
  - Estimated Wait Time calculated dynamically based on current queue ahead.
- **Submit Button**: `Join Queue Now` (with loading spinner during API submission).

### Flow on Submit
- Sends `POST /api/queue` with `{ name, phone, services, barberPreference }`.
- On success: Stores ticket ID in local storage for quick retrieval and redirects immediately to `/status/:id`.

---

## 3. Screen 3: My Status (`/status/:id`)

### Purpose
Dedicated personal tracking screen for the customer while waiting in the lobby or walking nearby.

### Visual Components
- **Ticket Header**: Ticket code (e.g., `#A-104`), Customer name, and timestamp joined.
- **Queue Progress Card**:
  - **Status Badge**: `Waiting` (Amber), `Called` (Blue - Flashing), `In Chair` (Emerald), or `Done` (Gray).
  - **Queue Position**: "You are #2 in line".
  - **Estimated Wait Time**: "Approx. 15 mins remaining" (countdown/recalculated on queue change).
  - **Assigned / Preferred Barber**: Name and station number.
- **Live Alert Banner**:
  - When status changes to `Called`: Vibrant banner + audio alert prompting: *"Please proceed to Station 2 - Barber Rahul is ready for you!"*
- **Action Buttons**:
  - `Leave Queue / Cancel`: Modal confirmation to release their spot.
  - `Refresh Status`: Manual fallback sync trigger.

### Real-Time Socket Events
- `queue:status_changed`: Updates the ticket status immediately when receptionist or barber calls the ticket.
- `queue:wait_updated`: Recalculates estimated wait time as clients ahead complete their services.

---

## 4. Screen 4: Receptionist Dashboard (`/reception`)

### Purpose
Command center for front-desk staff to manage all incoming walk-ins, chair assignments, and queue adjustments.

### Key Sections
- **Top Quick Stats Bar**:
  - Waiting Count, In Chair Count, Active Barbers Count, Avg Wait Time.
  - Fast Action: `+ Add Walk-In Customer` button (opens quick modal).
- **Live Queue Table / Cards**:
  - Columns: Ticket #, Customer Name, Phone, Selected Services, Barber Requested, Joined Time, Wait Time, Status, Actions.
  - Quick Action Buttons per row:
    - `Call` (transitions `Waiting` -> `Called`)
    - `Start Service` (transitions `Called` -> `In chair`)
    - `Complete` (transitions `In chair` -> `Done`)
    - `No-Show` (marks customer as no-show)
    - `Edit / Reassign` (change barber or service)
- **Barber Status Bar**:
  - Mini cards showing each barber's current status: `Available`, `Busy (Serving #A-102)`, or `Off-duty`.

### Real-Time Socket Events
- Listens to: `queue:joined`, `queue:updated`, `queue:status_changed`, `barber:status_changed`.
- Emits: State transition events when buttons are triggered.

---

## 5. Screen 5: Barber Station View (`/barber/:name`)

### Purpose
Tailored station interface for individual barbers on their mounted mobile/tablet device.

### Key Sections
- **Barber Profile Banner**:
  - Barber Name & Station Number.
  - Status toggle: `On-Duty` / `Taking a Break`.
- **Active Client in Chair**:
  - If busy: Displays client ticket, client name, services ordered, elapsed timer, and prominent button `Mark Service Done`.
  - If empty: Shows "Chair is Empty - Ready for Next Client".
- **Next Up In Line (Assigned to This Barber or 'Any')**:
  - Ordered list of waiting customers who specifically requested this barber or picked "Any".
  - Primary button: `Call Next Customer` (sets status to `Called`).
  - Option to mark `Customer Arrived` (`In chair`) or `No-Show` if they fail to appear.

### Real-Time Socket Events
- Automatically re-sorts and updates the station queue whenever a new customer joins or another barber takes an "Any" ticket.

---

## 6. Screen 6: Waiting Area TV Display (`/display`)

### Purpose
Public-facing, high-contrast, large-format screen designed for TV browsers and lobby monitors. Zero form controls; 100% read-only real-time broadcast.

### Layout & Visual Design
- **10-Foot UI Philosophy**: Oversized fonts, bold high-contrast badges, readable from 20+ feet away.
- **Dual Column Layout**:
  - **Left Column: NOW SERVING (50% width)**:
    - Large cards displaying: Station Number, Barber Name, Ticket Number, Customer First Name.
    - Highlighted with gold/emerald borders and subtle pulse animation.
  - **Right Column: UP NEXT (50% width)**:
    - Scrolling or paginated queue of the next 5-8 waiting tickets.
    - Shows: Ticket Number, Barber Preference, and estimated wait minutes.
- **Audio Chime System**:
  - Plays an audible chime tone whenever a ticket changes to `Called`.
  - On-screen flashing marquee: *"Ticket #A-104 Please proceed to Station 1"*.

---

## 7. Screen 7: Owner Admin Settings (`/admin`)

### Purpose
Administrative configuration interface for the salon owner to control services, staff, and overall operations.

### Key Sections
- **Salon Operational Controls**:
  - Master switch: `Salon Open` / `Salon Closed`.
  - Daily Reset Button: `Reset Queue for the Day` (archives active queue).
- **Service Catalog Management**:
  - Table of services (Name, Duration in mins, Price in ₹).
  - Add / Edit / Delete service items.
- **Barber Staff Management**:
  - Roster list of barbers (Name, Assigned Station #, Active/Inactive switch).
  - Add new barber / Remove barber.
- **Daily Performance Metrics**:
  - Total tickets created today.
  - Total tickets completed vs no-shows.
  - Average wait time and average chair duration.
