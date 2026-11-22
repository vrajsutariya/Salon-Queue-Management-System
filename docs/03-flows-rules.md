# 03 - Queue Flows, Logic Rules & Verification Checklist

This document formalizes the state machine, matching algorithms, mathematical estimation formulas, edge case policies, and the end-to-end verification checklist for the **Salon Queue Management System**.

---

## 1. Queue State Machine & Transitions

Every customer entry in the queue transitions through a strict, deterministic sequence of statuses:

```
[ Customer Joins ]
        │
        ▼
   ( WAITING )  ◀──────┐
        │               │ (Push back / Retry)
        ▼               │
    ( CALLED )  ────────┘
        │
        ├────────────────────────┐
        ▼                        ▼
   ( IN_CHAIR )             ( NO_SHOW )
        │                 (after 10 mins)
        ▼
     ( DONE )
```

### State Definitions:
1. **`WAITING`**:
   - Customer is registered in line, either in the waiting lounge or nearby.
   - Position and estimated wait time are calculated and displayed.
2. **`CALLED`**:
   - Barber or receptionist clicks "Call Customer".
   - Audio alert triggers on Waiting Area TV (`/display`).
   - Customer's "My Status" screen displays flashing notification with station instructions.
   - 10-minute countdown starts automatically.
3. **`IN_CHAIR`**:
   - Customer arrives at the barber station and sits down.
   - Barber marks "Customer Arrived / Start Service".
   - Service timer starts tracking elapsed minutes.
4. **`DONE`**:
   - Barber finishes the cut/treatment and marks "Service Complete".
   - Ticket is closed and removed from active wait queues; recorded in daily completion stats.
5. **`NO_SHOW`**:
   - Customer fails to report to the chair within 10 minutes of being called.
   - Barber or receptionist marks "No-Show"; slot is forfeited and next client is called.
6. **`CANCELLED`**:
   - Customer leaves queue voluntarily or receptionist cancels erroneous entry.

---

## 2. Barber Matching & Assignment Logic

### Barber Preferences:
- When joining the queue, the customer specifies either:
  1. **Specific Barber** (e.g., "Rahul")
  2. **Any Barber** (Fastest available)

### Matching Rules:
1. **Specific Barber Preference**:
   - The ticket enters that specific barber's dedicated queue.
   - Only that barber (or a receptionist assigning them) can call the ticket.
   - Wait time is calculated specifically based on services pending in that specific barber's queue.
2. **"Any Barber" Preference (Load Balancing)**:
   - "Any Barber" tickets form a flexible shared pool.
   - When **any** on-duty barber finishes their current chair service and becomes available, they automatically draw the earliest `WAITING` ticket from either their own requested queue or the top of the "Any Barber" pool.
   - Priority rule: If an "Any Barber" customer joined earlier than a specific request, the next available barber calls the "Any Barber" customer first to guarantee fair first-come, first-served (FIFO) turnaround.

---

## 3. Wait Time Estimation Formula

Wait times must update dynamically as tickets move through states or active staff changes.

### Mathematical Formula:
$$\text{Estimated Wait Time (mins)} = \frac{\sum_{i \in \text{Ahead}} \text{Duration}(i)}{\text{Active On-Duty Barbers}}$$

### Variables & Implementation Rules:
- $\sum_{i \in \text{Ahead}} \text{Duration}(i)$: The total sum of service durations (in minutes) of all customers ahead of the target customer who have status `WAITING` or `CALLED`.
- $\text{Active On-Duty Barbers}$: The number of currently logged-in, on-duty barbers (minimum clamp: 1).
- **In-Chair Adjustment**: For customers currently `IN_CHAIR`, the remaining time is approximated as:
  $$\text{Remaining}(c) = \max(0, \text{TotalDuration}(c) - \text{ElapsedMinutes}(c))$$
- For a customer with a **Specific Barber** preference, the calculation is localized to that barber only:
  $$\text{Estimated Wait Time (Specific)} = \text{Remaining Chair Time} + \sum \text{Durations of queued clients ahead for this barber}$$

---

## 4. 10-Minute No-Show Rule Policy

To prevent queue stalls when customers leave the premises without cancelling:
1. When a customer is marked `CALLED`, a 10-minute timer starts.
2. The customer's mobile view and the receptionist dashboard display the countdown badge.
3. If the timer expires (reaches 00:00) and the client has not arrived:
   - Receptionist / Barber view highlights the row in red alert.
   - One-click option to:
     - **Mark No-Show**: Closes the ticket with status `NO_SHOW`.
     - **Push Back 5 Mins**: Keeps them waiting at the back of the current active queue if client texted or is nearby.
   - The system automatically frees the barber station to call the next awaiting patron.

---

## 5. The 8-Item Verification Checklist

Before releasing or grading the system, all 8 criteria must be verified across multiple browsers/devices:

| # | Test Scenario | Acceptance Criteria |
|---|---------------|---------------------|
| 1 | **Customer Registration (`/join`)** | Form accepts valid name, 10-digit phone, services, and barber preference. Generates unique ticket and redirects smoothly to `/status/:id`. |
| 2 | **Live Mobile Status (`/status/:id`)** | Shows real-time queue position, estimated wait time, service details, and updates immediately when status changes. |
| 3 | **Reception Desk Controls (`/reception`)** | Shows full table of active clients; enables manual walk-in entry; allows 1-click status updates (`Call`, `In Chair`, `Done`, `No-Show`). |
| 4 | **Barber Station Workflow (`/barber/:name`)** | Barber can see dedicated queue, call next customer, view service details, and mark service done. |
| 5 | **Waiting Area TV Sync (`/display`)** | TV display shows high-contrast "Now Serving" vs "Up Next". Plays audible chime and flashes screen when a customer is called. |
| 6 | **Real-Time Multi-Device Sync** | Status changes made on Receptionist tablet reflect instantaneously (< 500ms) on Customer Mobile, Barber Station, and TV Display without page reload. |
| 7 | **Bilingual Localization (EN / GU)** | Language toggle switch in header switches all visible labels and statuses between English and Gujarati without crashing. |
| 8 | **No Prohibited Features** | Zero traces of online payment gateways, SMS APIs, calendar scheduling, or multi-branch code. |
