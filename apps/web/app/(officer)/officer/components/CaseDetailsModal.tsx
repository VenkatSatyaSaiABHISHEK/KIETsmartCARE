"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertOctagon,
  Clock,
  User,
  History,
  Send,
} from "lucide-react";
import { OfficerAlertItem, CallOutcome } from "@/lib/officer/types";

interface CaseDetailsModalProps {
  alert: OfficerAlertItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitCallLog: (
    alertId: string,
    outcome: CallOutcome,
    notes: string
  ) => Promise<void>;
}

export function CaseDetailsModal({
  alert,
  isOpen,
  onClose,
  onSubmitCallLog,
}: CaseDetailsModalProps) {
  const [outcome, setOutcome] = useState<CallOutcome>("Reached and advised to visit doctor");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);

  if (!alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      window.alert("Please enter brief outreach notes before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitCallLog(alert.id, outcome, notes);
      setNotes("");
      setCallInitiated(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRed = alert.alert_level === "red";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge
                variant={isRed ? "destructive" : "outline"}
                className={
                  isRed
                    ? "bg-red-600 text-white font-bold"
                    : "border-amber-300 text-amber-800 bg-amber-50 font-bold"
                }
              >
                {alert.reason.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                Case #{alert.id}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Reported {alert.reported_at}
            </span>
          </div>

          <DialogTitle className="text-xl font-bold text-[#0B1736] mt-2">
            Flagged Escalation: {alert.student_name}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Roll: <span className="font-mono font-semibold text-slate-700">{alert.roll_number}</span> &bull; {alert.branch} (Year {alert.year}) &bull; Prescribing Doctor: {alert.doctor_name}
          </DialogDescription>
        </DialogHeader>

        {/* Audit Log Transparency Banner */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] text-blue-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-[#2563EB] shrink-0" />
            <span>
              <strong>Privacy Protocol:</strong> Full clinical doctor notes are sealed. Only high-level category & adherence metrics are revealed. View event written to <code>audit_logs</code>.
            </span>
          </div>
        </div>

        {/* Limited Case Panel (Problem category, medicines, dose confirmation summary, recovery answer) */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Problem Category
              </span>
              <span className="text-sm font-bold text-[#0B1736]">
                {alert.case_details.problem_category}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Recovery Answer
              </span>
              <span
                className={`text-sm font-bold ${
                  alert.case_details.recovery_answer === "Worse"
                    ? "text-red-600"
                    : alert.case_details.recovery_answer === "Same"
                    ? "text-amber-600"
                    : "text-slate-700"
                }`}
              >
                {alert.case_details.recovery_answer || "Unanswered"}
              </span>
            </div>
          </div>

          {alert.case_details.side_effects && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-red-950">
              <span className="font-bold block text-[11px]">
                Reported Symptoms / Side Effects:
              </span>
              <p className="mt-0.5 text-xs">{alert.case_details.side_effects}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Dose Adherence Summary
              </span>
              <span className="font-semibold text-slate-800">
                {alert.case_details.doses_confirmed} / {alert.case_details.total_doses} doses confirmed (
                {Math.round(
                  (alert.case_details.doses_confirmed /
                    alert.case_details.total_doses) *
                    100
                )}
                %)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                Prescribed Medicines
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {alert.case_details.medicines.map((med, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-white px-2 py-0.5 border border-slate-200 text-[10px] font-medium"
                  >
                    {med}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Large Telephonic Outreach Call Button */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div>
              <span className="text-xs font-bold text-[#0B1736] block">
                Direct Telephonic Outreach to Student
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Student Phone: {alert.phone}
              </span>
            </div>
            <a
              href={`tel:${alert.phone.replace(/\s+/g, "")}`}
              onClick={() => setCallInitiated(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <PhoneCall className="mr-2 h-4 w-4" />
              Call Student Now
            </a>
          </div>

          {/* Call Outcome Logging Form */}
          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Log Telephonic Call Outcome
              </span>
              <span className="text-[10px] text-slate-400">
                Appends to call_logs table
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Call Outcome *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    "Reached and fine",
                    "Reached and advised to visit doctor",
                    "Not reached",
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOutcome(opt)}
                    className={`rounded-lg p-2 text-xs font-medium border text-left transition-all ${
                      outcome === opt
                        ? "border-[#2563EB] bg-blue-50/70 text-[#2563EB] font-bold shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Officer Clinical / Outreach Notes *
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document conversation details, advice given, or callback scheduling..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs h-9"
              >
                {isSubmitting ? (
                  "Saving to call_logs..."
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Save to call_logs & Update Case
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Close Panel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
