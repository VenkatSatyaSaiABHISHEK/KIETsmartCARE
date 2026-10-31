export const USER_ROLES = ['admin', 'doctor', 'officer', 'student'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_RELATIONS = ['before', 'after'] as const;
export type MealRelation = (typeof MEAL_RELATIONS)[number];

export const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
};

// Timing offsets in minutes:
// after = meal time + 30 minutes, before = meal time - 30 minutes
export const BEFORE_MEAL_OFFSET_MINUTES = -30;
export const AFTER_MEAL_OFFSET_MINUTES = 30;

export const DOSE_STATUSES = ['scheduled', 'taken', 'taken_late', 'not_taken', 'unconfirmed'] as const;
export type DoseStatus = (typeof DOSE_STATUSES)[number];

export const RECOVERY_STATUSES = ['better', 'same', 'worse', 'side_effect', 'no_response'] as const;
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];

export const ALERT_LEVELS = ['red', 'yellow', 'info'] as const;
export type AlertLevel = (typeof ALERT_LEVELS)[number];

export const ALERT_TRIGGERS = {
  RED: ['same', 'worse', 'side_effect'] as const,
  YELLOW: ['no_response'] as const,
};

export const MISSED_DOSE_ADVISORY =
  'Never double up on a missed dose. Follow your prescription directions or contact your doctor for guidance.';

export const ROLE_ROUTE_MAP: Record<UserRole, string> = {
  admin: '/admin',
  doctor: '/doctor',
  officer: '/officer',
  student: '/student',
};

export const EMERGENCY_CONTACTS = {
  CAMPUS_HEALTH_CENTRE: '+91-120-2983555',
  AMBULANCE: '108',
  EMERGENCY_NATIONAL: '112',
};

export const STORAGE_BUCKETS = {
  PRESCRIPTIONS: 'prescriptions',
  MEDICAL_RECORDS: 'medical-records',
  AUDIT_EXPORTS: 'audit-exports',
} as const;
