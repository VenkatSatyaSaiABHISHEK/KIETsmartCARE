"use client";

import React from "react";
import { TabletGroupState } from "./TabletPrescriptionForm";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  studentName: string;
  allergies?: string[];
  selectedProblems: string[];
  otherProblemText?: string;
  tabletGroups: TabletGroupState[];
  followUp: string;
  customFollowUpDate?: string;
}

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  studentName,
  allergies = [],
  selectedProblems,
  otherProblemText,
  tabletGroups,
  followUp,
  customFollowUpDate,
}: ReviewModalProps) {
  if (!isOpen) return null;

  // Group scheduled doses across tablet groups by target_date + timeStr
  interface TimeSlotSummary {
    key: string;
    dayLabel: string;
    timeStr: string;
    mealRelation: string;
    tabletsSummary: string[];
  }

  const timeMap = new Map<string, TimeSlotSummary>();

  tabletGroups.forEach((group) => {
    group.schedule.forEach((dose) => {
      const timeKey = `${dose.dateStr}_${dose.timeStr}_${dose.mealRelation}`;
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          key: timeKey,
          dayLabel: dose.dayLabel,
          timeStr: dose.timeStr,
          mealRelation: dose.mealRelation,
          tabletsSummary: [],
        });
      }
      timeMap.get(timeKey)!.tabletsSummary.push(
        `${group.label} x ${group.tabletsPerDose} tablet${
          group.tabletsPerDose > 1 ? "s" : ""
        }`
      );
    });
  });

  const sortedSlots = Array.from(timeMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  const validAllergies = (allergies || []).filter(
    (a) => a && !a.toLowerCase().includes("nkda") && !a.toLowerCase().includes("none")
  );

  const followUpDisplay =
    followUp === "tomorrow"
      ? "Tomorrow"
      : followUp === "day_after"
      ? "Day after tomorrow"
      : followUp === "custom" && customFollowUpDate
      ? customFollowUpDate
      : "None requested";

  const allProblems = [...selectedProblems];
  if (otherProblemText && allProblems.includes("Other")) {
    allProblems[allProblems.indexOf("Other")] = `Other (${otherProblemText})`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[560px] bg-white rounded-[16px] shadow-2xl border border-[#E5E7EB] p-7 flex flex-col space-y-6 z-10 select-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="font-serif text-[20px] font-bold text-[#0F1B33]">
              Review & Send Consultation
            </h3>
            <p className="text-[13px] font-sans text-[#6B7280] mt-0.5">
              Prescription schedule for {studentName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F1B33] flex items-center justify-center text-[16px]"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Allergy Alert */}
          {validAllergies.length > 0 && (
            <div className="p-3 rounded-[8px] bg-[#FFF5F5] border border-[#FEE2E2] text-[13px] font-sans">
              <span className="font-semibold text-[#B91C1C]">Allergy Warning: </span>
              <span className="text-[#B91C1C] font-medium">{validAllergies.join(", ")}</span>
            </div>
          )}

          {/* Diagnosed Conditions */}
          <div className="space-y-1">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              DIAGNOSED PROBLEMS
            </div>
            <div className="text-[14px] font-medium text-[#0F1B33]">
              {allProblems.join(", ") || "General Health Review"}
            </div>
          </div>

          {/* Grouped Time Schedule */}
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              DOSES BY TIME
            </div>

            <div className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
              {sortedSlots.map((slot) => (
                <div key={slot.key} className="py-2.5 flex items-baseline justify-between gap-4">
                  <div className="font-medium text-[#0F1B33]">
                    {slot.dayLabel}, {slot.mealRelation} meal ({slot.timeStr}):
                  </div>
                  <div className="text-right text-[#1D4ED8] font-semibold">
                    {slot.tabletsSummary.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up */}
          <div className="pt-2 border-t border-[#E5E7EB] flex items-baseline justify-between text-[13px] font-sans">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              FOLLOW-UP DATE
            </span>
            <span className="font-medium text-[#0F1B33]">{followUpDisplay}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-[10px] text-[13px] font-medium text-[#6B7280] hover:text-[#0F1B33] cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-10 px-6 rounded-[10px] bg-[#1D4ED8] text-white text-[14px] font-medium hover:bg-[#1E40AF] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? "Sending..." : "Submit and Send to Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
