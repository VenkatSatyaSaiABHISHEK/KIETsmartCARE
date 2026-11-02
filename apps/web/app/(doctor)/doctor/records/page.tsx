"use client";

import React, { useState, useEffect } from "react";

export const dynamic = "force-dynamic";

interface RecordRow {
  id: string;
  visit_date: string;
  student_name: string;
  roll_number: string;
  branch: string;
  problem_category: string;
  clinical_notes: string;
  status: string;
  recovery_response: string;
  doses_summary: string;
  medications: string[];
}

export default function DoctorRecordsPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordRow | null>(null);

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (search) params.set("search", search);

        const res = await fetch(`/api/doctor/records?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      } catch (err) {
        console.warn("Failed to load doctor records:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
  }, [startDate, endDate, search]);

  const handleDownloadCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("range", startDate && endDate ? "range" : "all");

      const res = await fetch(`/api/doctor/export?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Doctor_Patient_Records_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.warn("Export CSV error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col py-6 select-none">
      {/* Header Section */}
      <div className="pb-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
            PATIENT HISTORY
          </div>
          <h1 className="font-serif text-[clamp(26px,2.8vw,36px)] font-normal text-[#0F1B33] tracking-tight mt-0.5">
            Clinical Records
          </h1>
          <p className="text-[13px] font-sans text-[#6B7280] mt-1">
            Archived OPD consultations, prescription histories, and student follow-up outcomes.
          </p>
        </div>

        {/* Download CSV Button */}
        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={isExporting}
          className="h-8 px-4 rounded-[10px] bg-[#1D4ED8] text-white text-[13px] font-medium hover:bg-[#1E40AF] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
        >
          {isExporting ? "Generating CSV..." : "Download CSV"}
        </button>
      </div>

      {/* Filter Controls Row */}
      <div className="py-4 border-b border-[#E5E7EB] flex flex-wrap items-center gap-4 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[#0F1B33]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 px-2.5 border border-[#E5E7EB] rounded-[6px] text-[#0F1B33]"
          />
        </div>

        <div className="w-56 ml-auto">
          <input
            type="text"
            placeholder="Search student or problem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 px-3 text-[13px] border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8]"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="flex-1 mt-4 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] border-b border-[#E5E7EB]">
              <th className="py-3 pr-4 font-semibold">DATE</th>
              <th className="py-3 px-4 font-semibold">STUDENT</th>
              <th className="py-3 px-4 font-semibold">ROLL NUMBER</th>
              <th className="py-3 px-4 font-semibold">BRANCH</th>
              <th className="py-3 px-4 font-semibold">PROBLEM</th>
              <th className="py-3 px-4 font-semibold">OUTCOME</th>
              <th className="py-3 pl-4 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                  Loading clinical records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#6B7280]">
                  No records in this period.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const dateStr = new Date(r.visit_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-[12px] text-[#6B7280] tabular-nums whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-[#0F1B33]">
                      {r.student_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                      {r.roll_number}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">{r.branch}</td>
                    <td className="py-3 px-4 text-[#0F1B33] font-medium">
                      {r.problem_category}
                    </td>
                    <td className="py-3 px-4 text-[#059669] capitalize font-medium">
                      {r.recovery_response || r.status}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(r)}
                        className="text-[13px] font-medium text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Side Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setSelectedRecord(null)}
          />
          <div className="relative w-full max-w-[440px] bg-white h-full shadow-2xl border-l border-[#E5E7EB] z-10 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="font-serif text-[18px] font-bold text-[#0F1B33]">
                  Consultation Record
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center text-[16px]"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2.5 text-[13px] font-sans">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Date:</span>
                  <span className="font-mono text-[#0F1B33]">
                    {new Date(selectedRecord.visit_date).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Student:</span>
                  <span className="font-medium text-[#0F1B33]">
                    {selectedRecord.student_name} ({selectedRecord.roll_number})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Diagnosis:</span>
                  <span className="font-semibold text-[#0F1B33]">
                    {selectedRecord.problem_category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Outcome:</span>
                  <span className="font-medium text-[#059669]">
                    {selectedRecord.recovery_response || selectedRecord.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="h-9 px-5 rounded-[10px] bg-[#0F1B33] text-white text-[13px] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

