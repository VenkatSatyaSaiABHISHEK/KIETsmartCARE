import {
  OfficerKPIs,
  DailyVisitsDataPoint,
  RecoveryDistributionDataPoint,
  ProblemCategoryDataPoint,
  AdherenceTrendDataPoint,
  OfficerAlertItem,
  CallOutcome,
  CallLogEntry,
  StudentOverviewItem,
  ReportSummaryItem,
  FilterParams,
} from './types';

// In-memory mock database for Health Officer surveillance
let MOCK_ALERTS: OfficerAlertItem[] = [
  {
    id: 'alt-101',
    alert_level: 'red',
    student_name: 'Aarav Sharma',
    roll_number: '2200290120019',
    branch: 'Computer Science',
    year: 3,
    phone: '+91 98765 43210',
    doctor_name: 'Dr. Alok Verma',
    reason: 'Worse',
    reported_at: '25 mins ago',
    status: 'open',
    case_details: {
      problem_category: 'Acute Viral Illness',
      medicines: ['Paracetamol 650mg', 'ORS Sachet'],
      doses_confirmed: 5,
      total_doses: 6,
      recovery_answer: 'Worse',
      side_effects: 'Fever spiked to 102.4°F with severe shivering on course completion',
    },
  },
  {
    id: 'alt-102',
    alert_level: 'red',
    student_name: 'Sneha Patel',
    roll_number: '2100290100112',
    branch: 'Information Technology',
    year: 4,
    phone: '+91 98112 34567',
    doctor_name: 'Dr. Alok Verma',
    reason: 'Side effect',
    reported_at: '1 hour ago',
    status: 'in_progress',
    case_details: {
      problem_category: 'Bronchial Congestion',
      medicines: ['Cetirizine 10mg', 'Dextromethorphan Syrup'],
      doses_confirmed: 6,
      total_doses: 6,
      recovery_answer: 'Same',
      side_effects: 'Persistent nausea, dizziness, and sudden urticaria (rash) on arms',
    },
  },
  {
    id: 'alt-103',
    alert_level: 'red',
    student_name: 'Manish Tyagi',
    roll_number: '2200290140032',
    branch: 'Mechanical Engineering',
    year: 3,
    phone: '+91 98990 12345',
    doctor_name: 'Dr. R. K. Singhal',
    reason: 'Same',
    reported_at: '3 hours ago',
    status: 'open',
    case_details: {
      problem_category: 'Acute Gastritis',
      medicines: ['Pantoprazole 40mg', 'Domperidone 10mg'],
      doses_confirmed: 4,
      total_doses: 6,
      recovery_answer: 'Same',
      side_effects: 'Acid reflux and abdominal discomfort persisting with no relief',
    },
  },
  {
    id: 'alt-104',
    alert_level: 'yellow',
    student_name: 'Rohan Verma',
    roll_number: '2300290130088',
    branch: 'Electronics & Comm.',
    year: 2,
    phone: '+91 97654 32109',
    doctor_name: 'Dr. Alok Verma',
    reason: 'No response',
    reported_at: '24 hours overdue',
    status: 'open',
    case_details: {
      problem_category: 'Seasonal Allergy',
      medicines: ['Cetirizine 10mg'],
      doses_confirmed: 3,
      total_doses: 3,
      recovery_answer: 'Unanswered',
    },
  },
  {
    id: 'alt-105',
    alert_level: 'yellow',
    student_name: 'Pooja Agarwal',
    roll_number: '2300290120150',
    branch: 'Computer Science',
    year: 2,
    phone: '+91 99551 23456',
    doctor_name: 'Dr. Meena Gupta',
    reason: 'No response',
    reported_at: '28 hours overdue',
    status: 'open',
    case_details: {
      problem_category: 'Tension Headache',
      medicines: ['Paracetamol 500mg'],
      doses_confirmed: 4,
      total_doses: 4,
      recovery_answer: 'Unanswered',
    },
  },
];

let MOCK_CALL_LOGS: CallLogEntry[] = [
  {
    id: 'cl-1',
    alert_id: 'alt-102',
    officer_name: 'Officer S. Mukherjee',
    called_at: '45 mins ago',
    outcome: 'Reached and advised to visit doctor',
    notes: 'Spoke with student. She reported mild urticaria. Advised immediate OPD visit to Dr. Verma.',
  },
];

