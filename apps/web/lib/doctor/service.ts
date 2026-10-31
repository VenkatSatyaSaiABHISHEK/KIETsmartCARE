import {
  StudentSearchResult,
  StudentFullProfile,
  VisitHistoryEntry,
  MedicineCatalogItem,
  PrescriptionPreset,
  TodayPatientItem,
  DoctorAlertItem,
  VisitSubmissionPayload,
  DaySchedulePreviewItem,
  PrescriptionRow,
} from "./types";
import {
  BEFORE_MEAL_OFFSET_MINUTES,
  AFTER_MEAL_OFFSET_MINUTES,
  DEFAULT_MEAL_TIMES,
} from "@kiet-smart-care/shared";

// In-memory mock database for fast, calm, clinical responsiveness
const MOCK_STUDENTS: StudentFullProfile[] = [
  {
    id: "std-001",
    roll_number: "2200290120019",
    name: "Aarav Sharma",
    branch: "Computer Science & Engineering",
    year: 3,
    phone: "+91 98765 43210",
    hostel_status: "Hosteler",
    hostel_name: "Tagore Hostel",
    room_number: "T-302",
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&h=160&fit=crop&crop=faces",
    allergies: ["Penicillin", "Sulfa drugs"],
    meal_times: {
      breakfast: "08:15",
      lunch: "13:30",
      dinner: "20:30",
    },
  },
  {
    id: "std-002",
    roll_number: "2100290100112",
    name: "Sneha Patel",
    branch: "Information Technology",
    year: 4,
    phone: "+91 98112 34567",
    hostel_status: "Day Scholar",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
    allergies: ["Aspirin", "Ibuprofen"],
    meal_times: {
      breakfast: "08:00",
      lunch: "13:00",
      dinner: "20:00",
    },
  },
  {
    id: "std-003",
    roll_number: "2300290130088",
    name: "Rohan Verma",
    branch: "Electronics & Communication",
    year: 2,
    phone: "+91 97654 32109",
    hostel_status: "Hosteler",
    hostel_name: "Aryabhatta Hostel",
    room_number: "A-114",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces",
    allergies: [],
    meal_times: {
      breakfast: "08:30",
      lunch: "13:15",
      dinner: "21:00",
    },
  },
  {
    id: "std-004",
    roll_number: "2200290110054",
    name: "Priya Nair",
    branch: "Mechanical Engineering",
    year: 3,
    phone: "+91 98234 56789",
    hostel_status: "Hosteler",
    hostel_name: "Gargi Girls Hostel",
    room_number: "G-208",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&crop=faces",
    allergies: ["Paracetamol (Mild)"],
    meal_times: {
      breakfast: "07:45",
      lunch: "12:45",
      dinner: "19:45",
    },
  },
  {
    id: "std-005",
    roll_number: "2400290100015",
    name: "Kabir Singh",
    branch: "Electrical Engineering",
    year: 1,
    phone: "+91 99123 45678",
    hostel_status: "Day Scholar",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
    allergies: [],
    meal_times: {
      breakfast: "08:00",
      lunch: "13:00",
      dinner: "20:00",
    },
  },
];

const MOCK_VISIT_HISTORY: Record<string, VisitHistoryEntry[]> = {
  "std-001": [
    {
      id: "vh-001",
      date: "14 Oct 2026",
      doctor_name: "Dr. Alok Verma",
      problem_category: "Fever",
      notes: "High temperature with mild chills. Advised hydration.",
      medicines: [
        { name: "Paracetamol 650mg", dose: "1 tablet", duration: "3 days" },
        { name: "ORS Sachet", dose: "1 sachet in 1L water", duration: "2 days" },
      ],
      outcome: "recovered",
    },
    {
      id: "vh-002",
      date: "28 Aug 2026",
      doctor_name: "Dr. Alok Verma",
      problem_category: "Headache",
      notes: "Tension headache due to late study hours.",
      medicines: [
        { name: "Paracetamol 500mg", dose: "1 tablet", duration: "2 days" },
      ],
      outcome: "recovered",
    },
  ],
  "std-002": [
    {
      id: "vh-003",
      date: "29 Oct 2026",
      doctor_name: "Dr. Alok Verma",
      problem_category: "Cold and cough",
      notes: "Throat irritation and mild bronchial congestion.",
      medicines: [
        { name: "Cetirizine 10mg", dose: "1 tablet", duration: "3 days" },
        { name: "Dextromethorphan Syrup", dose: "10ml", duration: "3 days" },
      ],
      outcome: "active",
    },
  ],
};

