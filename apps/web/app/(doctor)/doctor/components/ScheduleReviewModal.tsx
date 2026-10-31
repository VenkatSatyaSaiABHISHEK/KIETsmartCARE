"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Send, Edit, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { DaySchedulePreviewItem, PrescriptionRow, StudentFullProfile } from "@/lib/doctor/types";

interface ScheduleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  student: StudentFullProfile | null;
  problemCategory: string;
  clinicalNotes?: string;
  medicines: PrescriptionRow[];
  schedulePreview: DaySchedulePreviewItem[];
  followUpDate?: string;
}

export function ScheduleReviewModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  student,
  problemCategory,
  clinicalNotes,
  medicines,
  schedulePreview,
  followUpDate,
}: ScheduleReviewModalProps) {
  if (!student) return null;

  const totalDoses = schedulePreview.reduce(
    (acc, day) => acc + day.slots.reduce((sAcc, slot) => sAcc + slot.medicines.length, 0),
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2 text-doctor-blue text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Pre-Dispatch Schedule Verification</span>
          </div>
          <DialogTitle className="text-xl font-bold text-doctor-navy">
            Review Mobile Adherence Schedule
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            This schedule will be synced to {student.name}&apos;s mobile device. Offline alarms will be configured tied to their meal times.
          </DialogDescription>
        </DialogHeader>

        {/* Student & Consultation Summary Banner */}
        <div className="rounded-xl border border-blue-100 bg-doctor-panel p-4 text-xs text-doctor-navy">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/50 pb-2">
            <div>
              <span className="font-bold text-sm text-doctor-navy">{student.name}</span>
              <span className="ml-2 font-mono text-slate-500">Roll: {student.roll_number}</span>
            </div>
            <span className="rounded bg-white px-2 py-0.5 font-semibold text-doctor-blue border border-blue-200">
              Problem: {problemCategory}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Total Medicines:</span>
              <span className="font-semibold">{medicines.length} items</span>
            </div>
            <div>
              <span className="text-slate-500 block">Course Duration:</span>
              <span className="font-semibold">{schedulePreview.length} Days</span>
            </div>
            <div>
              <span className="text-slate-500 block">Scheduled Doses:</span>
              <span className="font-semibold">{totalDoses} reminders</span>
            </div>
            <div>
              <span className="text-slate-500 block">Follow-up:</span>
              <span className="font-semibold">{followUpDate || "None specified"}</span>
            </div>
          </div>

          {clinicalNotes && (
            <div className="mt-2 text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-blue-100">
              <span className="font-semibold text-doctor-navy">Doctor Notes: </span>
              {clinicalNotes}
            </div>
          )}
        </div>

        {/* Day-by-Day Schedule Preview Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Generated Alarm Sequence (Anchored to Meals &plusmn;30m)
            </h4>
            <span className="text-[11px] text-slate-500">
              Breakfast {student.meal_times.breakfast} &bull; Lunch {student.meal_times.lunch} &bull; Dinner {student.meal_times.dinner}
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {schedulePreview.map((day) => (
              <div
                key={day.dayNumber}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-doctor-blue">
                      {day.dayNumber}
                    </span>
                    <span className="text-xs font-bold text-doctor-navy">
                      Day {day.dayNumber} &bull; {day.dateStr}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {day.slots.reduce((acc, s) => acc + s.medicines.length, 0)} dose(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {day.slots.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-doctor-blue" />
                        <span className="font-semibold text-doctor-navy capitalize">
                          {slot.relation} {slot.meal}
                        </span>
                        <span className="rounded bg-white px-1.5 py-0.2 border border-slate-200 text-[10px] font-mono font-medium text-slate-600">
                          {slot.timeStr}
                        </span>
                      </div>
                      <div className="text-right">
                        {slot.medicines.map((m, mIdx) => (
                          <div key={mIdx} className="text-xs font-medium text-doctor-navy">
                            {m.name} <span className="text-slate-500">({m.dose})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Protocol Banner */}
        <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Closed-loop adherence protocol:</span> The student will be prompted to confirm each dose as Taken, Taken Late, or Not taken. On the day following course completion, the app automatically checks recovery status (Better, Same, Worse).
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" /> Back to Edit
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-doctor-blue hover:bg-doctor-blueHover text-white shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                Submitting & Generating...
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="mr-2 h-4 w-4" /> Submit & Send to Student
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
