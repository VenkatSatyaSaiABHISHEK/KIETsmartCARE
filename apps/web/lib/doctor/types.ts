export interface StudentSearchResult {
  id: string;
  roll_number: string;
  name: string;
  branch: string;
  year: number;
}

export interface StudentFullProfile {
  id: string;
  roll_number: string;
  name: string;
  branch: string;
  year: number;
  phone: string;
  hostel_status: 'Hosteler' | 'Day Scholar';
  hostel_name?: string;
  room_number?: string;
  avatar_url: string;
  allergies: string[];
  meal_times: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}

export interface VisitHistoryEntry {
  id: string;
  date: string;
  doctor_name: string;
  problem_category: string;
  notes?: string;
  medicines: {
    name: string;
    dose: string;
    duration: string;
  }[];
  outcome: 'recovered' | 'not_recovered' | 'active';
}

export interface MedicineCatalogItem {
  id: string;
  name: string;
  default_dose: string;
  category: string;
  stock_quantity: number;
  allergy_keywords: string[];
}

export interface PrescriptionRow {
  id: string;
  medicine_name: string;
  dose: string;
  times_per_day: number;
  meal_relation: 'before' | 'after';
  meal_slots: ('breakfast' | 'lunch' | 'dinner')[];
  number_of_days: number;
  quantity_handed_over: number;
  instructions?: string;
}

export interface PrescriptionPreset {
  id: string;
  name: string;
  problem: string;
  notes?: string;
  medicines: Omit<PrescriptionRow, 'id'>[];
}

export interface TodayPatientItem {
  id: string;
  roll_number: string;
  student_name: string;
  branch: string;
  problem: string;
  time: string;
  status: 'alarms_active' | 'doses_confirmed' | 'recovered';
}

export interface DoctorAlertItem {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  problem: string;
  reason: 'Same' | 'Worse' | 'Side effect';
  side_effects_reported?: string;
  time: string;
  acknowledged: boolean;
  priority: 'red';
}

export interface DaySchedulePreviewItem {
  dayNumber: number;
  dateStr: string;
  slots: {
    meal: 'breakfast' | 'lunch' | 'dinner';
    timeStr: string;
    relation: 'before' | 'after';
    medicines: {
      name: string;
      dose: string;
    }[];
  }[];
}

export interface VisitSubmissionPayload {
  student_id: string;
  roll_number: string;
  problem_category: string;
  clinical_notes?: string;
  medicines: PrescriptionRow[];
  follow_up_date?: string;
}