const MOCK_MEDICINES: MedicineCatalogItem[] = [
  { id: "med-1", name: "Paracetamol 650mg", default_dose: "1 tablet", category: "Analgesic / Antipyretic", stock_quantity: 450, allergy_keywords: ["paracetamol", "acetaminophen"] },
  { id: "med-2", name: "Paracetamol 500mg", default_dose: "1 tablet", category: "Analgesic / Antipyretic", stock_quantity: 320, allergy_keywords: ["paracetamol", "acetaminophen"] },
  { id: "med-3", name: "Amoxicillin 500mg", default_dose: "1 capsule", category: "Antibiotic", stock_quantity: 180, allergy_keywords: ["amoxicillin", "penicillin", "beta-lactam"] },
  { id: "med-4", name: "Azithromycin 500mg", default_dose: "1 tablet", category: "Antibiotic", stock_quantity: 120, allergy_keywords: ["azithromycin", "macrolide"] },
  { id: "med-5", name: "Cetirizine 10mg", default_dose: "1 tablet", category: "Antihistamine", stock_quantity: 600, allergy_keywords: ["cetirizine"] },
  { id: "med-6", name: "Pantoprazole 40mg", default_dose: "1 tablet", category: "Antacid / PPI", stock_quantity: 500, allergy_keywords: ["pantoprazole", "ppi"] },
  { id: "med-7", name: "Ibuprofen 400mg", default_dose: "1 tablet", category: "NSAID", stock_quantity: 210, allergy_keywords: ["ibuprofen", "nsaid", "aspirin"] },
  { id: "med-8", name: "Domperidone 10mg", default_dose: "1 tablet", category: "Antiemetic", stock_quantity: 190, allergy_keywords: ["domperidone"] },
  { id: "med-9", name: "ORS Sachet", default_dose: "1 sachet in 1L", category: "Rehydration", stock_quantity: 800, allergy_keywords: [] },
  { id: "med-10", name: "Dextromethorphan Syrup", default_dose: "10ml", category: "Cough Suppressant", stock_quantity: 95, allergy_keywords: [] },
];

