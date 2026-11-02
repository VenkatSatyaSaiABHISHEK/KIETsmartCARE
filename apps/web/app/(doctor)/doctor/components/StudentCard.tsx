"use client";

import React from "react";
import { StudentFullProfile, VisitHistoryEntry } from "@/lib/doctor/types";

interface StudentCardProps {
  student: StudentFullProfile & {
    residence_type?: string;
    room_number?: string | null;
  };
  recentVisits?: VisitHistoryEntry[];
}

export function StudentCard({ student, recentVisits = [] }: StudentCardProps) {
  // Initials fallback
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Allergies display check
  const allergiesList = Array.isArray(student.allergies) ? student.allergies : [];
  const validAllergies = allergiesList.filter(
    (a) => a && !a.toLowerCase().includes("nkda") && !a.toLowerCase().includes("none")
  );

  const residenceLabel =
    student.residence_type === "day_scholar"
      ? "Day scholar"
      : student.residence_type === "hostler"
      ? "Hostler"
      : student.hostel_status === "Day Scholar"
      ? "Day scholar"
      : "Hostler";

  const roomValue = student.room_number || null;

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Soft Shaded Panel (Faint blue gradient, 20px radius, wide shadow) */}
      <div className="p-7 rounded-[20px] bg-gradient-to-b from-[#F0F7FF] to-white shadow-[0_14px_36px_rgba(15,27,51,0.08),0_2px_6px_rgba(15,27,51,0.04)] flex flex-col">
        {/* Photo + Name + Roll */}
        <div className="flex items-center gap-4 mb-6">
          {student.avatar_url ? (
            <img
              src={student.avatar_url}
              alt={student.name}
              className="w-16 h-16 rounded-[16px] object-cover bg-[#E5E7EB] shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-[16px] bg-[#E5E7EB] text-[#0F1B33] font-serif text-[20px] font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="font-serif text-[28px] font-normal leading-tight text-[#0F1B33] tracking-tight truncate">
              {student.name}
            </h2>
            <div className="font-mono text-[13px] text-[#6B7280] tabular-nums mt-0.5">
              {student.roll_number}
            </div>
          </div>
        </div>

        {/* Key-Value Details with Hairline Dividers */}
        <div className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
          {student.branch && (
            <div className="py-2.5 flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] shrink-0">
                BRANCH
              </span>
              <span className="text-[#0F1B33] font-medium text-right truncate">
                {student.branch}
              </span>
            </div>
          )}

          {student.year && (
            <div className="py-2.5 flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] shrink-0">
                YEAR
              </span>
              <span className="text-[#0F1B33] font-medium text-right tabular-nums">
                {student.year}
              </span>
            </div>
          )}

          <div className="py-2.5 flex justify-between items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] shrink-0">
              RESIDENCE
            </span>
            <span className="text-[#0F1B33] font-medium text-right">
              {residenceLabel}
            </span>
          </div>

          {/* Hide room completely if empty or if Day Scholar */}
          {residenceLabel === "Hostler" && roomValue && (
            <div className="py-2.5 flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] shrink-0">
                ROOM
              </span>
              <span className="text-[#0F1B33] font-medium text-right">
                {roomValue}
              </span>
            </div>
          )}

          {student.phone && (
            <div className="py-2.5 flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] shrink-0">
                PHONE
              </span>
              <span className="font-mono text-[13px] text-[#0F1B33] font-medium text-right tabular-nums">
                {student.phone}
              </span>
            </div>
          )}
        </div>

        {/* Allergy Line in Red Serif (Only shown when allergies exist) */}
        {validAllergies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
            <div className="font-serif text-[15px] font-semibold text-[#B91C1C]">
              Allergy: {validAllergies.join(", ")}
            </div>
          </div>
        )}
      </div>

      {/* 2. Recent Visits (Plain White, Small-caps header, max 2 visits) */}
      <div>
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2.5">
          RECENT VISITS
        </div>

        {recentVisits.length === 0 ? (
          <div className="text-[13px] font-sans text-[#6B7280] py-1">
            No previous campus visits on record.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
            {recentVisits.slice(0, 2).map((v) => (
              <div key={v.id} className="py-2 flex items-center justify-between text-[#0F1B33]">
                <span>
                  {v.date}, {v.problem_category}
                </span>
                <span className="text-[#6B7280] capitalize font-medium">
                  {v.outcome}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

