"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  StudentFullProfile,
  VisitHistoryEntry,
  MedicineCatalogItem,
  PrescriptionPreset,
  PrescriptionRow,
  TodayPatientItem,
  DoctorAlertItem,
  DaySchedulePreviewItem,
} from "@/lib/doctor/types";
import { DoctorService } from "@/lib/doctor/service";
import { DoctorHeader } from "./components/DoctorHeader";
import { StudentSearchBox } from "./components/StudentSearchBox";
import { StudentInfoPanel } from "./components/StudentInfoPanel";
import { NewVisitPanel } from "./components/NewVisitPanel";
import { ScheduleReviewModal } from "./components/ScheduleReviewModal";
import { TodayPatientsView } from "./components/TodayPatientsView";
import { DoctorAlertsView } from "./components/DoctorAlertsView";
import {
  CheckCircle2,
  Stethoscope,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function DoctorPortalPage() {
  // Navigation tab: 'desk' | 'today' | 'alerts'
  const [activeTab, setActiveTab] = useState<"desk" | "today" | "alerts">("desk");

  // Catalog and Presets
  const [medicinesCatalog, setMedicinesCatalog] = useState<MedicineCatalogItem[]>([]);
  const [presets, setPresets] = useState<PrescriptionPreset[]>([]);
  const [todayPatients, setTodayPatients] = useState<TodayPatientItem[]>([]);
  const [doctorAlerts, setDoctorAlerts] = useState<DoctorAlertItem[]>([]);

  // Active student in Consultation Desk
  const [activeStudent, setActiveStudent] = useState<StudentFullProfile | null>(null);
  const [studentHistory, setStudentHistory] = useState<VisitHistoryEntry[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  // New Visit Form State
  const [problemCategory, setProblemCategory] = useState<string>("");
  const [clinicalNotes, setClinicalNotes] = useState<string>("");
  const [medicineRows, setMedicineRows] = useState<PrescriptionRow[]>([]);
  const [followUpDate, setFollowUpDate] = useState<string>("");

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedulePreview, setSchedulePreview] = useState<DaySchedulePreviewItem[]>([]);

  // Submission Success Notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial catalog, presets, today patients, and alerts
  useEffect(() => {
    async function loadInitialData() {
      const [meds, pre, today, alerts] = await Promise.all([
        DoctorService.getMedicines(),
        DoctorService.getPresets(),
        DoctorService.getTodayPatients(),
        DoctorService.getAlerts(),
      ]);
      setMedicinesCatalog(meds);
      setPresets(pre);
      setTodayPatients(today);
      setDoctorAlerts(alerts);
    }
    loadInitialData();
  }, []);

  // Handler: Select and load student by roll number
  const handleSelectStudent = useCallback(async (rollNumber: string) => {
    setIsSearchingStudent(true);
    setSuccessMessage(null);
    try {
      const student = await DoctorService.getStudentByRoll(rollNumber);
      if (student) {
        setActiveStudent(student);
        const history = await DoctorService.getStudentHistory(student.id);
        setStudentHistory(history);

        // Reset form for fresh prescription
        setProblemCategory("");
        setClinicalNotes("");
        setMedicineRows([]);
        setFollowUpDate("");
      } else {
        alert(`No student found for roll number: ${rollNumber}`);
      }
    } finally {
      setIsSearchingStudent(false);
    }
  }, []);

  // Handler: Trigger Review Modal
  const handleOpenReview = () => {
    if (!activeStudent) return;
    const preview = DoctorService.calculateSchedulePreview(
      medicineRows,
      activeStudent.meal_times
    );
    setSchedulePreview(preview);
    setIsReviewOpen(true);
  };

  // Handler: Submit Visit and Reset
  const handleSubmitVisit = async () => {
    if (!activeStudent) return;
    setIsSubmitting(true);
    try {
      const result = await DoctorService.submitVisit({
        student_id: activeStudent.id,
        roll_number: activeStudent.roll_number,
        problem_category: problemCategory,
        clinical_notes: clinicalNotes,
        medicines: medicineRows,
        follow_up_date: followUpDate || undefined,
      });

      if (result.success) {
        setIsReviewOpen(false);
        setSuccessMessage(result.message);

        // Refresh today patients list
        const updatedToday = await DoctorService.getTodayPatients();
        setTodayPatients(updatedToday);

        // Reset consultation desk for the next student
        setActiveStudent(null);
        setStudentHistory([]);
        setProblemCategory("");
        setClinicalNotes("");
        setMedicineRows([]);
        setFollowUpDate("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Acknowledge Alert
  const handleMarkReviewed = async (alertId: string) => {
    await DoctorService.markAlertReviewed(alertId);
    const updatedAlerts = await DoctorService.getAlerts();
    setDoctorAlerts(updatedAlerts);
  };

  // Handler: Open Case from Today or Alerts View (loads into desk without URL exposure)
  const handleOpenCase = (rollNumber: string) => {
    setActiveTab("desk");
    handleSelectStudent(rollNumber);
  };

  const activeAlertCount = doctorAlerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* 1. Header with Doctor credentials & navigation */}
      <DoctorHeader
        doctorName="Dr. Alok Verma, MBBS, MD"
        doctorRole="Campus Clinic OPD Doctor"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayCount={todayPatients.length}
        alertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Success Banner if visit was just submitted */}
        {successMessage && (
          <div className="flex items-center justify-between rounded-12 border border-emerald-200 bg-emerald-50 p-4 shadow-sm text-emerald-950 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Prescription Successfully Recorded & Pushed
                </h4>
                <p className="text-xs text-emerald-800">{successMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* View 1: Consultation Desk (The Working Screen) */}
        {activeTab === "desk" && (
          <div className="space-y-6">
            {/* Top Search Bar */}
            <div className="rounded-12 bg-white p-3 shadow-xs border border-doctor-border">
              <StudentSearchBox
                onSelectStudent={handleSelectStudent}
                isLoading={isSearchingStudent}
              />
            </div>

            {/* Split Screen Layout: Left Panel (Student Info) & Right Panel (New Visit) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left Panel: Student Information & History */}
              <div className="lg:col-span-5">
                <StudentInfoPanel
                  student={activeStudent}
                  history={studentHistory}
                  isLoading={isSearchingStudent}
                />
              </div>

              {/* Right Panel: New Visit & Structured Prescription */}
              <div className="lg:col-span-7">
                <NewVisitPanel
                  student={activeStudent}
                  medicinesCatalog={medicinesCatalog}
                  presets={presets}
                  problemCategory={problemCategory}
                  setProblemCategory={setProblemCategory}
                  clinicalNotes={clinicalNotes}
                  setClinicalNotes={setClinicalNotes}
                  medicineRows={medicineRows}
                  setMedicineRows={setMedicineRows}
                  followUpDate={followUpDate}
                  setFollowUpDate={setFollowUpDate}
                  onOpenReview={handleOpenReview}
                />
              </div>
            </div>
          </div>
        )}

        {/* View 2: Today's Patients */}
        {activeTab === "today" && (
          <TodayPatientsView
            patients={todayPatients}
            onSelectRoll={handleOpenCase}
          />
        )}

        {/* View 3: My Red Alerts */}
        {activeTab === "alerts" && (
          <DoctorAlertsView
            alerts={doctorAlerts}
            onSelectRoll={handleOpenCase}
            onMarkReviewed={handleMarkReviewed}
          />
        )}
      </main>

      {/* Review Modal: Day-by-Day Meal Anchored Preview */}
      <ScheduleReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={handleSubmitVisit}
        isSubmitting={isSubmitting}
        student={activeStudent}
        problemCategory={problemCategory}
        clinicalNotes={clinicalNotes}
        medicines={medicineRows}
        schedulePreview={schedulePreview}
        followUpDate={followUpDate}
      />
    </div>
  );
}