const MOCK_STUDENTS_OVERVIEW: StudentOverviewItem[] = [
  {
    id: 'st-1',
    name: 'Aarav Sharma',
    roll_number: '2200290120019',
    branch: 'Computer Science',
    year: 3,
    phone: '+91 98765 43210',
    status: 'Not recovered',
    last_visit_date: '28 Oct 2026',
  },
  {
    id: 'st-2',
    name: 'Sneha Patel',
    roll_number: '2100290100112',
    branch: 'Information Technology',
    year: 4,
    phone: '+91 98112 34567',
    status: 'Not recovered',
    last_visit_date: '29 Oct 2026',
  },
  {
    id: 'st-3',
    name: 'Rohan Verma',
    roll_number: '2300290130088',
    branch: 'Electronics & Comm.',
    year: 2,
    phone: '+91 97654 32109',
    status: 'No response',
    last_visit_date: '27 Oct 2026',
  },
  {
    id: 'st-4',
    name: 'Priya Nair',
    roll_number: '2200290110054',
    branch: 'Mechanical Eng.',
    year: 3,
    phone: '+91 98234 56789',
    status: 'Active treatment',
    last_visit_date: '30 Oct 2026',
  },
  {
    id: 'st-5',
    name: 'Kabir Singh',
    roll_number: '2400290100015',
    branch: 'Electrical Eng.',
    year: 1,
    phone: '+91 99123 45678',
    status: 'Recovered',
    last_visit_date: '25 Oct 2026',
  },
  {
    id: 'st-6',
    name: 'Ananya Deshmukh',
    roll_number: '2300290120042',
    branch: 'Computer Science',
    year: 2,
    phone: '+91 98450 11223',
    status: 'Recovered',
    last_visit_date: '24 Oct 2026',
  },
  {
    id: 'st-7',
    name: 'Vikram Choudhary',
    roll_number: '2100290100099',
    branch: 'Information Technology',
    year: 4,
    phone: '+91 97110 55443',
    status: 'Active treatment',
    last_visit_date: '31 Oct 2026',
  },
];

export class OfficerService {
  /**
   * Fetch aggregate KPI metrics (computed server-side, no raw record leakage)
   */
  static async getKPIs(filters?: Partial<FilterParams>): Promise<OfficerKPIs> {
    // Return high-level aggregate surveillance indicators
    const openRed = MOCK_ALERTS.filter(
      (a) => a.alert_level === 'red' && a.status !== 'resolved'
    ).length;
    const noResp = MOCK_ALERTS.filter(
      (a) => a.alert_level === 'yellow' && a.status !== 'resolved'
    ).length;

    return {
      students_treated: 142,
      alarms_active: 64,
      doses_confirmed_pct: 88.4,
      recovered_count: 118,
      not_recovered_count: 12,
      open_red_alerts: openRed,
      no_response_cases: noResp,
    };
  }

  /**
   * Time series: Visits per day (Line chart)
   */
  static async getDailyVisitsSeries(filters?: Partial<FilterParams>): Promise<DailyVisitsDataPoint[]> {
    return [
      { date: '24 Oct', visits: 18 },
      { date: '25 Oct', visits: 22 },
      { date: '26 Oct', visits: 15 },
      { date: '27 Oct', visits: 28 },
      { date: '28 Oct', visits: 24 },
      { date: '29 Oct', visits: 19 },
      { date: '30 Oct', visits: 31 },
      { date: '31 Oct', visits: 26 },
    ];
  }

  /**
   * Donut chart: Recovery rate distribution
   */
  static async getRecoveryDistribution(filters?: Partial<FilterParams>): Promise<RecoveryDistributionDataPoint[]> {
    return [
      { name: 'Better (Recovered)', value: 118, color: '#10B981' },
      { name: 'Same (Unchanged)', value: 8, color: '#F59E0B' },
      { name: 'Worse (Escalated)', value: 4, color: '#EF4444' },
      { name: 'Side Effect Reported', value: 2, color: '#DC2626' },
      { name: 'No Response (24h)', value: 10, color: '#6B7280' },
    ];
  }

  /**
   * Bar chart: Visits by problem category
   */
  static async getProblemCategories(filters?: Partial<FilterParams>): Promise<ProblemCategoryDataPoint[]> {
    return [
      { category: 'Fever / Flu', count: 48 },
      { category: 'Headache', count: 32 },
      { category: 'Cold & Cough', count: 29 },
      { category: 'Stomach Issue', count: 21 },
      { category: 'Body Pain', count: 12 },
    ];
  }

  /**
   * Line/Area chart: Dose adherence trend over time
   */
  static async getAdherenceTrend(filters?: Partial<FilterParams>): Promise<AdherenceTrendDataPoint[]> {
    return [
      { date: '24 Oct', adherence_pct: 84.2, doses_scheduled: 180 },
      { date: '25 Oct', adherence_pct: 86.5, doses_scheduled: 210 },
      { date: '26 Oct', adherence_pct: 89.0, doses_scheduled: 195 },
      { date: '27 Oct', adherence_pct: 85.3, doses_scheduled: 230 },
      { date: '28 Oct', adherence_pct: 91.2, doses_scheduled: 240 },
      { date: '29 Oct', adherence_pct: 88.0, doses_scheduled: 220 },
      { date: '30 Oct', adherence_pct: 92.4, doses_scheduled: 260 },
      { date: '31 Oct', adherence_pct: 88.4, doses_scheduled: 245 },
    ];
  }

