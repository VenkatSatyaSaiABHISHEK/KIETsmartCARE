import type { UserRole } from '../constants';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type { UserRole };
export type ProfileStatus = 'active' | 'inactive' | 'suspended';
export type StudentStatus = 'active' | 'graduated' | 'suspended' | 'inactive';
export type VisitStatus = 'active' | 'recovered' | 'not_recovered';
export type MealRelationEnum = 'before' | 'after';
export type DoseSlot = 'breakfast' | 'lunch' | 'dinner';
export type DoseResponse = 'taken' | 'taken_late' | 'not_taken' | 'unconfirmed';
export type RecoveryAnswer = 'better' | 'same' | 'worse';
export type AlertType = 'worse' | 'same' | 'side_effect' | 'no_response';
export type AlertSeverity = 'red' | 'normal';
export type AlertStatus = 'open' | 'in_progress' | 'resolved';
export type CallOutcome = 'reached' | 'unreachable' | 'call_back_requested' | 'emergency_escalated';
export type ConsentStatus = 'accepted' | 'revoked';
export type DevicePlatform = 'ios' | 'android' | 'web';

export interface PlannedSlot {
  slot_name: 'morning' | 'afternoon' | 'evening' | 'night';
  scheduled_at: string; // ISO string
  meal_relation: 'before' | 'after';
  tablets: number;
}

export interface VisitMedication {
  id: string;
  visit_id: string;
  medicine_id: string;
  medicine_name?: string;
  dose: string;
  tablets_per_dose: number; // 1-3
  total_doses: number; // 1-7
  meal_relation: 'before' | 'after';
  planned_slots: PlannedSlot[];
  quantity_handed_over: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          status: ProfileStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          phone?: string | null;
          status?: ProfileStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          status?: ProfileStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          roll_number: string;
          name: string;
          branch: string;
          year: number;
          phone: string | null;
          photo_path: string | null;
          allergies: string[];
          emergency_contact: string | null;
          status: StudentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          roll_number: string;
          name: string;
          branch: string;
          year: number;
          phone?: string | null;
          photo_path?: string | null;
          allergies?: string[];
          emergency_contact?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          roll_number?: string;
          name?: string;
          branch?: string;
          year?: number;
          phone?: string | null;
          photo_path?: string | null;
          allergies?: string[];
          emergency_contact?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_meal_times: {
        Row: {
          id: string;
          student_id: string;
          breakfast: string;
          lunch: string;
          dinner: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          breakfast?: string;
          lunch?: string;
          dinner?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          breakfast?: string;
          lunch?: string;
          dinner?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      medicines: {
        Row: {
          id: string;
          name: string;
          default_form: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_form?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_form?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          student_id: string;
          doctor_id: string;
          problem_category: string;
          notes: string | null;
          visit_date: string;
          follow_up_date: string | null;
          status: VisitStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          doctor_id: string;
          problem_category: string;
          notes?: string | null;
          visit_date?: string;
          follow_up_date?: string | null;
          status?: VisitStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          doctor_id?: string;
          problem_category?: string;
          notes?: string | null;
          visit_date?: string;
          follow_up_date?: string | null;
          status?: VisitStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      visit_medications: {
        Row: {
          id: string;
          visit_id: string;
          medicine_id: string;
          dose: string;
          times_per_day: number;
          meal_relation: MealRelationEnum;
          days: number;
          quantity_handed_over: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          medicine_id: string;
          dose: string;
          times_per_day: number;
          meal_relation?: MealRelationEnum;
          days: number;
          quantity_handed_over?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visit_id?: string;
          medicine_id?: string;
          dose?: string;
          times_per_day?: number;
          meal_relation?: MealRelationEnum;
          days?: number;
          quantity_handed_over?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      dose_schedule: {
        Row: {
          id: string;
          visit_medication_id: string;
          student_id: string;
          scheduled_at: string;
          slot: DoseSlot;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visit_medication_id: string;
          student_id: string;
          scheduled_at: string;
          slot: DoseSlot;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visit_medication_id?: string;
          student_id?: string;
          scheduled_at?: string;
          slot?: DoseSlot;
          created_at?: string;
          updated_at?: string;
        };
      };
      dose_events: {
        Row: {
          id: string;
          schedule_id: string;
          student_id: string;
          response: DoseResponse;
          responded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          student_id: string;
          response: DoseResponse;
          responded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          student_id?: string;
          response?: DoseResponse;
          responded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      recovery_checks: {
        Row: {
          id: string;
          visit_id: string;
          student_id: string;
          answer: RecoveryAnswer | null;
          answered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          student_id: string;
          answer?: RecoveryAnswer | null;
          answered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visit_id?: string;
          student_id?: string;
          answer?: RecoveryAnswer | null;
          answered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          visit_id: string;
          student_id: string;
          doctor_id: string;
          type: AlertType;
          severity: AlertSeverity;
          status: AlertStatus;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visit_id: string;
          student_id: string;
          doctor_id: string;
          type: AlertType;
          severity?: AlertSeverity;
          status?: AlertStatus;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visit_id?: string;
          student_id?: string;
          doctor_id?: string;
          type?: AlertType;
          severity?: AlertSeverity;
          status?: AlertStatus;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      call_logs: {
        Row: {
          id: string;
          alert_id: string;
          officer_id: string;
          outcome: CallOutcome;
          notes: string | null;
          called_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          officer_id: string;
          outcome: CallOutcome;
          notes?: string | null;
          called_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          officer_id?: string;
          outcome?: CallOutcome;
          notes?: string | null;
          called_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          student_id: string;
          expo_push_token: string;
          platform: DevicePlatform;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          expo_push_token: string;
          platform?: DevicePlatform;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          expo_push_token?: string;
          platform?: DevicePlatform;
          created_at?: string;
          updated_at?: string;
        };
      };
      consent_records: {
        Row: {
          id: string;
          student_id: string;
          purpose: string;
          status: ConsentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          purpose?: string;
          status?: ConsentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          purpose?: string;
          status?: ConsentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      view_officer_problem_categories: {
        Row: {
          problem_category: string;
          case_count: number;
        };
      };
      view_officer_daily_visits: {
        Row: {
          visit_date: string;
          total_visits: number;
        };
      };
      view_officer_recovery_distribution: {
        Row: {
          recovery_outcome: string;
          count: number;
          percentage: number;
        };
      };
    };
    Functions: {
      get_officer_dashboard_metrics: {
        Args: {
          p_start_date?: string;
          p_end_date?: string;
          p_branch?: string;
          p_year?: number;
        };
        Returns: Json;
      };
      process_unconfirmed_doses: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      process_overdue_recovery_checks: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
  };
}
