export interface StudentSession {
  user_id: string;
  roll_number: string;
  full_name: string;
  email: string;
  is_first_login: boolean;
  has_consented: boolean;
  has_completed_setup: boolean;
}

export interface MealTimesConfig {
  breakfast: string; // "08:00"
  lunch: string;     // "13:00"
  dinner: string;    // "20:00"
}

export interface StudentProfileData {
  id: string;
  roll_number: string;
  full_name: string;
  department: string;
  branch?: string;
  year: number;
  hostel_status: 'Hosteler' | 'Day Scholar';
  hostel_name?: string;
  room_number?: string;
  allergies: string[];
  meal_times: MealTimesConfig;
  emergency_contact: string;
  language: 'en' | 'te';
}

export interface DoseScheduleRecord {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dose: string;
  scheduled_time: string; // ISO string or "HH:mm"
  scheduled_at?: string;
  time?: string;
  slot?: string;
  tablets?: number;
  meal_slot: 'breakfast' | 'lunch' | 'dinner' | string;
  meal_relation: 'before' | 'after';
  status: 'scheduled' | 'taken' | 'taken_late' | 'not_taken' | 'unconfirmed';
  confirmed_at?: string;
  notification_id?: string;
  second_reminder_id?: string;
}

export interface PrescriptionRecord {
  id: string;
  doctor_name: string;
  problem_category: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  medicines: {
    name: string;
    dose: string;
    meal_relation: 'before' | 'after';
    meal_slot: string;
    duration_days: number;
  }[];
}

export interface RecoveryInquiry {
  id: string;
  visit_id: string;
  problem_name: string;
  due_date: string;
  status?: 'better' | 'same' | 'worse';
  answered_at?: string;
}

export interface OfflineActionItem {
  id: string;
  type: 'DOSE_RESPONSE' | 'RECOVERY_RESPONSE' | 'SIDE_EFFECT_REPORT' | 'MEAL_TIMES_UPDATE' | 'LANGUAGE_UPDATE';
  payload: Record<string, unknown>;
  created_at: string;
}