  /**
   * Alerts queue: Red alerts first, then no-response alerts
   */
  static async getAlertsQueue(): Promise<OfficerAlertItem[]> {
    return [...MOCK_ALERTS].sort((a, b) => {
      // Priority: red first, then yellow
      if (a.alert_level === 'red' && b.alert_level !== 'red') return -1;
      if (a.alert_level !== 'red' && b.alert_level === 'red') return 1;
      return 0;
    });
  }

  /**
   * Log case view in audit_logs when Officer inspects limited details
   */
  static async logCaseView(
    alertId: string,
    rollNumber: string,
    officerName: string = 'Officer S. Mukherjee'
  ): Promise<void> {
    console.log(
      `[AUDIT LOG] READ action on flagged_cases: ${officerName} viewed limited case panel for Roll ${rollNumber} (Alert ${alertId}) at ${new Date().toISOString()}`
    );
  }

  /**
   * Submit telephonic outreach call outcome and advance alert status
   */
  static async submitCallLog(
    alertId: string,
    outcome: CallOutcome,
    notes: string,
    officerName: string = 'Officer S. Mukherjee'
  ): Promise<{ success: boolean; message: string }> {
    const newLog: CallLogEntry = {
      id: `cl-${Date.now()}`,
      alert_id: alertId,
      officer_name: officerName,
      called_at: 'Just now',
      outcome,
      notes,
    };

    MOCK_CALL_LOGS.unshift(newLog);

    // Update alert status
    MOCK_ALERTS = MOCK_ALERTS.map((alert) => {
      if (alert.id === alertId) {
        return {
          ...alert,
          status: outcome === 'Reached and fine' ? 'resolved' : 'in_progress',
        };
      }
      return alert;
    });

    console.log(
      `[AUDIT LOG] CREATE action on call_logs: ${officerName} logged call outcome '${outcome}' for alert ${alertId}`
    );

    return {
      success: true,
      message: `Call outcome successfully logged. Alert status updated to ${
        outcome === 'Reached and fine' ? 'Resolved' : 'In Progress'
      }.`,
    };
  }

  /**
   * Get students overview (searchable, filterable; default view shows status only, not clinical notes)
   */
  static async getStudentsOverview(
    search?: string,
    branchFilter?: string,
    yearFilter?: string,
    statusFilter?: string
  ): Promise<StudentOverviewItem[]> {
    let result = [...MOCK_STUDENTS_OVERVIEW];

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.roll_number.toLowerCase().includes(q)
      );
    }

    if (branchFilter && branchFilter !== 'all') {
      result = result.filter((s) =>
        s.branch.toLowerCase().includes(branchFilter.toLowerCase())
      );
    }

    if (yearFilter && yearFilter !== 'all') {
      result = result.filter((s) => s.year.toString() === yearFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    return result;
  }

  /**
   * Fetch aggregate monthly and semester reports
   */
  static async getReports(): Promise<ReportSummaryItem[]> {
    return [
      {
        period: 'October 2026',
        total_visits: 342,
        unique_students: 288,
        recovery_rate: '91.8%',
        adherence_rate: '88.4%',
        red_alerts: 14,
        escalation_calls: 14,
      },
      {
        period: 'September 2026',
        total_visits: 298,
        unique_students: 254,
        recovery_rate: '93.2%',
        adherence_rate: '89.1%',
        red_alerts: 9,
        escalation_calls: 9,
      },
      {
        period: 'August 2026',
        total_visits: 310,
        unique_students: 260,
        recovery_rate: '90.5%',
        adherence_rate: '87.6%',
        red_alerts: 12,
        escalation_calls: 12,
      },
      {
        period: 'Semester 1 (Autumn 2026 Aggregate)',
        total_visits: 950,
        unique_students: 802,
        recovery_rate: '91.8%',
        adherence_rate: '88.3%',
        red_alerts: 35,
        escalation_calls: 35,
      },
    ];
  }

  /**
   * Generate sanitized CSV content with aggregate counts and no individual diagnoses
   */
  static generateReportsCSV(reports: ReportSummaryItem[]): string {
    const headers = [
      'Reporting Period',
      'Total Consultations',
      'Unique Students',
      'Recovery Rate (%)',
      'Adherence Confirmation Rate (%)',
      'Escalated Red Alerts',
      'Officer Calls Executed',
    ];

    const rows = reports.map((r) => [
      `"${r.period}"`,
      r.total_visits,
      r.unique_students,
      `"${r.recovery_rate}"`,
      `"${r.adherence_rate}"`,
      r.red_alerts,
      r.escalation_calls,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}
