"use client";

import React, { useState, useEffect } from "react";
import { OfficerHeader } from "../components/OfficerHeader";
import { CaseDetailsModal } from "../components/CaseDetailsModal";
import { OfficerService } from "@/lib/officer/service";
import { OfficerAlertItem, CallOutcome } from "@/lib/officer/types";
import {
  ShieldAlert,
  AlertOctagon,
  PhoneCall,
  Clock,
  Eye,
  CheckCircle2,
  HelpCircle,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OfficerAlertsPage() {
  const [alerts, setAlerts] = useState<OfficerAlertItem[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<OfficerAlertItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "red" | "yellow">("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await OfficerService.getAlertsQueue();
      setAlerts(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Open case & log view to audit_logs
  const handleOpenCase = async (alert: OfficerAlertItem) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
    // Enforce audit log entry
    await OfficerService.logCaseView(alert.id, alert.roll_number);
  };

  // Submit outreach call log and update alert status
  const handleSubmitCallLog = async (
    alertId: string,
    outcome: CallOutcome,
    notes: string
  ) => {
    await OfficerService.submitCallLog(alertId, outcome, notes);
    await loadAlerts();
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (levelFilter !== "all" && a.alert_level !== levelFilter) return false;
    return true;
  });

  const redCount = alerts.filter((a) => a.alert_level === "red" && a.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <OfficerHeader
        title="Escalations & Alerts Queue"
        subtitle="Priority triage of adverse recovery reports and 24-hour non-response cases"
        urgentCount={redCount}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        {/* Filters and Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center">
              <Filter className="mr-1 h-3.5 w-3.5" />
              Triage Priority:
            </span>
            <button
              type="button"
              onClick={() => setLevelFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                levelFilter === "all"
                  ? "bg-[#2563EB] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("red")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                levelFilter === "red"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              Red Alerts First ({alerts.filter((a) => a.alert_level === "red").length})
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("yellow")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                levelFilter === "yellow"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              No Response (24h) ({alerts.filter((a) => a.alert_level === "yellow").length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open Cases</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Alerts Table / Queue Card List */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B1736]">
              Active Escalation Records (Red Priority Ordered First)
            </h3>
            <span className="text-xs text-slate-400">
              Showing {filteredAlerts.length} items
            </span>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No matching alerts found for current filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => {
                const isRed = alert.alert_level === "red";
                return (
                  <div
                    key={alert.id}
                    className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 transition-colors ${
                      isRed ? "bg-red-50/20 hover:bg-red-50/40" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Left: Student Identity & Priority Flag */}
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                          isRed
                            ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isRed ? (
                          <AlertOctagon className="h-5 w-5" />
                        ) : (
                          <HelpCircle className="h-5 w-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={isRed ? "destructive" : "outline"}
                            className={
                              isRed
                                ? "bg-red-600 text-white text-[10px] font-bold"
                                : "border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-bold"
                            }
                          >
                            {alert.reason.toUpperCase()}
                          </Badge>
                          <span className="font-bold text-sm text-[#0B1736]">
                            {alert.student_name}
                          </span>
                          <span className="font-mono text-xs text-slate-500 font-medium">
                            ({alert.roll_number})
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          {alert.branch} (Year {alert.year}) &bull; Prescribed by:{" "}
                          <span className="font-medium text-slate-800">
                            {alert.doctor_name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>Reported {alert.reported_at}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Case summary pill */}
                    <div className="hidden xl:block text-xs text-slate-600 max-w-xs">
                      <div className="font-semibold text-slate-800">
                        {alert.case_details.problem_category}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Adherence: {alert.case_details.doses_confirmed}/
                        {alert.case_details.total_doses} doses confirmed
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold capitalize ${
                          alert.status === "open"
                            ? "border-red-300 text-red-700 bg-red-50"
                            : alert.status === "in_progress"
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "border-emerald-300 text-emerald-700 bg-emerald-50"
                        }`}
                      >
                        {alert.status.replace("_", " ")}
                      </Badge>

                      <a
                        href={`tel:${alert.phone.replace(/\s+/g, "")}`}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                        title={`Call ${alert.phone}`}
                      >
                        <PhoneCall className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                        Call
                      </a>

                      <Button
                        size="sm"
                        onClick={() => handleOpenCase(alert)}
                        className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs h-9"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Open Case & Log
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Limited Case Details & Outreach Modal */}
      <CaseDetailsModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitCallLog={handleSubmitCallLog}
      />
    </div>
  );
}
