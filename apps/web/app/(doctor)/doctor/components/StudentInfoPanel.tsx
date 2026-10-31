"use client";

import React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  Phone,
  ShieldAlert,
  User,
  History,
} from "lucide-react";
import { StudentFullProfile, VisitHistoryEntry } from "@/lib/doctor/types";
import { Badge } from "@/components/ui/badge";

interface StudentInfoPanelProps {
  student: StudentFullProfile | null;
  history: VisitHistoryEntry[];
  isLoading?: boolean;
}

export function StudentInfoPanel({
  student,
  history,
  isLoading = false,
}: StudentInfoPanelProps) {
  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-12 bg-doctor-panel p-8 text-center animate-pulse">
        <div className="h-20 w-20 rounded-full bg-slate-200 mb-4" />
        <div className="h-4 w-40 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-28 bg-slate-200 rounded" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-12 border border-dashed border-slate-300 bg-doctor-panel p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-doctor-blue mb-4">
          <User className="h-8 w-8" />
        </div>
        <h3 className="text-base font-semibold text-doctor-navy">No Student Selected</h3>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Enter a student roll number above and press Enter to view identity, allergy warnings, and visit timeline.
        </p>
      </div>
    );
  }

  const hasAllergies = student.allergies && student.allergies.length > 0;

  return (
    <div className="space-y-5 rounded-12 border border-doctor-border bg-white p-5 shadow-sm">
      {/* Student Profile Card */}
      <div className="flex items-start space-x-4 border-b border-slate-100 pb-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-md bg-slate-100">
          {student.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.avatar_url}
              alt={student.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-blue-100 text-doctor-blue font-bold text-xl">
              {student.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-doctor-navy truncate">{student.name}</h2>
            <Badge className="bg-blue-50 text-doctor-blue border-blue-200 text-xs">
              Year {student.year}
            </Badge>
          </div>
          <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
            Roll: {student.roll_number}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{student.branch}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="flex items-center">
              <Phone className="mr-1 h-3 w-3 text-slate-400" />
              {student.phone}
            </span>
            <span>&bull;</span>
            <span>
              {student.hostel_status}
              {student.room_number ? ` (${student.room_number})` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Allergies - HIGHLIGHTED RED-TINTED BOX, ALWAYS VISIBLE */}
      <div
        className={`rounded-xl border p-4 transition-all ${
          hasAllergies
            ? "border-red-300 bg-red-50 text-red-950 shadow-sm"
            : "border-emerald-200 bg-emerald-50/60 text-emerald-950"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasAllergies ? (
              <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              {hasAllergies ? "Known Drug Allergies" : "Allergy Profile"}
            </span>
          </div>
          {hasAllergies && (
            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              High Caution
            </span>
          )}
        </div>

        {hasAllergies ? (
          <div className="mt-2.5">
            <div className="flex flex-wrap gap-1.5">
              {student.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-800 shadow-xs"
                >
                  &times; {allergy}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-red-700 leading-tight">
              Prescription validator will strictly warn if selected medicines share compounds with these allergens.
            </p>
          </div>
        ) : (
          <p className="mt-1 text-xs text-emerald-800 font-medium">
            No known drug allergies reported on campus medical record.
          </p>
        )}
      </div>

      {/* Student Meal Timing Anchors Reference */}
      <div className="rounded-xl border border-slate-200 bg-doctor-panel/60 p-3 text-xs text-slate-700">
        <span className="font-semibold text-doctor-navy block mb-1">
          Registered Meal Schedule (Alarm Anchors):
        </span>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded bg-white p-1.5 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Breakfast</span>
            <span className="font-semibold text-doctor-navy">{student.meal_times.breakfast}</span>
          </div>
          <div className="rounded bg-white p-1.5 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Lunch</span>
            <span className="font-semibold text-doctor-navy">{student.meal_times.lunch}</span>
          </div>
          <div className="rounded bg-white p-1.5 border border-slate-200">
            <span className="text-slate-400 block text-[10px]">Dinner</span>
            <span className="font-semibold text-doctor-navy">{student.meal_times.dinner}</span>
          </div>
        </div>
      </div>

      {/* Visit History Timeline */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <History className="h-4 w-4 text-doctor-blue" />
            <span>Visit History Timeline ({history.length})</span>
          </div>
          <span className="text-[10px] text-slate-400">Newest First</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No previous OPD visits recorded on file.
          </p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-xs text-doctor-navy">
                      {item.problem_category}
                    </span>
                    <span className="ml-2 text-[10px] text-slate-400 font-mono">
                      {item.date}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      item.outcome === "recovered"
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                        : item.outcome === "not_recovered"
                        ? "border-red-300 text-red-700 bg-red-50"
                        : "border-blue-300 text-blue-700 bg-blue-50"
                    }`}
                  >
                    {item.outcome.replace("_", " ")}
                  </Badge>
                </div>

                {item.notes && (
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {item.notes}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-1">
                  {item.medicines.map((m, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 font-medium"
                    >
                      {m.name} ({m.dose})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
