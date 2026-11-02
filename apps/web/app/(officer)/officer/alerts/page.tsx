"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CaseDrawer } from "../components/CaseDrawer";
import { OfficerAlertItem, CallOutcome } from "@/lib/officer/types";

export const dynamic = "force-dynamic";

function formatWaiting(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `Waiting ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Waiting ${hours} hr`;
  const days = Math.floor(hours / 24);
  return `Waiting ${days} day${days > 1 ? "s" : ""}`;
}

export default function OfficerAlertsPage() {
  const [alerts, setAlerts] = useState<OfficerAlertItem[]>([]);
  const [counts, setCounts] = useState<{
    all: number;
    red: number;
    no_response: number;
    open: number;
    in_progress: number;
    resolved: number;
  }>({
    all: 0,
    red: 0,
    no_response: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
  });

  const [tabFilter, setTabFilter] = useState<"all" | "red" | "no_response">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const [selectedAlert, setSelectedAlert] = useState<OfficerAlertItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load alerts from API
  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/officer/alerts?tab=${tabFilter}&status=${statusFilter}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch alerts:", e);
    } finally {
      setIsLoading(false);
    }
  }, [tabFilter, statusFilter]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // 1 min timer update
    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Open case drawer & log audit view
  const handleOpenCase = async (alert: OfficerAlertItem) => {
    setSelectedAlert(alert);
    setIsDrawerOpen(true);
  };

  // Submit call outcome
  const handleSubmitCallLog = async (
    alertId: string,
    outcome: CallOutcome,
    notes: string
  ) => {
    const res = await fetch("/api/officer/call-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId,
        outcome,
        notes,
        resolveAlert: outcome === "Reached and fine",
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to save call log");
    }
    await loadAlerts();
  };

  const openCount = counts.open;

  return (
    <div className="w-full flex-1 flex flex-col py-6 select-none">
      {/* 1. Header Section */}
      <div className="pb-5 border-b border-[#E5E7EB]">
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
          ALERTS
        </div>
        <h1 className="font-serif text-[clamp(26px,2.8vw,36px)] font-normal text-[#0F1B33] tracking-tight mt-0.5">
          Needs a call
        </h1>
        <p className="text-[13px] font-sans text-[#6B7280] mt-1">
          {openCount} open urgent escalation{openCount === 1 ? "" : "s"} requiring clinical outreach.
        </p>
      </div>

      {/* 2. Text Tabs Row (No Chips, No Dropdowns) */}
      <div className="py-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Set 1: Filter by Alert Type */}
        <div className="flex items-center gap-3 text-[13px] font-sans">
          {(
            [
              { id: "all", label: "All", count: counts.all },
              { id: "red", label: "Red", count: counts.red },
              { id: "no_response", label: "No response", count: counts.no_response },
            ] as const
          ).map((t, idx) => (
            <React.Fragment key={t.id}>
              {idx > 0 && <span className="text-[#E5E7EB]">|</span>}
              <button
                type="button"
                onClick={() => setTabFilter(t.id)}
                className={`cursor-pointer transition-colors ${
                  tabFilter === t.id
                    ? "text-[#0F1B33] font-medium border-b-2 border-[#0F1B33] pb-0.5"
                    : "text-[#6B7280] hover:text-[#0F1B33]"
                }`}
              >
                {t.label} <span className="tabular-nums">{t.count}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Set 2: Filter by Status */}
        <div className="flex items-center gap-3 text-[13px] font-sans">
          {(
            [
              { id: "open", label: "Open" },
              { id: "in_progress", label: "In progress" },
              { id: "resolved", label: "Resolved" },
              { id: "all", label: "All statuses" },
            ] as const
          ).map((s, idx) => (
            <React.Fragment key={s.id}>
              {idx > 0 && <span className="text-[#E5E7EB]">|</span>}
              <button
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`cursor-pointer transition-colors ${
                  statusFilter === s.id
                    ? "text-[#0F1B33] font-medium border-b-2 border-[#0F1B33] pb-0.5"
                    : "text-[#6B7280] hover:text-[#0F1B33]"
                }`}
              >
                {s.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. Alerts List: Slim rows with hairline dividers (Not boxed cards) */}
      <div className="flex-1 divide-y divide-[#E5E7EB]">
        {isLoading && alerts.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[#6B7280]">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[#6B7280]">
            No alerts right now.
          </div>
        ) : (
          alerts.map((alert) => {
            // Status dot
            let dotColor = "bg-[#B91C1C]"; // Open red
            let statusLabel = "Open";
            if (alert.status === "in_progress") {
              dotColor = "bg-[#D97706]";
              statusLabel = "In progress";
            } else if (alert.status === "resolved") {
              dotColor = "bg-[#059669]";
              statusLabel = "Resolved";
            }

            const doseText = alert.case_details?.total_doses
              ? `${alert.case_details.doses_confirmed ?? 0} of ${alert.case_details.total_doses} doses confirmed`
              : "Active schedule";

            return (
              <div
                key={alert.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors px-2 rounded-[6px]"
              >
                {/* Left: Student & Doctor Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-serif font-bold text-[16px] text-[#0F1B33]">
                      {alert.student_name}
                    </span>
                    <span className="font-mono text-[12px] text-[#6B7280] tabular-nums">
                      {alert.roll_number}
                    </span>
                    <span className="text-[12px] text-[#6B7280]">
                      • {alert.branch} ({alert.year})
                    </span>
                  </div>

                  <div className="text-[12px] font-sans text-[#6B7280]">
                    Prescribed by {alert.doctor_name}
                  </div>
                </div>

                {/* Middle: Clinical Trigger, Waiting Time & Dose Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-[13px] font-sans">
                  <div>
                    <div className="font-semibold text-[#B91C1C]">
                      {alert.reason}
                    </div>
                    <div className="text-[12px] text-[#6B7280] mt-0.5">
                      {formatWaiting(alert.reported_at)}
                    </div>
                  </div>

                  <div className="hidden lg:block text-[12px] text-[#6B7280] tabular-nums">
                    {doseText}
                  </div>

                  {/* Status Indicator: dot + plain word */}
                  <div className="flex items-center gap-1.5 min-w-[90px]">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="text-[#0F1B33] text-[13px]">{statusLabel}</span>
                  </div>
                </div>

                {/* Right: Solid ink-navy Call Button & Open Case Link */}
                <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenCase(alert)}
                    className="text-[13px] font-sans text-[#0F1B33] hover:underline cursor-pointer"
                  >
                    Open case
                  </button>

                  <a
                    href={`tel:${alert.phone}`}
                    className="inline-flex items-center justify-center h-8 px-4 rounded-[6px] bg-[#0F1B33] text-white text-[13px] font-medium hover:bg-[#1A2D54] transition-colors cursor-pointer"
                  >
                    Call
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-out Case Drawer */}
      <CaseDrawer
        alert={selectedAlert}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAlert(null);
        }}
        onSubmitCallLog={handleSubmitCallLog}
      />
    </div>
  );
}
