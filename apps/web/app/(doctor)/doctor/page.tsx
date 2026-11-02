"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudentFullProfile, VisitHistoryEntry } from "@/lib/doctor/types";
import { DoctorService } from "@/lib/doctor/service";
import { IdleHomeScreen } from "./components/IdleHomeScreen";
import { StudentCard } from "./components/StudentCard";
import {
  TabletPrescriptionForm,
  TabletGroupState,
  ScheduledDoseItem,
} from "./components/TabletPrescriptionForm";
import { FloatingBottomBar } from "./components/FloatingBottomBar";
import { ReviewModal } from "./components/ReviewModal";

export const dynamic = "force-dynamic";

function DoctorPortalContent() {
  const searchParams = useSearchParams();
  const initialRoll = searchParams.get("roll");

  // Active student state
  const [activeStudent, setActiveStudent] = useState<StudentFullProfile | null>(null);
  const [recentVisits, setRecentVisits] = useState<VisitHistoryEntry[]>([]);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);

  // Unsaved changes confirmation dialog
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [pendingRollNumber, setPendingRollNumber] = useState<string | null>(null);

  // Top Search in Consultation Mode
  const [compactSearchVal, setCompactSearchVal] = useState("");
  const [compactSearchResults, setCompactSearchResults] = useState<any[]>([]);

  // Quiet Consultation Timer (ticking every second from 00:00)
  const [consultationSeconds, setConsultationSeconds] = useState(0);

  // Prescription Form State
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [otherProblemText, setOtherProblemText] = useState("");
  const [tabletGroups, setTabletGroups] = useState<TabletGroupState[]>([
    {
      id: "tablet-1",
      label: "Tablet 1",
      tabletsPerDose: 1,
      totalDoses: 3,
      schedule: [
        {
          id: "dose-1",
          slot: "morning",
          timeStr: "08:00",
          mealRelation: "after",
          dayLabel: "Today",
          dateStr: new Date().toISOString().slice(0, 10),
          displayLabel: "Today morning, after food",
        },
        {
          id: "dose-2",
          slot: "afternoon",
          timeStr: "13:30",
          mealRelation: "after",
          dayLabel: "Today",
          dateStr: new Date().toISOString().slice(0, 10),
          displayLabel: "Today afternoon, after food",
        },
        {
          id: "dose-3",
          slot: "night",
          timeStr: "20:30",
          mealRelation: "after",
          dayLabel: "Today",
          dateStr: new Date().toISOString().slice(0, 10),
          displayLabel: "Today night, after food",
        },
      ],
    },
  ]);

  const [followUp, setFollowUp] = useState<string>("none");
  const [customFollowUpDate, setCustomFollowUpDate] = useState<string>("");

  // Review & Submit State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationBanner, setConfirmationBanner] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeStudent) {
      setConsultationSeconds(0);
      interval = setInterval(() => {
        setConsultationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setConsultationSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeStudent]);

  const formatTimer = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Check if form has unsaved work
  const hasUnsavedChanges = (): boolean => {
    return (
      selectedProblems.length > 0 ||
      tabletGroups.length > 1 ||
      tabletGroups[0].totalDoses !== 3 ||
      tabletGroups[0].tabletsPerDose !== 1 ||
      followUp !== "none"
    );
  };

  // Load student profile & past visits
  const handleOpenStudent = useCallback(
    async (rollNumber: string, force = false) => {
      if (!force && activeStudent && hasUnsavedChanges()) {
        setPendingRollNumber(rollNumber);
        setIsDiscardDialogOpen(true);
        return;
      }

      setIsLoadingStudent(true);
      setSubmissionError(null);
      setConfirmationBanner(null);

      try {
        const student = await DoctorService.getStudentByRoll(rollNumber);
        if (student) {
          setActiveStudent(student);
          // Load past visits
          const history = await DoctorService.getStudentHistory(student.id);
          setRecentVisits(history);

          // Reset form to clean default
          setSelectedProblems([]);
          setOtherProblemText("");
          setTabletGroups([
            {
              id: "tablet-1",
              label: "Tablet 1",
              tabletsPerDose: 1,
              totalDoses: 3,
              schedule: [
                {
                  id: "dose-1",
                  slot: "morning",
                  timeStr: "08:00",
                  mealRelation: "after",
                  dayLabel: "Today",
                  dateStr: new Date().toISOString().slice(0, 10),
                  displayLabel: "Today morning, after food",
                },
                {
                  id: "dose-2",
                  slot: "afternoon",
                  timeStr: "13:30",
                  mealRelation: "after",
                  dayLabel: "Today",
                  dateStr: new Date().toISOString().slice(0, 10),
                  displayLabel: "Today afternoon, after food",
                },
                {
                  id: "dose-3",
                  slot: "night",
                  timeStr: "20:30",
                  mealRelation: "after",
                  dayLabel: "Today",
                  dateStr: new Date().toISOString().slice(0, 10),
                  displayLabel: "Today night, after food",
                },
              ],
            },
          ]);
          setFollowUp("none");
          setCustomFollowUpDate("");
          setIsReviewOpen(false);
          setCompactSearchVal("");
        } else {
          setSubmissionError("No student found for that roll number.");
        }
      } catch (err) {
        console.warn("Failed to load student:", err);
      } finally {
        setIsLoadingStudent(false);
      }
    },
    [activeStudent]
  );

  const confirmDiscardAndOpen = () => {
    setIsDiscardDialogOpen(false);
    if (pendingRollNumber) {
      handleOpenStudent(pendingRollNumber, true);
      setPendingRollNumber(null);
    }
  };

  const cancelDiscard = () => {
    setIsDiscardDialogOpen(false);
    setPendingRollNumber(null);
  };

  // Compact Search autocomplete in consultation mode
  useEffect(() => {
    if (!compactSearchVal.trim()) {
      setCompactSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await DoctorService.searchStudents(compactSearchVal.trim());
        setCompactSearchResults(results);
      } catch {
        setCompactSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [compactSearchVal]);

  // Problem toggle handler
  const handleToggleProblem = (problem: string) => {
    setSelectedProblems((prev) =>
      prev.includes(problem) ? prev.filter((p) => p !== problem) : [...prev, problem]
    );
  };

  // Tablet Groups Handlers
  const handleUpdateTabletGroup = (index: number, updated: TabletGroupState) => {
    setTabletGroups((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleAddTabletGroup = () => {
    if (tabletGroups.length >= 4) return;
    const nextNum = tabletGroups.length + 1;
    const newGroup: TabletGroupState = {
      id: `tablet-${nextNum}`,
      label: `Tablet ${nextNum}`,
      tabletsPerDose: 1,
      totalDoses: 2,
      schedule: [
        {
          id: `dose-${nextNum}-1`,
          slot: "morning",
          timeStr: "08:00",
          mealRelation: "after",
          dayLabel: "Today",
          dateStr: new Date().toISOString().slice(0, 10),
          displayLabel: "Today morning, after food",
        },
        {
          id: `dose-${nextNum}-2`,
          slot: "night",
          timeStr: "20:30",
          mealRelation: "after",
          dayLabel: "Today",
          dateStr: new Date().toISOString().slice(0, 10),
          displayLabel: "Today night, after food",
        },
      ],
    };
    setTabletGroups((prev) => [...prev, newGroup]);
  };

  const handleRemoveTabletGroup = (index: number) => {
    if (tabletGroups.length <= 1) return;
    setTabletGroups((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      // Re-label cleanly
      return filtered.map((g, idx) => ({
        ...g,
        label: `Tablet ${idx + 1}`,
      }));
    });
  };

  // Follow-up handler
  const handleChangeFollowUp = (val: string, customDate?: string) => {
    setFollowUp(val);
    if (customDate) setCustomFollowUpDate(customDate);
  };

  // Calculate real summary text for bottom bar
  const generateSummaryText = (): string => {
    const problemsStr = selectedProblems.join(", ");
    const tabletsSummary = tabletGroups
      .map((g) => `${g.label}: ${g.tabletsPerDose} per dose, ${g.totalDoses} doses`)
      .join("; ");

    if (problemsStr && tabletsSummary) {
      return `${problemsStr}, ${tabletsSummary}`;
    }
    if (problemsStr) return problemsStr;
    if (tabletsSummary) return tabletsSummary;
    return "";
  };

  const isReadyToReview =
    selectedProblems.length > 0 &&
    tabletGroups.length > 0 &&
    tabletGroups.every((g) => g.schedule.length > 0);

  // Submit visit handler
  const handleSubmitConsultation = async () => {
    if (!activeStudent || !isReadyToReview) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      let finalFollowUpDate: string | undefined = undefined;
      const now = new Date();
      if (followUp === "tomorrow") {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        finalFollowUpDate = d.toISOString();
      } else if (followUp === "day_after") {
        const d = new Date(now);
        d.setDate(d.getDate() + 2);
        finalFollowUpDate = d.toISOString();
      } else if (followUp === "custom" && customFollowUpDate) {
        finalFollowUpDate = new Date(customFollowUpDate).toISOString();
      }

      const payload = {
        student_id: activeStudent.id,
        roll_number: activeStudent.roll_number,
        problems: selectedProblems,
        problem_category: selectedProblems[0] || "General Health",
        other_problem: otherProblemText || undefined,
        consultation_seconds: consultationSeconds,
        follow_up_date: finalFollowUpDate,
        tablet_groups: tabletGroups.map((g) => ({
          label: g.label,
          tablets_per_dose: g.tabletsPerDose,
          total_doses: g.totalDoses,
          schedule: g.schedule.map((slot, idx) => ({
            slot: slot.slot,
            scheduled_at: `${slot.dateStr}T${slot.timeStr}:00.000+05:30`,
            meal_relation: slot.mealRelation,
            tablets: g.tabletsPerDose,
            dose_number: idx + 1,
          })),
        })),
      };

      const res = await fetch("/api/doctor/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit consultation");
      }

      // Close review modal & show 2s confirmation
      setIsReviewOpen(false);
      setConfirmationBanner(`Sent to ${activeStudent.name}`);

      setTimeout(() => {
        // Return to idle screen & reset all state
        setActiveStudent(null);
        setConfirmationBanner(null);
        setSelectedProblems([]);
        setOtherProblemText("");
        setFollowUp("none");
      }, 2000);
    } catch (err: any) {
      setSubmissionError(err?.message || "Failed to save consultation. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load initial roll from URL if provided
  useEffect(() => {
    if (initialRoll) {
      handleOpenStudent(initialRoll);
    }
  }, [initialRoll, handleOpenStudent]);

  // If no student is open, render Idle Home Screen matching Image 2
  if (!activeStudent) {
    return (
      <div className="w-full flex-1 flex flex-col">
        {confirmationBanner && (
          <div className="w-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-2.5 rounded-[8px] text-[13px] font-medium text-center mb-4">
            {confirmationBanner}
          </div>
        )}
        <IdleHomeScreen
          onSelectStudent={handleOpenStudent}
          isLoadingStudent={isLoadingStudent}
          errorMessage={submissionError}
          onClearError={() => setSubmissionError(null)}
        />
      </div>
    );
  }

  // Active Consultation Screen matching Image 1
  return (
    <div className="w-full flex-1 flex flex-col md:h-[calc(100dvh-64px)] md:overflow-hidden select-none pb-24 md:pb-6">
      {/* Confirmation & Error Banners */}
      {confirmationBanner && (
        <div className="w-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-2 rounded-[8px] text-[13px] font-medium text-center my-2 shrink-0">
          {confirmationBanner}
        </div>
      )}
      {submissionError && (
        <div className="w-full bg-[#FFF5F5] border border-[#FEE2E2] text-[#B91C1C] px-4 py-2 rounded-[8px] text-[13px] font-medium text-center my-2 shrink-0">
          {submissionError}
        </div>
      )}
      {isLoadingStudent && (
        <div className="w-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] px-4 py-2 rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 my-2 shrink-0 animate-pulse">
          <svg className="animate-spin h-3.5 w-3.5 text-[#1D4ED8]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading student medical chart &amp; visit history...</span>
        </div>
      )}

      {/* 1. TOP BAR: Compact Search Bar + Consultation Timer */}
      <div className="pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 border-b border-[#E5E7EB]">
        {/* Compact Search Field (560px wide, 48px tall) */}
        <div className="relative w-full max-w-[560px]">
          <div className="w-full h-12 bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(15,27,51,0.04)] flex items-center px-4 gap-2.5 focus-within:border-[#1D4ED8]/40 transition-colors">
            <svg className="w-4 h-4 text-[#9CA3AF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search another student by roll number or name..."
              value={compactSearchVal}
              onChange={(e) => setCompactSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && compactSearchVal.trim()) {
                  e.preventDefault();
                  if (compactSearchResults.length > 0) {
                    handleOpenStudent(compactSearchResults[0].roll_number);
                  } else {
                    handleOpenStudent(compactSearchVal.trim());
                  }
                  setCompactSearchVal("");
                  setCompactSearchResults([]);
                }
              }}
              className="w-full h-full text-[13px] text-[#0F1B33] placeholder-[#9CA3AF] bg-transparent focus:outline-none"
            />
            {compactSearchVal.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCompactSearchVal("");
                  setCompactSearchResults([]);
                }}
                className="text-[#9CA3AF] hover:text-[#0F1B33] text-[14px] px-1 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {compactSearchResults.length > 0 && (
            <div className="absolute top-14 left-0 right-0 bg-white border border-[#E5E7EB] rounded-[10px] shadow-2xl z-40 divide-y divide-[#E5E7EB] overflow-hidden">
              {compactSearchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleOpenStudent(item.roll_number);
                    setCompactSearchVal("");
                    setCompactSearchResults([]);
                  }}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-[13px]"
                >
                  <div>
                    <span className="font-serif font-bold text-[#0F1B33]">
                      {item.name}
                    </span>
                    <span className="text-[#6B7280] text-[12px] ml-2">
                      {item.roll_number} • {item.branch}
                    </span>
                  </div>
                  <span className="text-[#1D4ED8] text-[12px] font-medium">Switch →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiet Timer: "In consultation 02:14" */}
        <div className="font-serif text-[18px] text-[#0F1B33] tabular-nums whitespace-nowrap self-end sm:self-auto">
          In consultation{" "}
          <span className="font-medium text-[#0F1B33] ml-1">
            {formatTimer(consultationSeconds)}
          </span>
        </div>
      </div>

      {/* 2. TWO-COLUMN LAYOUT (Desktop 100dvh, left ~32%, right ~68%) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 md:overflow-hidden">
        {/* LEFT COLUMN: Student Profile Card + Recent Visits */}
        <div className="lg:col-span-4 md:overflow-y-auto pr-1">
          <StudentCard student={activeStudent} recentVisits={recentVisits} />
        </div>

        {/* RIGHT COLUMN: Problem + Tablets Groups + Follow-up */}
        <div className="lg:col-span-8 md:overflow-y-auto pl-2 pr-1 pb-16">
          <TabletPrescriptionForm
            selectedProblems={selectedProblems}
            onToggleProblem={handleToggleProblem}
            otherProblemText={otherProblemText}
            onChangeOtherText={setOtherProblemText}
            tabletGroups={tabletGroups}
            onUpdateTabletGroup={handleUpdateTabletGroup}
            onAddTabletGroup={handleAddTabletGroup}
            onRemoveTabletGroup={handleRemoveTabletGroup}
            followUp={followUp}
            customFollowUpDate={customFollowUpDate}
            onChangeFollowUp={handleChangeFollowUp}
            studentMealTimes={activeStudent.meal_times}
          />
        </div>
      </div>

      {/* 3. FLOATING BOTTOM BAR (720px wide, centered) */}
      <FloatingBottomBar
        summaryText={generateSummaryText()}
        isReady={isReadyToReview}
        onReview={() => setIsReviewOpen(true)}
      />

      {/* 4. REVIEW MODAL */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={handleSubmitConsultation}
        isSubmitting={isSubmitting}
        studentName={activeStudent.name}
        allergies={activeStudent.allergies}
        selectedProblems={selectedProblems}
        otherProblemText={otherProblemText}
        tabletGroups={tabletGroups}
        followUp={followUp}
        customFollowUpDate={customFollowUpDate}
      />

      {/* 5. UNSAVED CHANGES DISCARD DIALOG */}
      {isDiscardDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white rounded-[14px] shadow-2xl border border-[#E5E7EB] p-6 max-w-[420px] w-full space-y-4">
            <h4 className="font-serif text-[18px] font-bold text-[#0F1B33]">
              Discard this consultation?
            </h4>
            <p className="text-[13px] font-sans text-[#6B7280]">
              You have unsaved prescription selections. Switching students now will discard them.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelDiscard}
                className="h-9 px-4 text-[13px] font-medium text-[#6B7280] hover:text-[#0F1B33]"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={confirmDiscardAndOpen}
                className="h-9 px-5 rounded-[8px] bg-[#B91C1C] text-white text-[13px] font-medium hover:bg-[#991B1B]"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorPortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#6B7280]">Loading doctor desk...</div>}>
      <DoctorPortalContent />
    </Suspense>
  );
}

