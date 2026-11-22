# 01 - Project Brief & Specifications

## 1. Executive Summary & Problem Statement
Traditional walk-in barbershops and salons suffer from chaotic lobby management, unpredictable customer wait times, frustrated customers pacing the waiting area, and overburdened receptionists juggling verbal queues and paper clipboards. Barbers frequently lose track of who is next or whether a client has specific preferences.

The **Salon Queue Management System** is a real-time, responsive multi-device digital solution that transforms walk-in operations:
- Customers can join the digital queue either via self-service QR/mobile or via the receptionist.
- Customers track their live position and estimated wait times on their own mobile devices.
- Receptionists gain full visibility and control over arrivals, chair assignments, and cancellations.
- Barbers see their immediate queue and client service preferences on a dedicated station view.
- A high-contrast waiting area TV display keeps the lobby peaceful and informed with real-time audio-visual notifications.

---

## 2. User Roles & Personas

### 1. Customer
- **Context**: Walk-in patron arriving at the salon or checking wait times nearby.
- **Goals**: Join the queue smoothly, choose specific services (haircut, beard trim, hair wash, facial, etc.), choose a preferred barber (or select "Any available"), and track real-time queue position with dynamic wait time updates.
- **Key Device**: Smartphone / Mobile web browser.

### 2. Receptionist
- **Context**: Front desk staff managing arrivals, walk-in queries, phone calls, and salon lobby flow.
- **Goals**: Rapidly enter walk-in customers who do not have smartphones, override/reorder queue entries, call customers to chairs, mark no-shows, assign barbers, and monitor overall floor capacity.
- **Key Device**: Reception tablet or desktop monitor.

### 3. Barber
- **Context**: Station stylist / barber focused on serving clients without being distracted by phone calls or administrative tasks.
- **Goals**: Check their individual station queue (`/barber/:name`), call their next client, transition customer to "In chair", view requested service details & duration, and mark the service "Done" upon completion.
- **Key Device**: Tablet or mobile device mounted at the styling station.

### 4. Owner / Admin
- **Context**: Salon owner monitoring shop health, operational velocity, and staff performance.
- **Goals**: Configure active services with prices and durations, manage barber roster and availability status, toggle shop open/closed status, inspect daily queue throughput, and manage queue resets.
- **Key Device**: Laptop, tablet, or desktop browser.

---

## 3. Core Feature Requirements (7 Screens)

1. **Home (`/`)**:
   - Modern brand landing page with live shop status indicator (Open/Closed).
   - Real-time lobby waiting counter (e.g., "4 clients currently in line").
   - Quick navigation shortcuts: "Join the Queue", "View Waiting Display", "Reception Portal", "Barber Login", and "Admin Settings".

2. **Join Queue (`/join`)**:
   - Customer self-registration form: Name, Phone Number.
   - Multi-select service picker displaying service name, estimated duration, and pricing.
   - Barber preference selector (Dropdown: "Any Barber (Fastest)" or specific named barbers).
   - Summary calculation showing total duration and immediate wait estimation before confirmation.
   - Direct redirect to personal "My Status" page upon submission.

3. **My Status (`/status/:id`)**:
   - Personalized live tracking card.
   - Big numerical badge indicating "Position in Queue".
   - Dynamic estimated wait time (in minutes) updating in real-time.
   - Service summary, assigned/requested barber, and current status (`Waiting`, `Called`, `In Chair`, `Done`).
   - Visual alert banner when called to chair with instruction to proceed to designated barber station.
   - Action to cancel spot if customer decides to leave.

4. **Reception Dashboard (`/reception`)**:
   - Complete live queue overview sorted by sequence and priority.
   - Rapid walk-in entry modal for front-desk staff.
   - One-click status triggers: Call Customer, Start Service (In chair), Complete (Done), Mark No-Show.
   - Ability to reassign barber or modify customer services.
   - Filter views: All, Waiting, In Progress, Completed Today.

5. **Barber Station View (`/barber/:name`)**:
   - Dedicated station view personalized to the logged-in barber.
   - Prominent "Now In Chair" section showing client name, services, elapsed time, and "Finish Service" button.
   - "Next Up" queue of customers matched to this barber (or unassigned "Any" clients).
   - "Call Next Customer" trigger that notifies the lobby TV and customer screen.

6. **Waiting Area TV Display (`/display`)**:
   - Fullscreen 1080p/4K TV optimized dashboard with 10-foot UI styling.
   - High contrast split layout:
     - Left: "Now Serving" (Barber name, Station number, Customer ticket/name).
     - Right: "Up Next" waiting list showing ticket numbers and estimated call times.
   - Audio chime and visual flash animation triggered whenever a client is "Called".

7. **Owner / Admin Settings (`/admin`)**:
   - Manage Barbers: Add/edit barbers, toggle active/on-duty status.
   - Manage Services: Add/edit services, set duration in minutes, and base pricing.
   - Salon Operations: Toggle salon open/closed, adjust default pacing, reset daily queue.
   - Real-time Analytics: Total customers served today, average wait time, average service duration.

---

## 4. Strict "Don't Build" List
To keep the MVP tightly focused on the core problem of walk-in queue flow and real-time synchronization, the following features are strictly prohibited:
1. ❌ **No Online Payment Gateways**: No Stripe, Razorpay, PayPal, or card checkout. Payments are handled physically in the shop.
2. ❌ **No Future Bookings / Calendars**: No calendar scheduling, tomorrow bookings, or recurring appointments. Strictly current-day walk-in queue.
3. ❌ **No SMS or WhatsApp Cloud APIs**: No Twilio, Sinch, or Meta WhatsApp API keys required. All updates are delivered via WebSockets directly to the web client.
4. ❌ **No Loyalty / Points / Coupon Systems**: No complex discount codes or customer membership tiers.
5. ❌ **No Multi-Branch / Multi-Tenancy**: Single-location architecture; no corporate organization hierarchies.

---

## 5. Theme & Design Language
- **Brand Style**: Luxury, modern barbershop / executive salon atmosphere.
- **Palette**: Deep charcoal background (`--bg-charcoal: #1F2937;`, `--bg-dark: #111827;`) paired with brushed metallic gold highlights (`--accent-gold: #D4A017;`).
- **Typography & UI**: High-legibility sans-serif, clean borders (`#374151`), rounded cards (`border-radius: 12px`), and subtle glassmorphic elevation.
- **Multi-Device Adaptability**: Scalable responsive layouts adapting effortlessly from a 360px mobile viewport to an 85-inch 4K lobby monitor.