const MOCK_PRESETS: PrescriptionPreset[] = [
  {
    id: "preset-fever",
    name: "Fever & Flu (3 Days)",
    problem: "Fever",
    notes: "Rest, plenty of fluids, and meal-anchored antipyretics.",
    medicines: [
      {
        medicine_name: "Paracetamol 650mg",
        dose: "1 tablet",
        times_per_day: 2,
        meal_relation: "after",
        meal_slots: ["lunch", "dinner"],
        number_of_days: 3,
        quantity_handed_over: 6,
        instructions: "Take with full glass of water after food",
      },
      {
        medicine_name: "Cetirizine 10mg",
        dose: "1 tablet",
        times_per_day: 1,
        meal_relation: "after",
        meal_slots: ["dinner"],
        number_of_days: 3,
        quantity_handed_over: 3,
        instructions: "Take before sleep",
      },
    ],
  },
  {
    id: "preset-cold",
    name: "Cold & Cough Congestion",
    problem: "Cold and cough",
    notes: "Steam inhalation twice daily in addition to medication.",
    medicines: [
      {
        medicine_name: "Cetirizine 10mg",
        dose: "1 tablet",
        times_per_day: 1,
        meal_relation: "after",
        meal_slots: ["dinner"],
        number_of_days: 3,
        quantity_handed_over: 3,
        instructions: "Take after dinner",
      },
      {
        medicine_name: "Dextromethorphan Syrup",
        dose: "10ml",
        times_per_day: 2,
        meal_relation: "after",
        meal_slots: ["breakfast", "dinner"],
        number_of_days: 3,
        quantity_handed_over: 1,
        instructions: "Do not drink water immediately after syrup",
      },
    ],
  },
  {
    id: "preset-gastric",
    name: "Acute Acidity & Gastric Distress",
    problem: "Stomach issue",
    notes: "Avoid spicy food, caffeine, and late night meals.",
    medicines: [
      {
        medicine_name: "Pantoprazole 40mg",
        dose: "1 tablet",
        times_per_day: 1,
        meal_relation: "before",
        meal_slots: ["breakfast"],
        number_of_days: 5,
        quantity_handed_over: 5,
        instructions: "Take 30 min before morning breakfast",
      },
      {
        medicine_name: "Domperidone 10mg",
        dose: "1 tablet",
        times_per_day: 2,
        meal_relation: "before",
        meal_slots: ["lunch", "dinner"],
        number_of_days: 3,
        quantity_handed_over: 6,
        instructions: "Take 30 min before meals",
      },
    ],
  },
  {
    id: "preset-headache",
    name: "Tension Headache / Body Pain",
    problem: "Headache",
    notes: "Adequate hydration and screen breaks recommended.",
    medicines: [
      {
        medicine_name: "Paracetamol 500mg",
        dose: "1 tablet",
        times_per_day: 2,
        meal_relation: "after",
        meal_slots: ["lunch", "dinner"],
        number_of_days: 2,
        quantity_handed_over: 4,
        instructions: "Take after meals as needed",
      },
    ],
  },
];

let todayPatients: TodayPatientItem[] = [
  {
    id: "tp-1",
    roll_number: "2300290130088",
    student_name: "Rohan Verma",
    branch: "ECE",
    problem: "Cold and cough",
    time: "09:45 AM",
    status: "alarms_active",
  },
  {
    id: "tp-2",
    roll_number: "2200290110054",
    student_name: "Priya Nair",
    branch: "ME",
    problem: "Stomach issue",
    time: "10:15 AM",
    status: "doses_confirmed",
  },
  {
    id: "tp-3",
    roll_number: "2400290100015",
    student_name: "Kabir Singh",
    branch: "EE",
    problem: "Headache",
    time: "11:00 AM",
    status: "recovered",
  },
];

let doctorAlerts: DoctorAlertItem[] = [
  {
    id: "alt-1",
    student_id: "std-001",
    student_name: "Aarav Sharma",
    roll_number: "2200290120019",
    problem: "Acute Viral Illness",
    reason: "Worse",
    side_effects_reported: "Persistent fever spike and severe fatigue on course end",
    time: "32 mins ago",
    acknowledged: false,
    priority: "red",
  },
  {
    id: "alt-2",
    student_id: "std-002",
    student_name: "Sneha Patel",
    roll_number: "2100290100112",
    problem: "Bronchial Congestion",
    reason: "Side effect",
    side_effects_reported: "Reported nausea, dizziness, and mild skin irritation",
    time: "1 hour ago",
    acknowledged: false,
    priority: "red",
  },
];

