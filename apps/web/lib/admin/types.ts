export interface AdminOverviewMetrics {
  total_doctors: number;
  total_officers: number;
  total_students: number;
  recent_actions_count: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'officer';
  status: 'active' | 'disabled';
  created_at: string;
  last_active?: string;
}

export interface AdminStudent {
  id: string;
  roll_number: string;
  name: string;
  branch: string;
  year: number;
  phone: string;
  status: 'active' | 'graduated' | 'suspended';
  avatar_url?: string;
  allergies: string[];
  emergency_contact: string;
  created_at: string;
}

export interface ColumnMapping {
  roll_number: string;
  name: string;
  branch: string;
  year: string;
  phone: string;
  emergency_contact: string;
  allergies: string;
}

export interface ValidatedStudentImportRow {
  roll_number: string;
  name: string;
  branch: string;
  year: number;
  phone: string;
  emergency_contact: string;
  allergies: string[];
  temp_password: string;
}

export interface InvalidStudentImportRow {
  row_index: number;
  raw: Record<string, string>;
  errors: string[];
}

export interface ImportValidationSummary {
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  valid_records: ValidatedStudentImportRow[];
  invalid_records: InvalidStudentImportRow[];
}

export interface AdminAuditLogEntry {
  id: string;
  actor_email: string;
  action: 'CREATE_STAFF' | 'DISABLE_STAFF' | 'ENABLE_STAFF' | 'RESET_PASSWORD' | 'CHANGE_ROLE' | 'CREATE_STUDENT' | 'BULK_IMPORT_STUDENTS' | 'UPDATE_SETTINGS' | 'ADMIN_LOGIN' | 'MFA_VERIFIED';
  target_type: 'staff' | 'student' | 'settings' | 'auth';
  target_id: string;
  description: string;
  ip_address: string;
  timestamp: string;
}

export interface AdminSettingsData {
  meal_times: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  emergency_contacts: {
    clinic_opd: string;
    ambulance: string;
    emergency_national: string;
    security_desk: string;
  };
  medicines: {
    id: string;
    name: string;
    category: string;
    default_dose: string;
    stock_quantity: number;
    allergy_keywords: string[];
  }[];
  presets: {
    id: string;
    name: string;
    problem: string;
    medicine_names: string[];
  }[];
}
