"use client";

import React, { useState, useEffect } from "react";
import { OfficerService } from "@/lib/officer/service";
import { ReportDailyRow } from "@/lib/officer/types";

export const dynamic = "force-dynamic";

export default function OfficerReportsPage() {
  const [reports, setReports] = useState<ReportDailyRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setIsLoading(true);
      try {
        const data = await OfficerService.getReports();
        setReports(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = OfficerService.generateReportsCSV(reports);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `KIET_Health_Surveillance_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col py-6 select-none">
      {/* 1. Header Section */}
      <div className="pb-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
            REPORTS
          </div>
          <h1 className="font-serif text-[clamp(26px,2.8vw,36px)] font-normal text-[#0F1B33] tracking-tight mt-0.5">
            Campus health reports
          </h1>
          <p className="text-[13px] font-sans text-[#6B7280] mt-1">
            Epidemiological trends, daily OPD consultations, and medication adherence oversight.
          </p>
        </div>

        {/* CSV Export Button: Solid ink-navy */}
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="h-8 px-4 rounded-[6px] bg-[#0F1B33] text-white text-[13px] font-medium hover:bg-[#1A2D54] disabled:opacity-50 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isExporting ? "Generating CSV..." : "Export report (CSV)"}
        </button>
      </div>

      {/* 2. Summary Table */}
      <div className="flex-1 mt-6 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 border-b border-[#E5E7EB]">
            <tr className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              <th className="py-3 pr-3 font-semibold">DATE</th>
              <th className="py-3 px-3 font-semibold">CONSULTATIONS</th>
              <th className="py-3 px-3 font-semibold">RESOLVED CASES</th>
              <th className="py-3 px-3 font-semibold">ESCALATED ALERTS</th>
              <th className="py-3 pl-3 text-right font-semibold">ADHERENCE RATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
            {isLoading && reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#6B7280]">
                  Loading reports...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#6B7280]">
                  No report records found for this period.
                </td>
              </tr>
            ) : (
              reports.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-serif font-bold text-[#0F1B33]">
                    {r.date}
                  </td>
                  <td className="py-3 px-3 tabular-nums font-mono text-[#0F1B33]">
                    {r.total_consultations}
                  </td>
                  <td className="py-3 px-3 tabular-nums font-mono text-[#0F1B33]">
                    {r.resolved_cases}
                  </td>
                  <td className="py-3 px-3 tabular-nums font-mono text-[#0F1B33]">
                    {r.escalated_alerts}
                  </td>
                  <td className="py-3 pl-3 text-right tabular-nums font-mono text-[#059669] font-medium">
                    {r.adherence_rate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
