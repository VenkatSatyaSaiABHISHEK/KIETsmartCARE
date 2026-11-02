import {
  StudentSearchResult,
  StudentFullProfile,
  VisitHistoryEntry,
  MedicineCatalogItem,
  PrescriptionPreset,
  TodayPatientItem,
  DoctorAlertItem,
  DoctorPatientRecord,
  VisitSubmissionPayload,
  DaySchedulePreviewItem,
  DoctorMedicinePrescription,
  PlannedTimelineSlot,
  ClinicalSlotName,
} from "./types";
import { DEFAULT_SLOT_TIMES } from "@kiet-smart-care/shared";

// Clinical Presets (institutional treatment guidelines, dose-centric)
const CLINICAL_PRESETS: PrescriptionPreset[] = [
  {
    id: "preset-fever",
    name: "Acute Viral Illness / Fever Protocol",
    problem: "Fever and body ache",
    notes: "Patient advised complete bed rest, oral rehydration therapy, and soft diet.",
    medicines: [
      {
        medicine_name: "Paracetamol 650mg",
        tablets_per_dose: 1,
        total_doses: 6,
        pattern: "twice",
        meal_relation: "after",
        instructions: "Take with water after food",
      },
      {
        medicine_name: "Pantoprazole 40mg",
        tablets_per_dose: 1,
        total_doses: 3,
        pattern: "once",
        meal_relation: "before",
        instructions: "Take 30 minutes before morning meal",
      },
      {
        medicine_name: "ORS Electrolyte Sachet",
        tablets_per_dose: 1,
        total_doses: 2,
        pattern: "once",
        meal_relation: "after",
        instructions: "Dissolve 1 sachet in 1L water; sip throughout day",
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
        tablets_per_dose: 1,
        total_doses: 3,
        pattern: "night_only",
        meal_relation: "after",
        instructions: "Take after dinner before sleep",
      },
      {
        medicine_name: "Dextromethorphan Syrup",
        tablets_per_dose: 1,
        total_doses: 6,
        pattern: "twice",
        meal_relation: "after",
        instructions: "Take 10ml after breakfast and dinner",
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
        tablets_per_dose: 1,
        total_doses: 5,
        pattern: "once",
        meal_relation: "before",
        instructions: "Take 30 min before morning breakfast",
      },
      {
        medicine_name: "Domperidone 10mg",
        tablets_per_dose: 1,
        total_doses: 6,
        pattern: "twice",
        meal_relation: "before",
        instructions: "Take 30 min before meals",
      },
    ],
  },
];

