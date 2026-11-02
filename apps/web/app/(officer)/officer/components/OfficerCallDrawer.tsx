"use client";

import React, { useState } from "react";

interface OfficerCallDrawerProps {
  alert?: {
    id: string;
    student_name: string;
    roll_number: string;
    branch: string;
    phone: string;
    reason: string;
  } | null;
  alertId?: string;
  studentName?: string;
  rollNumber?: string;
  branch?: string;
  phone?: string;
  reason?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OfficerCallDrawer({
  alert,
  alertId,
  studentName,
  rollNumber,
  branch,
  phone,
  reason,
  isOpen,
  onClose,
  onSuccess,
}: OfficerCallDrawerProps) {
  const [outcome, setOutcome] = useState<string>("Reached and fine");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const id = alert?.id || alertId;
  const sName = alert?.student_name || studentName || "Student";
  const sRoll = alert?.roll_number || rollNumber || "";
  const sBranch = alert?.branch || branch || "";
  const sPhone = alert?.phone || phone || "";
  const sReason = alert?.reason || reason || "Alert Flagged";

  if (!id) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/officer/call-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: id,
          outcome,
          notes,
          resolveAlert: outcome === "Reached and fine",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit call log");
      }

      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit call log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const outcomeOptions = [
    {
      id: "Reached and fine",
      label: "Reached and fine",
      desc: "Student verified stable; resolves active alert.",
    },
    {
      id: "Reached and advised a visit",
      label: "Reached and advised a visit",
      desc: "Advised in-person evaluation at OPD Clinic.",
    },
    {
      id: "Not reached",
      label: "Not reached",
      desc: "Unanswered or switched off; will retry outreach.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity"
        onClick={onClose}
      />

      {/* 440px Panel */}
      <div className="relative w-full max-w-[440px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E5E7EB]">
        {/* Header */}
        <div className="h-[60px] px-6 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif text-[17px] font-bold text-[#0F1B33]">
              Log Outreach Call
            </h3>
            <p className="text-[12px] text-[#6B7280]">
              {sName} {sRoll ? `(${sRoll})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F1B33] hover:bg-slate-50 flex items-center justify-center transition-colors text-[16px] cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-[12px] text-[#B91C1C] bg-[#FFF5F5] border border-[#FEE2E2] rounded-[6px]">
              {errorMsg}
            </div>
          )}

          {/* Student Banner */}
          <div className="p-3 rounded-[8px] bg-[#F9FAFB] border border-[#E5E7EB] space-y-1 text-[13px] font-sans">
            <div className="flex justify-between items-baseline">
              <span className="text-[#6B7280]">Reason:</span>
              <span className="font-semibold text-[#B91C1C]">{sReason}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#6B7280]">Phone:</span>
              <span className="font-mono text-[#0F1B33]">{sPhone}</span>
            </div>
          </div>

          {/* Call Outcome Options */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
              CALL OUTCOME
            </label>
            <div className="space-y-2">
              {outcomeOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-[6px] border cursor-pointer transition-colors ${
                    outcome === opt.id
                      ? "border-[#0F1B33] bg-[#F9FAFB]"
                      : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <input
                    type="radio"
                    name="drawer-outcome"
                    value={opt.id}
                    checked={outcome === opt.id}
                    onChange={() => setOutcome(opt.id)}
                    className="mt-0.5 text-[#0F1B33] focus:ring-[#0F1B33]"
                  />
                  <div>
                    <div className="text-[13px] font-medium text-[#0F1B33]">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Outreach Notes */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
              NOTES
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record notes on student condition, advised care, or call attempts..."
              className="w-full text-[13px] p-2.5 border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0F1B33] resize-none"
            />
          </div>

          {/* Submit */}
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
  );
}
