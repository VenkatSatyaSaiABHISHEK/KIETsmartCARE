"use client";

import React, { useState } from "react";
import { OfficerAlertItem, CallOutcome } from "@/lib/officer/types";

interface CaseDrawerProps {
  alert: OfficerAlertItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitCallLog: (
    alertId: string,
    outcome: CallOutcome,
    notes: string
  ) => Promise<void>;
}

export function CaseDrawer({
  alert,
  isOpen,
  onClose,
  onSubmitCallLog,
}: CaseDrawerProps) {
  const [outcome, setOutcome] = useState<CallOutcome>("Reached and fine");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitCallLog(alert.id, outcome, notes);
      setNotes("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit outreach log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const caseDetails = alert.case_details || {
    problem_category: "General Health",
    medicines: [],
    doses_confirmed: 0,
    total_doses: 0,
    recovery_answer: alert.reason,
  };

  const outcomeOptions: Array<{ id: CallOutcome; label: string; desc: string }> = [
    {
      id: "Reached and fine",
      label: "Reached and fine",
      desc: "Student verified stable / resolved symptoms.",
    },
    {
      id: "Reached and advised to visit doctor",
      label: "Reached and advised a visit",
      desc: "Advised in-person evaluation at OPD Clinic.",
    },
    {
      id: "Not reached",
      label: "Not reached",
      desc: "Unanswered or unreachable; will retry.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity"
        onClick={onClose}
      />

      {/* 460px Slide-out Drawer */}
      <div className="relative w-full max-w-[460px] bg-white h-full flex flex-col z-10 border-l border-[#E5E7EB] shadow-2xl">
        {/* Header */}
        <div className="h-[60px] px-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div className="flex items-baseline gap-2 truncate">
            <h2 className="font-serif text-[18px] font-bold text-[#0F1B33] truncate">
              {alert.student_name}
            </h2>
            <span className="font-mono text-[12px] text-[#6B7280] tabular-nums shrink-0">
              {alert.roll_number}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F1B33] hover:bg-slate-50 flex items-center justify-center transition-colors text-[16px] cursor-pointer"
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-[12px] text-[#B91C1C] bg-[#FFF5F5] border border-[#FEE2E2] rounded-[6px]">
              {errorMsg}
            </div>
          )}

          {/* Limited Case Overview */}
          <div className="space-y-3 pb-4 border-b border-[#E5E7EB]">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              CLINICAL SUMMARY
            </div>

            <div className="space-y-2 text-[13px] font-sans">
              <div className="flex justify-between items-baseline">
                <span className="text-[#6B7280]">Problem Category:</span>
                <span className="font-medium text-[#0F1B33]">
                  {caseDetails.problem_category}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-[#6B7280]">Prescribed Medicines:</span>
                <span className="font-medium text-[#0F1B33] text-right truncate max-w-[220px]">
                  {caseDetails.medicines?.length > 0
                    ? caseDetails.medicines.join(", ")
                    : "Standard OPD prescription"}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-[#6B7280]">Dose Adherence:</span>
                <span className="font-medium text-[#0F1B33] tabular-nums">
                  {caseDetails.doses_confirmed ?? 0} of {caseDetails.total_doses ?? 0} doses confirmed
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-[#6B7280]">Recovery Response:</span>
                <span className="font-semibold text-[#B91C1C]">
                  {caseDetails.recovery_answer || alert.reason}
                </span>
              </div>

              {caseDetails.side_effects && (
                <div className="pt-1 text-[12px] text-[#B91C1C] bg-[#FFF5F5] p-2.5 rounded-[6px]">
                  <strong>Side Effect:</strong> {caseDetails.side_effects}
                </div>
              )}
            </div>
          </div>

          {/* Direct Phone Call Button */}
          <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB]">
            <div>
              <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                STUDENT CONTACT
              </div>
              <div className="font-mono text-[13px] text-[#0F1B33] font-medium mt-0.5">
                {alert.phone}
              </div>
            </div>
            <a
              href={`tel:${alert.phone}`}
              className="inline-flex items-center justify-center h-8 px-4 rounded-[6px] bg-[#0F1B33] text-white text-[12px] font-medium hover:bg-[#1A2D54] transition-colors"
            >
              Call student
            </a>
          </div>

          {/* Call Outreach Log Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              LOG TELEPHONIC OUTREACH
            </div>

            {/* Outcome Selection */}
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-[#0F1B33]">
                Call Outcome
              </label>
              <div className="space-y-1.5">
                {outcomeOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-[6px] border cursor-pointer transition-colors ${
                      outcome === opt.id
                        ? "border-[#0F1B33] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={opt.id}
                      checked={outcome === opt.id}
                      onChange={() => setOutcome(opt.id)}
                      className="mt-0.5 text-[#0F1B33] focus:ring-[#0F1B33]"
                    />
                    <div>
                      <div className="text-[13px] font-medium text-[#0F1B33]">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#0F1B33]">
                Clinical / Outreach Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail student's reported status, symptom timeline, or doctor instructions..."
                rows={3}
                className="w-full text-[13px] p-2.5 border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0F1B33] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 text-[13px] font-medium text-[#6B7280] hover:text-[#0F1B33] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-8 px-5 rounded-[6px] bg-[#0F1B33] text-white text-[13px] font-medium hover:bg-[#1A2D54] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save outcome"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
