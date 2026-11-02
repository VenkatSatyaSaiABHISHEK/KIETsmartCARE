"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

interface AlertRow {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  phone: string;
  problem_category: string;
  reason: string;
  reported_at: string;
  severity: string;
  status: string;
  medicines: string[];
}

function formatWaiting(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `Waiting ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Waiting ${hours} hr`;
  const days = Math.floor(hours / 24);
  return `Waiting ${days} day${days > 1 ? "s" : ""}`;
}

export default function DoctorAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/doctor/alerts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.warn("Failed to load doctor alerts:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    // Supabase Realtime
    const supabase = createClient();
    const channel = supabase
      .channel("doctor_alerts_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => loadAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAlerts]);

  const handleMarkReviewed = async (alertId: string) => {
    try {
      const res = await fetch("/api/officer/call-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          outcome: "Reached and fine",
          notes: "Reviewed and closed by OPD Doctor",
          resolveAlert: true,
        }),
      });
      if (res.ok) {
        loadAlerts();
        setIsDrawerOpen(false);
      }
    } catch (e) {
      console.warn("Failed to mark reviewed:", e);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col py-6 select-none">
      {/* Header */}
      <div className="pb-5 border-b border-[#E5E7EB]">
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
          CLINICAL ALERTS
        </div>
        <h1 className="font-serif text-[clamp(26px,2.8vw,36px)] font-normal text-[#0F1B33] tracking-tight mt-0.5">
          Priority Alerts
        </h1>
        <p className="text-[13px] font-sans text-[#6B7280] mt-1">
          Urgent student recovery reports and side effects flagged for your consultation cases.
        </p>
      </div>

      {/* Alerts List: Plain rows with hairline dividers (no boxed cards) */}
      <div className="flex-1 mt-6 divide-y divide-[#E5E7EB]">
        {isLoading && alerts.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[#6B7280]">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-[#6B7280]">
            No alerts right now.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-[6px] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-bold text-[16px] text-[#0F1B33]">
                    {alert.student_name}
                  </span>
                  <span className="font-mono text-[12px] text-[#6B7280] tabular-nums">
                    {alert.roll_number}
                  </span>
                </div>
                <div className="text-[12px] font-sans text-[#6B7280]">
                  Diagnosis: {alert.problem_category}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-[#B91C1C]">
                    {alert.reason}
                  </div>
                  <div className="text-[11px] font-sans text-[#6B7280]">
                    {formatWaiting(alert.reported_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlert(alert);
                      setIsDrawerOpen(true);
                    }}
                    className="text-[13px] font-medium text-[#0F1B33] hover:underline cursor-pointer"
                  >
                    Open case
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkReviewed(alert.id)}
                    className="h-8 px-3.5 rounded-[10px] bg-[#1D4ED8] text-white text-[12px] font-medium hover:bg-[#1E40AF] transition-colors cursor-pointer"
                  >
                    Mark reviewed
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Case Details Drawer */}
      {isDrawerOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-[440px] bg-white h-full shadow-2xl border-l border-[#E5E7EB] z-10 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="font-serif text-[18px] font-bold text-[#0F1B33]">
                  Case Details
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Student:</span>
                  <span className="font-medium text-[#0F1B33]">{selectedAlert.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Roll Number:</span>
                  <span className="font-mono text-[#0F1B33]">{selectedAlert.roll_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Phone:</span>
                  <span className="font-mono text-[#0F1B33]">{selectedAlert.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Flagged Reason:</span>
                  <span className="font-semibold text-[#B91C1C]">{selectedAlert.reason}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="h-9 px-4 text-[13px] font-medium text-[#6B7280]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleMarkReviewed(selectedAlert.id)}
                className="h-9 px-5 rounded-[10px] bg-[#1D4ED8] text-white text-[13px] font-medium hover:bg-[#1E40AF]"
              >
                Resolve Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

