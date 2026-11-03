export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
};

// Timing offsets in minutes:
// after = meal time + 30 minutes, before = meal time - 30 minutes
export const BEFORE_MEAL_OFFSET_MINUTES = -30;
export const AFTER_MEAL_OFFSET_MINUTES = 30;

export const MISSED_DOSE_ADVISORY =
  'Never double up on a missed dose. Follow your prescription directions or contact your doctor for guidance.';

export const EMERGENCY_CONTACTS = {
  CAMPUS_CLINIC: '+91-120-2983555',
  HEALTH_OFFICER: '+91-9876543210',
  OPD_DOCTOR: '+91-9876543211',
};

/**
 * Format any ISO timestamp or HH:mm time string into friendly 12-hour AM/PM format (Asia/Kolkata / Local Time).
 * Handles:
 * - ISO string: "2026-11-03T01:50:00.000Z" -> "07:20 AM"
 * - 24h string: "13:20" -> "01:20 PM"
 * - "07:20" -> "07:20 AM"
 */
export function formatTime12h(timeOrIso?: string | null): string {
  if (!timeOrIso) return '--:--';

  // 1. If it's an ISO timestamp (e.g. contains 'T' or 'Z' or '-')
  if (timeOrIso.includes('T') || timeOrIso.includes('-') || timeOrIso.includes('Z')) {
    const d = new Date(timeOrIso);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 hour should be 12
      const strH = hours < 10 ? `0${hours}` : `${hours}`;
      const strM = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${strH}:${strM} ${ampm}`;
    }
  }

  // 2. If it's a 24-hour "HH:MM" or "HH:MM:SS" time string
  if (timeOrIso.includes(':')) {
    const parts = timeOrIso.split(':').map((p) => parseInt(p, 10));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      let hours = parts[0];
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strH = hours < 10 ? `0${hours}` : `${hours}`;
      const strM = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${strH}:${strM} ${ampm}`;
    }
  }

  return timeOrIso;
}
