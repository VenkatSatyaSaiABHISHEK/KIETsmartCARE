"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DoctorTodayPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    patients_seen: 0,
    courses_active: 0,
    alerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/doctor/today", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.summary) setSummary(data.summary);
          if (data.todayPatients) setPatients(data.todayPatients);
        }
      } catch (err) {
        console.warn("Failed to load today data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col py-6 select-none">
      {/* Header */}
      <div className="pb-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
            CLINICAL DESK
          </div>
          <h1 className="font-serif text-[clamp(26px,2.8vw,36px)] font-normal text-[#0F1B33] tracking-tight mt-0.5">
            Today&apos;s patients
          </h1>
          <p className="text-[13px] font-sans text-[#6B7280] mt-1">
            {summary.patients_seen} patient{summary.patients_seen === 1 ? "" : "s"} seen today at Campus OPD Clinic.
          </p>
        </div>

        <Link
          href="/doctor"
          className="h-8 px-4 rounded-[10px] bg-[#1D4ED8] text-white text-[13px] font-medium hover:bg-[#1E40AF] flex items-center justify-center transition-colors shrink-0"
        >
          + New consultation
        </Link>
      </div>

      {/* Table */}
      <div className="flex-1 mt-6 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] border-b border-[#E5E7EB]">
              <th className="py-3 pr-4 font-semibold">PATIENT</th>
              <th className="py-3 px-4 font-semibold">ROLL NUMBER</th>
              <th className="py-3 px-4 font-semibold">DIAGNOSIS / CONDITION</th>
              <th className="py-3 px-4 font-semibold">TIME</th>
              <th className="py-3 px-4 font-semibold">STATUS</th>
              <th className="py-3 pl-4 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                  Loading patients...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#6B7280]">
                  No patients yet today. Search a roll number on the consultation desk to begin.
                </td>
              </tr>
            ) : (
              patients.map((p) => {
                let dotColor = "bg-[#D97706]";
                let statusWord = "Under treatment";
                if (p.status === "recovered") {
                  dotColor = "bg-[#059669]";
                  statusWord = "Recovered";
                } else if (p.status === "needs_attention" || p.status === "not_recovered") {
                  dotColor = "bg-[#B91C1C]";
                  statusWord = "Needs attention";
                } else if (p.status === "no_response") {
                  dotColor = "bg-[#9CA3AF]";
                  statusWord = "No response";
                }

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-serif font-bold text-[#0F1B33]">
                      {p.student_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                      {p.roll_number}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">{p.problem}</td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#6B7280] tabular-nums">
                      {p.consultation_time}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span className="text-[#0F1B33]">{statusWord}</span>
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/doctor?roll=${p.roll_number}`)}
                        className="text-[13px] font-medium text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

