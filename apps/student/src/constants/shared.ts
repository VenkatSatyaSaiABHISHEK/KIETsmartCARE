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

