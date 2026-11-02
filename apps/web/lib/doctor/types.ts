import { ClinicalDoseSlot } from "@kiet-smart-care/shared";

export type ClinicalSlotName = "morning" | "afternoon" | "evening" | "night";

export interface PlannedTimelineSlot {
  id: string;
  slot_name: ClinicalSlotName;
  time_hhmm: string; // "08:00", "13:30", "17:00", "20:30"
  meal_relation: "before" | "after";
  day_offset: number; // 0 = today, 1 = tomorrow, etc.
  date_display: string; // "Today, Oct 31"
  target_date: string; // "YYYY-MM-DD"
  tablets: number;
  is_custom_time?: boolean;
}

export interface DoctorMedicinePrescription {
  id: string;
  medicine_id?: string;
  medicine_name: string;
  tablets_per_dose: number; // 1–3
  total_doses: number; // 1–7
  meal_relation: "before" | "after";
  instructions?: string;
  planned_timeline: PlannedTimelineSlot[];
}

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
  hostel_status: "Hosteler" | "Day Scholar";
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
  outcome: "recovered" | "not_recovered" | "active";
}

export interface MedicineCatalogItem {
  id: string;
  name: string;
  default_dose: string;
  category: string;
  stock_quantity: number;
  allergy_keywords: string[];
}

export interface TodayPatientItem {
  id: string;
  roll_number: string;
  student_name: string;
  branch: string;
  problem: string;
  time: string;
  status: "alarms_active" | "doses_confirmed" | "recovered";
}

export interface DoctorAlertItem {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  problem: string;
  reason: "Same" | "Worse" | "Side effect";
  side_effects_reported?: string;
  time: string;
  acknowledged: boolean;
  priority: "red";
}

export interface DaySchedulePreviewItem {
  dayNumber: number;
  dateStr: string;
  slots: {
    slot_name: ClinicalSlotName;
    timeStr: string;
    relation: "before" | "after";
    tablets: number;
    medicines: {
      name: string;
      dose: string;
      tablets?: number;
    }[];
  }[];
}

/**
 * Planned slot for submission — matches new DB schema field names.
 */
export interface PlannedSlotPayload {
  slot_name: ClinicalSlotName;
  scheduled_at: string; // ISO datetime
  meal_relation: "before" | "after";
  tablets: number;
}

export interface PrescriptionPreset {
  id: string;
  name: string;
  problem: string;
  notes?: string;
  medicines: any[];
}

export interface VisitSubmissionPayload {
  student_id: string;
  roll_number: string;
  problem_category: string;
  clinical_notes?: string;
  medicines: DoctorMedicinePrescription[];
  follow_up_date?: string;
}

export interface DoctorPatientRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm AM/PM
  roll_number: string;
  student_name: string;
  branch: string;
  year: number;
  problem: string;
  medicines: string;
  total_doses: number;
  status: string;
  follow_up_date: string;
}
