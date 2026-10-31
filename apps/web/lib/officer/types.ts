export interface OfficerKPIs {
  students_treated: number;
  alarms_active: number;
  doses_confirmed_pct: number;
  recovered_count: number;
  not_recovered_count: number;
  open_red_alerts: number;
  no_response_cases: number;
}

export interface DailyVisitsDataPoint {
  date: string;
  visits: number;
}

export interface RecoveryDistributionDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface ProblemCategoryDataPoint {
  category: string;
  count: number;
}

export interface AdherenceTrendDataPoint {
  date: string;
  adherence_pct: number;
  doses_scheduled: number;
}

export interface OfficerAlertItem {
  id: string;
  alert_level: 'red' | 'yellow';
  student_name: string;
  roll_number: string;
  branch: string;
  year: number;
  phone: string;
  doctor_name: string;
  reason: 'Same' | 'Worse' | 'Side effect' | 'No response';
  reported_at: string;
  status: 'open' | 'in_progress' | 'resolved';
  case_details: {
    problem_category: string;
    medicines: string[];
    doses_confirmed: number;
    total_doses: number;
    recovery_answer?: string;
    side_effects?: string;
  };
}

export type CallOutcome =
  | 'Reached and fine'
  | 'Reached and advised to visit doctor'
  | 'Not reached';

export interface CallLogEntry {
  id: string;
  alert_id: string;
  officer_name: string;
  called_at: string;
  outcome: CallOutcome;
  notes: string;
}

export interface StudentOverviewItem {
  id: string;
  name: string;
  roll_number: string;
  branch: string;
  year: number;
  phone: string;
  status: 'Active treatment' | 'Recovered' | 'Not recovered' | 'No response';
  last_visit_date: string;
}

export interface ReportSummaryItem {
  period: string;
  total_visits: number;
  unique_students: number;
  recovery_rate: string;
  adherence_rate: string;
  red_alerts: number;
  escalation_calls: number;
}

export interface FilterParams {
  dateRange: 'today' | '7days' | '30days' | 'custom';
  branch: string;
  year: string;
  customStartDate?: string;
  customEndDate?: string;
}