export class DoctorService {
  /**
   * Deterministic Planned Timeline Generator
   */
  static generateDoseTimeline(
    pattern: "once" | "twice" | "thrice" | "night_only",
    totalDoses: number,
    tabletsPerDose: number,
    mealRelation: "before" | "after" = "after",
    studentMealTimes?: { breakfast: string; lunch: string; dinner: string }
  ): PlannedTimelineSlot[] {
    const slots: PlannedTimelineSlot[] = [];
    const baseDate = new Date();
    const dosesCount = Math.max(1, totalDoses);

    const defaultMealTimes = {
      breakfast: "08:30:00",
      lunch: "13:00:00",
      dinner: "20:00:00",
    };

    const effectiveMeals = studentMealTimes || defaultMealTimes;

    const slotConfigs: { slot: ClinicalSlotName; time: string }[] = [
      { slot: "morning", time: effectiveMeals.breakfast.slice(0, 5) || "08:00" },
      { slot: "afternoon", time: effectiveMeals.lunch.slice(0, 5) || "13:30" },
      { slot: "evening", time: "18:00" },
      { slot: "night", time: effectiveMeals.dinner.slice(0, 5) || "20:30" },
    ];

    const currentHour = baseDate.getHours();
    const currentMinute = baseDate.getMinutes();
    const currentMinutesFromMidnight = currentHour * 60 + currentMinute;

    const formatDateStr = (date: Date): { display: string; target: string } => {
      const isToday = date.toDateString() === baseDate.toDateString();
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();

      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const dayNum = date.getDate();

      let display = `${monthName} ${dayNum}`;
      if (isToday) display = `Today, ${monthName} ${dayNum}`;
      else if (isTomorrow) display = `Tomorrow, ${monthName} ${dayNum}`;

      const year = date.getFullYear();
      const target = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

      return { display, target };
    };

    if (pattern === "once") {
      for (let i = 0; i < dosesCount; i++) {
        const slotDate = new Date(baseDate);
        let dayOffset = i;
        if (i === 0 && currentMinutesFromMidnight > 9 * 60) {
          dayOffset = i + 1;
        }
        slotDate.setDate(baseDate.getDate() + dayOffset);
        const { display, target } = formatDateStr(slotDate);

        slots.push({
          id: `slot-${Date.now()}-${i}`,
          slot_name: "morning",
          time_hhmm: "08:00",
          meal_relation: mealRelation,
          day_offset: dayOffset,
          date_display: display,
          target_date: target,
          tablets: tabletsPerDose,
        });
      }
      return slots;
    }

    if (pattern === "night_only") {
      for (let i = 0; i < dosesCount; i++) {
        const slotDate = new Date(baseDate);
        let dayOffset = i;
        if (i === 0 && currentMinutesFromMidnight > 21 * 60) {
          dayOffset = i + 1;
        }
        slotDate.setDate(baseDate.getDate() + dayOffset);
        const { display, target } = formatDateStr(slotDate);

        slots.push({
          id: `slot-${Date.now()}-${i}`,
          slot_name: "night",
          time_hhmm: "20:30",
          meal_relation: mealRelation,
          day_offset: dayOffset,
          date_display: display,
          target_date: target,
          tablets: tabletsPerDose,
        });
      }
      return slots;
    }

    if (pattern === "twice") {
      let dosesPlaced = 0;
      let dayOffset = 0;

      while (dosesPlaced < dosesCount) {
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + dayOffset);
        const { display, target } = formatDateStr(targetDate);

        if (dayOffset > 0 || currentMinutesFromMidnight <= 10 * 60) {
          slots.push({
            id: `slot-${Date.now()}-${dosesPlaced}`,
            slot_name: "morning",
            time_hhmm: "08:00",
            meal_relation: mealRelation,
            day_offset: dayOffset,
            date_display: display,
            target_date: target,
            tablets: tabletsPerDose,
          });
          dosesPlaced++;
          if (dosesPlaced >= dosesCount) break;
        }

        if (dayOffset > 0 || currentMinutesFromMidnight <= 21 * 60) {
          slots.push({
            id: `slot-${Date.now()}-${dosesPlaced}`,
            slot_name: "night",
            time_hhmm: "20:30",
            meal_relation: mealRelation,
            day_offset: dayOffset,
            date_display: display,
            target_date: target,
            tablets: tabletsPerDose,
          });
          dosesPlaced++;
        }

        dayOffset++;
      }
      return slots;
    }

