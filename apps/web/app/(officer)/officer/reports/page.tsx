"use client";

import React, { useState, useEffect } from "react";
import { OfficerHeader } from "../components/OfficerHeader";
import { OfficerService } from "@/lib/officer/service";
import { ReportSummaryItem } from "@/lib/officer/types";
import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Calendar,
  TrendingUp,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OfficerReportsPage() {
  const [reports, setReports] = useState<ReportSummaryItem[]>([]);
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
    <div className="space-y-6">
      <OfficerHeader
        title="Epidemiological & Adherence Reporting"
        subtitle="Sanitized executive aggregates for institutional accreditation and campus wellness assessment"
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Export Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1736]">
                Institutional Accreditation CSV Export
              </h3>
              <p className="text-xs text-slate-500">
                Exports sanitized monthly and semester metrics. Strict privacy policy ensures zero patient-identifiable diagnoses in CSV.
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportCSV}
            disabled={isExporting || isLoading}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-md shadow-blue-500/20 shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Generating..." : "Download Aggregate CSV"}
          </Button>
        </div>

        {/* Aggregated Period Cards */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#0B1736]">
                Monthly & Semester Surveillance Summaries
              </h3>
            </div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-800 bg-emerald-50 text-[10px]">
              Sanitized Aggregates
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Reporting Period</th>
                  <th className="px-6 py-3">Total Consultations</th>
                  <th className="px-6 py-3">Unique Students</th>
                  <th className="px-6 py-3">Recovery Rate</th>
                  <th className="px-6 py-3">Dose Adherence Rate</th>
                  <th className="px-6 py-3">Red Alerts Escalated</th>
                  <th className="px-6 py-3">Officer Calls Executed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((row, idx) => {
                  const isSemester = row.period.includes("Semester");
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSemester ? "bg-blue-50/30 font-bold" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-[#0B1736]">
                        <span className="flex items-center">
                          {isSemester && (
                            <BarChart3 className="mr-1.5 h-3.5 w-3.5 text-[#2563EB]" />
                          )}
                          {row.period}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">
                        {row.total_visits}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {row.unique_students}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 font-bold border border-emerald-200">
                          {row.recovery_rate}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[#C9A24B] font-bold border border-amber-200 font-mono">
                          {row.adherence_rate}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-red-600 font-bold">
                        {row.red_alerts}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">
                        {row.escalation_calls}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Governance & Privacy Notice */}
        <div className="rounded-2xl border border-blue-100 bg-doctor-panel/60 p-4 text-xs text-slate-600 flex items-start space-x-3">
          <ShieldCheck className="h-5 w-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#0B1736] block">
              Governance Standard: Zero Patient Diagnostic Leakage
            </span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              In accordance with KIET Campus Healthcare Privacy Bylaws and statutory medical confidentiality rules, exported reports and surveillance feeds aggregate counts only. Doctor clinical notes, personal medical histories, and individual diagnosis records are strictly filtered at the database view level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
