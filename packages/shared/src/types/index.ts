import { AlertLevel, DoseStatus, MealRelation, MealType, RecoveryStatus, UserRole } from '../constants';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface MealTimesConfig {
  breakfast: string; // HH:mm format
  lunch: string;
  dinner: string;
}

export interface UserProfile extends BaseEntity {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface StudentProfile extends BaseEntity {
  user_id: string;
  roll_number: string;
  department: string;
  year: number;
  hostel_status: 'hosteler' | 'day_scholar';
  hostel_name?: string;
  room_number?: string;
  emergency_phone: string;
  meal_times: MealTimesConfig;
  allergies?: string[];
  consent_given: boolean;
}

export interface StaffProfile extends BaseEntity {
  user_id: string;
  designation: string;
  department?: string;
  license_number?: string;
}

export interface MedicineEntry {
  medicine_name: string;
  dose: string;
  times_per_day: number;
  meal_relation: MealRelation;
  meal_slots: MealType[];
  number_of_days: number;
  instructions?: string;
}

export interface VisitRecord extends BaseEntity {
  doctor_id: string;
  student_id: string;
  roll_number: string;
  problem_category: string;
  clinical_notes?: string;
  vitals?: {
    blood_pressure?: string;
    pulse?: number;
    temperature_f?: number;
    spo2?: number;
  };
  medicines: MedicineEntry[];
}

export interface DoseScheduleItem extends BaseEntity {
  visit_id: string;
  student_id: string;
  medicine_name: string;
  dose: string;
  meal_slot: MealType;
  meal_relation: MealRelation;
  scheduled_time: string; // ISO string
  status: DoseStatus;
  confirmed_at?: string;
}

export interface RecoveryCheckRecord extends BaseEntity {
  visit_id: string;
  student_id: string;
  doctor_id: string;
  scheduled_for: string; // Day after course ends
  status?: RecoveryStatus;
  side_effects_reported?: string;
  alert_triggered: boolean;
  alert_level?: AlertLevel;
  answered_at?: string;
}

export interface AlertRecord extends BaseEntity {
  alert_level: AlertLevel;
  student_id: string;
  roll_number: string;
  student_name: string;
  doctor_id: string;
  doctor_name: string;
  visit_id: string;
  reason: string;
  recovery_status?: RecoveryStatus;
  side_effects?: string;
  status: 'active' | 'under_review' | 'resolved';
  resolved_by?: string;
  resolved_at?: string;
}

export interface CallLogRecord extends BaseEntity {
  alert_id: string;
  officer_id: string;
  student_id: string;
  called_at: string;
  outcome: 'reached' | 'unreachable' | 'call_back_requested' | 'emergency_escalated';
  officer_notes: string;
}

export interface ConsentRecord extends BaseEntity {
  student_id: string;
  roll_number: string;
  version: string;
  ip_address?: string;
  consented_at: string;
}

export interface AuditLogRecord extends BaseEntity {
  actor_id: string;
  actor_role: UserRole;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'CALL_LOG';
  resource_type: string;
  resource_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
}