    if (pattern === "thrice") {
      let dosesPlaced = 0;
      let dayOffset = 0;

      while (dosesPlaced < dosesCount) {
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + dayOffset);
        const { display, target } = formatDateStr(targetDate);

        if (dayOffset > 0 || currentMinutesFromMidnight <= 10 * 60) {
          slots.push({
            id: `slot-${Date.now()}-${dosesPlaced}`,
            slot_name: "morning",
            time_hhmm: "08:00",
            meal_relation: mealRelation,
            day_offset: dayOffset,
            date_display: display,
            target_date: target,
            tablets: tabletsPerDose,
          });
          dosesPlaced++;
          if (dosesPlaced >= dosesCount) break;
        }

        if (dayOffset > 0 || currentMinutesFromMidnight <= 14 * 60) {
          slots.push({
            id: `slot-${Date.now()}-${dosesPlaced}`,
            slot_name: "afternoon",
            time_hhmm: "13:30",
            meal_relation: mealRelation,
            day_offset: dayOffset,
            date_display: display,
            target_date: target,
            tablets: tabletsPerDose,
          });
          dosesPlaced++;
          if (dosesPlaced >= dosesCount) break;
        }

        if (dayOffset > 0 || currentMinutesFromMidnight <= 21 * 60) {
          slots.push({
            id: `slot-${Date.now()}-${dosesPlaced}`,
            slot_name: "night",
            time_hhmm: "20:30",
            meal_relation: mealRelation,
            day_offset: dayOffset,
            date_display: display,
            target_date: target,
            tablets: tabletsPerDose,
          });
          dosesPlaced++;
        }

        dayOffset++;
      }
      return slots;
    }

    return slots;
  }

  static generateCombinedDayPreviews(
    prescriptions: DoctorMedicinePrescription[]
  ): DaySchedulePreviewItem[] {
    const dayMap = new Map<string, { display: string; target: string; items: any[] }>();

    for (const rx of prescriptions) {
      for (const slot of rx.planned_timeline) {
        if (!dayMap.has(slot.target_date)) {
          dayMap.set(slot.target_date, {
            display: slot.date_display,
            target: slot.target_date,
            items: [],
          });
        }

        dayMap.get(slot.target_date)!.items.push({
          medicine_name: rx.medicine_name,
          slot_name: slot.slot_name,
          time_hhmm: slot.time_hhmm,
          tablets: slot.tablets || rx.tablets_per_dose,
          meal_relation: slot.meal_relation,
        });
      }
    }

    const sortedDates = Array.from(dayMap.keys()).sort();

    return sortedDates.map((targetDate, idx) => {
      const entry = dayMap.get(targetDate)!;
      entry.items.sort((a, b) => a.time_hhmm.localeCompare(b.time_hhmm));

      return {
        dayNumber: idx + 1,
        dateStr: entry.display,
        slots: entry.items.map((it) => ({
          slot_name: it.slot_name as ClinicalSlotName,
          timeStr: it.time_hhmm,
          relation: it.meal_relation as "before" | "after",
          tablets: it.tablets,
          medicines: [
            {
              name: it.medicine_name,
              dose: `${it.tablets} tab`,
            },
          ],
        })),
      };
    });
  }

  static calculateSchedulePreview(
    prescriptions: DoctorMedicinePrescription[]
  ): DaySchedulePreviewItem[] {
    return this.generateCombinedDayPreviews(prescriptions);
  }

  /**
   * Fetch active formulary medicines catalog via API
   */
  static async getMedicines(): Promise<MedicineCatalogItem[]> {
    try {
      const res = await fetch("/api/doctor/medicines", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return (data.medicines || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          default_dose: `1 ${m.default_form || "tablet"}`,
          category: "Formulary",
          stock_quantity: 200,
          allergy_keywords: m.name.toLowerCase().includes("amox") ? ["penicillin"] : [],
        }));
      }
    } catch (e) {
      console.warn("getMedicines API error:", e);
    }

    return [
      { id: "m1", name: "Paracetamol 650mg", default_dose: "1 tablet", category: "Analgesic", stock_quantity: 500, allergy_keywords: [] },
      { id: "m2", name: "Pantoprazole 40mg", default_dose: "1 tablet", category: "Antacid", stock_quantity: 320, allergy_keywords: [] },
      { id: "m3", name: "Cetirizine 10mg", default_dose: "1 tablet", category: "Antihistamine", stock_quantity: 240, allergy_keywords: [] },
      { id: "m4", name: "Amoxicillin 500mg", default_dose: "1 capsule", category: "Antibiotic", stock_quantity: 180, allergy_keywords: ["penicillin", "amoxicillin"] },
      { id: "m5", name: "ORS Electrolyte Sachet", default_dose: "1 sachet in 1L water", category: "Hydration", stock_quantity: 400, allergy_keywords: [] },
      { id: "m6", name: "Azithromycin 500mg", default_dose: "1 tablet", category: "Antibiotic", stock_quantity: 150, allergy_keywords: ["macrolide"] },
      { id: "m7", name: "Dextromethorphan Syrup", default_dose: "10ml", category: "Cough Suppressant", stock_quantity: 90, allergy_keywords: [] },
      { id: "m8", name: "Ibuprofen 400mg", default_dose: "1 tablet", category: "NSAID", stock_quantity: 300, allergy_keywords: ["nsaid", "aspirin"] },
      { id: "m9", name: "Domperidone 10mg", default_dose: "1 tablet", category: "Antiemetic", stock_quantity: 210, allergy_keywords: [] },
    ];
  }

  static getPresets(): PrescriptionPreset[] {
    return CLINICAL_PRESETS;
  }

  /**
   * Search students for autocomplete with fast client-side caching
   */
  static async searchStudents(query: string): Promise<StudentSearchResult[]> {
    if (!query || query.trim().length < 1) return [];
    const normalized = query.trim().toLowerCase();

    try {
      const res = await fetch(`/api/doctor/students?query=${encodeURIComponent(query.trim())}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return data.students || [];
      }
    } catch (e) {
      console.warn("searchStudents API error:", e);
    }
    return [];
  }

  /**
   * Fetch student profile by roll number via API
   */
  static async getStudentByRoll(rollNumber: string): Promise<StudentFullProfile | null> {
    if (!rollNumber) return null;
    try {
      const res = await fetch(
        `/api/doctor/students?rollNumber=${encodeURIComponent(rollNumber.trim())}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          const s = data.student;
          const isDayScholar =
            s.residence_type === "day_scholar" ||
            s.residence_type === "Day Scholar" ||
            s.hostel_status === "Day Scholar";

          return {
            id: s.id,
            roll_number: s.roll_number,
            name: s.name,
            branch: s.branch,
            year: s.year,
            phone: s.phone || "+91 98765 43210",
            hostel_status: isDayScholar ? "Day Scholar" : "Hosteler",
            hostel_name: isDayScholar ? undefined : "Campus Hostel",
            room_number: isDayScholar ? undefined : s.room_number || "—",
            avatar_url: s.photo_path || "",
            allergies: Array.isArray(s.allergies)
              ? s.allergies
              : typeof s.allergies === "string" && s.allergies
              ? [s.allergies]
              : ["NKDA (No Known Drug Allergies)"],
            meal_times: s.meal_times || {
              breakfast: "08:30:00",
              lunch: "13:00:00",
              dinner: "20:00:00",
            },
          };
        }
      }
    } catch (e) {
      console.warn("getStudentByRoll API error:", e);
    }

    return null;
  }

  /**
   * Fetch past visit history for selected student
   */
  static async getStudentHistory(studentId: string): Promise<VisitHistoryEntry[]> {
    if (!studentId) return [];
    try {
      const res = await fetch(`/api/doctor/history?studentId=${encodeURIComponent(studentId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return (data.history || []).map((v: any) => ({
          id: v.id,
          date: new Date(v.visit_date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          doctor_name: v.doctor_name || "Campus Doctor",
          problem_category: v.problem_category,
          notes: v.notes,
          medicines: [],
          outcome: v.status || "active",
        }));
      }
    } catch (e) {
      console.warn("getStudentHistory API error:", e);
    }
    return [];
  }

  /**
   * Fetch today's patients seen by authenticated doctor
   */
  static async getTodayPatients(doctorId?: string): Promise<TodayPatientItem[]> {
    try {
      const res = await fetch("/api/doctor/today", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return (data.todayPatients || []).map((p: any) => ({
          id: p.id,
          roll_number: p.roll_number,
          student_name: p.student_name,
          branch: "Campus",
          problem: p.problem_category,
          time: p.consultation_time,
          status: p.status === "active" ? "alarms_active" : "doses_confirmed",
        }));
      }
    } catch (e) {
      console.warn("getTodayPatients API error:", e);
    }
    return [];
  }

  /**
   * Fetch alerts for authenticated doctor
   */
  static async getAlerts(doctorId?: string): Promise<DoctorAlertItem[]> {
    try {
      const res = await fetch("/api/doctor/alerts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return (data.alerts || []).map((a: any) => ({
          id: a.id,
          student_id: a.student_id,
          student_name: a.student_name,
          roll_number: a.roll_number,
          problem: a.problem_category,
          reason: a.reason,
          time: new Date(a.reported_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          acknowledged: a.status === "resolved",
          priority: a.severity || "red",
        }));
      }
    } catch (e) {
      console.warn("getAlerts API error:", e);
    }
    return [];
  }

  /**
   * Fetches full patient history records for doctor's consultations
   */
  static async getDoctorRecords(
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DoctorPatientRecord[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/doctor/records?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        return (data.records || []).map((r: any) => ({
          id: r.id,
          visit_date: r.visit_date,
          student_name: r.student_name,
          roll_number: r.roll_number,
          branch: r.branch,
          problem_category: r.problem_category,
          clinical_notes: r.clinical_notes || "OPD consultation",
          medications_summary: (r.medications || []).join(", "),
          status: r.status,
          recovery_response: r.recovery_response,
          doses_confirmed_summary: r.doses_summary,
        }));
      }
    } catch (e) {
      console.warn("getDoctorRecords API error:", e);
    }
    return [];
  }

  /**
   * Submits a full consultation visit and dose schedule via API
   */
  static async submitVisit(
    payload: VisitSubmissionPayload,
    doctorId?: string
  ): Promise<{ success: boolean; visitId: string; message: string }> {
    const res = await fetch("/api/doctor/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to record consultation");
    }

    const data = await res.json();
    return data;
  }

  static async recordVisitAndPrescription(
    payload: VisitSubmissionPayload,
    doctorId?: string
  ): Promise<{ success: boolean; visitId: string; message: string }> {
    return this.submitVisit(payload, doctorId);
  }
}
