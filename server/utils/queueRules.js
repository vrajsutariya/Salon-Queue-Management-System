/**
 * Queue Rules & State Machine Helper Functions
 * Crown & Blade Salon Queue Management System
 */

/**
 * Valid state transitions for the salon queue state machine:
 * waiting -> called -> in-chair -> done
 * Abort paths: waiting -> cancelled; called -> no-show
 */
export const ALLOWED_TRANSITIONS = {
  waiting: ['called', 'cancelled'],
  called: ['in-chair', 'no-show'],
  'in-chair': ['done'],
  done: [],
  cancelled: [],
  'no-show': [],
};

/**
 * Validates whether a state transition from `currentStatus` to `nextStatus` is permitted.
 */
export function isValidTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

/**
 * Parses salon closing time (e.g. "9:00 PM", "9 PM", "21:00") and determines
 * if the current time is within 30 minutes of closing (or past closing).
 *
 * @param {string} closingTimeStr - e.g. "9:00 PM"
 * @param {Date} [now=new Date()] - current reference time
 * @returns {{ isAutoClosed: boolean, minutesToClose: number|null, closingTime: string }}
 */
export function checkAutoCloseStatus(closingTimeStr = '9:00 PM', now = new Date()) {
  if (!closingTimeStr || typeof closingTimeStr !== 'string') {
    return { isAutoClosed: false, minutesToClose: null, closingTime: '9:00 PM' };
  }

  const clean = closingTimeStr.trim();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) {
    return { isAutoClosed: false, minutesToClose: null, closingTime: clean };
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const closingDate = new Date(now);
  closingDate.setHours(hours, minutes, 0, 0);

  const diffMs = closingDate.getTime() - now.getTime();
  const minutesToClose = Math.round(diffMs / 60000);

  // Auto-close strictly within the 30-minute window before closing (0 < minutesToClose <= 30)
  // If past closing or outside this specific window, do not auto-close
  const isAutoClosed = minutesToClose > 0 && minutesToClose <= 30;

  return {
    isAutoClosed,
    minutesToClose,
    closingTime: clean,
  };
}

/**
 * Computes estimated wait time in minutes according to the formal formula:
 * ceil( totalMinutesAhead / activeOnDutyBarbers )
 *
 * @param {number} totalMinutesAhead
 * @param {number} activeBarbersCount
 * @returns {number|null} estimated wait minutes, or null if no barbers available
 */
export function computeEstimatedWaitTime(totalMinutesAhead, activeBarbersCount) {
  if (activeBarbersCount <= 0) {
    return null; // edge case: no active barbers
  }
  return Math.ceil(Math.max(0, totalMinutesAhead) / activeBarbersCount);
}