export class DoctorService {
  /**
   * Fast autocomplete search by student roll number or name
   */
  static async searchStudents(query: string): Promise<StudentSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return MOCK_STUDENTS.filter(
      (s) =>
        s.roll_number.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    ).map((s) => ({
      id: s.id,
      roll_number: s.roll_number,
      name: s.name,
      branch: s.branch,
      year: s.year,
    }));
  }

  /**
   * Fetch complete student details by roll number with audit logging
   */
  static async getStudentByRoll(
    rollNumber: string,
    doctorId: string = "doc-verma"
  ): Promise<StudentFullProfile | null> {
    const student =
      MOCK_STUDENTS.find(
        (s) => s.roll_number.toLowerCase() === rollNumber.trim().toLowerCase()
      ) || null;

    if (student) {
      this.logAudit({
        actor_id: doctorId,
        actor_role: "doctor",
        action: "READ",
        resource_type: "students",
        resource_id: student.id,
        description: `Doctor accessed clinical records for student ${student.roll_number}`,
        timestamp: new Date().toISOString(),
      });
    }

    return student;
  }

  /**
   * Fetch visit history for student (newest first)
   */
  static async getStudentHistory(studentId: string): Promise<VisitHistoryEntry[]> {
    return MOCK_VISIT_HISTORY[studentId] || [];
  }

  /**
   * Searchable medicine directory
   */
  static async getMedicines(): Promise<MedicineCatalogItem[]> {
    return MOCK_MEDICINES;
  }

  /**
   * Get pre-configured clinical presets
   */
  static async getPresets(): Promise<PrescriptionPreset[]> {
    return MOCK_PRESETS;
  }

  /**
   * Get list of patients treated today by this doctor
   */
  static async getTodayPatients(): Promise<TodayPatientItem[]> {
    return todayPatients;
  }

  /**
   * Get active red alerts for doctor's own patients
   */
  static async getAlerts(): Promise<DoctorAlertItem[]> {
    return doctorAlerts;
  }

  /**
   * Acknowledge/review red alert
   */
  static async markAlertReviewed(alertId: string): Promise<void> {
    doctorAlerts = doctorAlerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    );
  }

  /**
   * Compute exact day-by-day meal-anchored preview using student's meal schedule
   * after = meal time + 30m, before = meal time - 30m
   */
  static calculateSchedulePreview(
    medicines: PrescriptionRow[],
    studentMealTimes: { breakfast: string; lunch: string; dinner: string } = DEFAULT_MEAL_TIMES
  ): DaySchedulePreviewItem[] {
    if (!medicines || medicines.length === 0) return [];

    const maxDays = Math.max(...medicines.map((m) => m.number_of_days || 1));
    const days: DaySchedulePreviewItem[] = [];

    const helperOffsetTime = (timeHHMM: string, offsetMinutes: number): string => {
      const [h, m] = timeHHMM.split(":").map(Number);
      const totalMinutes = h * 60 + m + offsetMinutes;
      const normalized = (totalMinutes + 1440) % 1440;
      const hours = Math.floor(normalized / 60);
      const mins = normalized % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`;
    };

    const mealSlotsOrder: ("breakfast" | "lunch" | "dinner")[] = [
      "breakfast",
      "lunch",
      "dinner",
    ];

    for (let day = 1; day <= maxDays; day++) {
      const activeMedicinesForDay = medicines.filter(
        (m) => day <= (m.number_of_days || 1)
      );
      if (activeMedicinesForDay.length === 0) continue;

      const daySlots: DaySchedulePreviewItem["slots"] = [];

      for (const meal of mealSlotsOrder) {
        // Collect medicines for this meal slot
        const medsInSlot = activeMedicinesForDay.filter((m) =>
          m.meal_slots.includes(meal)
        );

        if (medsInSlot.length > 0) {
          // Group by meal relation ('before' or 'after')
          const relations: ("before" | "after")[] = ["before", "after"];
          for (const rel of relations) {
            const relMeds = medsInSlot.filter((m) => m.meal_relation === rel);
            if (relMeds.length > 0) {
              const baseTime = studentMealTimes[meal] || DEFAULT_MEAL_TIMES[meal];
              const offset =
                rel === "before"
                  ? BEFORE_MEAL_OFFSET_MINUTES
                  : AFTER_MEAL_OFFSET_MINUTES;
              const formattedTime = helperOffsetTime(baseTime, offset);

              daySlots.push({
                meal,
                relation: rel,
                timeStr: formattedTime,
                medicines: relMeds.map((m) => ({
                  name: m.medicine_name,
                  dose: m.dose,
                })),
              });
            }
          }
        }
      }

      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + (day - 1));
      const dateStr = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      days.push({
        dayNumber: day,
        dateStr,
        slots: daySlots,
      });
    }

    return days;
  }

  /**
   * Check for allergy conflicts between medicines and student allergy list
   */
  static checkAllergyConflict(
    medicineName: string,
    studentAllergies: string[]
  ): string | null {
    if (!medicineName || !studentAllergies || studentAllergies.length === 0)
      return null;

    const lowerMed = medicineName.toLowerCase();
    for (const allergy of studentAllergies) {
      const lowerAllergy = allergy.toLowerCase();
      // Match common stems: e.g. penicillin, aspirin, paracetamol, sulfa
      if (
        lowerMed.includes(lowerAllergy) ||
        lowerAllergy.includes(lowerMed) ||
        (lowerAllergy.includes("penicillin") && lowerMed.includes("amoxicillin")) ||
        (lowerAllergy.includes("aspirin") && lowerMed.includes("ibuprofen"))
      ) {
        return `ALLERGY WARNING: Student has documented allergy to "${allergy}". Ensure you do not prescribe conflicting compounds.`;
      }
    }
    return null;
  }

  /**
   * Submit visit, generate dose_schedule, log audit, and send push notification
   */
  static async submitVisit(
    payload: VisitSubmissionPayload,
    doctorId: string = "doc-verma",
    doctorName: string = "Dr. Alok Verma"
  ): Promise<{ success: boolean; visitId: string; message: string }> {
    const visitId = `vst-${Date.now()}`;

    // Add to history
    if (!MOCK_VISIT_HISTORY[payload.student_id]) {
      MOCK_VISIT_HISTORY[payload.student_id] = [];
    }

    const newHistoryEntry: VisitHistoryEntry = {
      id: visitId,
      date: "Today, Just now",
      doctor_name: doctorName,
      problem_category: payload.problem_category,
      notes: payload.clinical_notes,
      medicines: payload.medicines.map((m) => ({
        name: m.medicine_name,
        dose: m.dose,
        duration: `${m.number_of_days} days`,
      })),
      outcome: "active",
    };

    MOCK_VISIT_HISTORY[payload.student_id].unshift(newHistoryEntry);

    // Add to Today's Patients
    const student = MOCK_STUDENTS.find((s) => s.id === payload.student_id);
    const newPatientEntry: TodayPatientItem = {
      id: `tp-${Date.now()}`,
      roll_number: payload.roll_number,
      student_name: student?.name || "Student",
      branch: student?.branch ? student.branch.split(" ")[0] : "KIET",
      problem: payload.problem_category,
      time: "Just now",
      status: "alarms_active",
    };

    todayPatients.unshift(newPatientEntry);

    // Audit Logging
    this.logAudit({
      actor_id: doctorId,
      actor_role: "doctor",
      action: "CREATE",
      resource_type: "visits",
      resource_id: visitId,
      description: `Doctor recorded consultation & prescribed ${payload.medicines.length} medicines for roll ${payload.roll_number}`,
      metadata: {
        problem: payload.problem_category,
        medicine_count: payload.medicines.length,
        follow_up: payload.follow_up_date,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      visitId,
      message: `Prescription saved. Schedule generated and pushed to ${student?.name || payload.roll_number}'s device.`,
    };
  }

  /**
   * Internal audit logger
   */
  private static logAudit(entry: {
    actor_id: string;
    actor_role: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    description: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
  }) {
    console.log(`[AUDIT LOG] [${entry.timestamp}] ${entry.action} on ${entry.resource_type}: ${entry.description}`);
  }
}
