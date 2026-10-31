"use client";

import React from "react";
import {
  ShieldAlert,
  AlertOctagon,
  Clock,
  ArrowRight,
  CheckCircle2,
  Radio,
  User,
} from "lucide-react";
import { DoctorAlertItem } from "@/lib/doctor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DoctorAlertsViewProps {
  alerts: DoctorAlertItem[];
  onSelectRoll: (roll: string) => void;
  onMarkReviewed: (alertId: string) => void;
}

export function DoctorAlertsView({
  alerts,
  onSelectRoll,
  onMarkReviewed,
}: DoctorAlertsViewProps) {
  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const reviewedAlerts = alerts.filter((a) => a.acknowledged);

  return (
    <div className="space-y-6 rounded-12 border border-doctor-border bg-white p-6 shadow-sm">
      {/* View Header with Realtime status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-doctor-navy">
              My Patient Red Alerts ({activeAlerts.length})
            </h2>
            <span className="flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 mr-1.5" />
              Realtime Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic red alerts triggered when your patients answer Same, Worse, or report side effects.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-xs">
            <Radio className="mr-1 h-3 w-3 text-red-600 animate-spin" />
            Supabase Realtime Stream
          </Badge>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Unreviewed Red Alerts ({activeAlerts.length})
        </h3>

        {activeAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center text-xs text-emerald-800">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
            All patient red alerts for your consultations have been reviewed.
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alt) => (
              <div
                key={alt.id}
                className="rounded-xl border border-red-300 bg-red-50/40 p-4 transition-all hover:bg-red-50/70"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="destructive"
                        className="bg-red-600 text-white font-bold text-xs"
                      >
                        <AlertOctagon className="mr-1 h-3.5 w-3.5 inline" />
                        {alt.reason.toUpperCase()}
                      </Badge>
                      <span className="font-bold text-sm text-doctor-navy">
                        {alt.student_name}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        ({alt.roll_number})
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      Prescription Problem: <span className="font-semibold text-doctor-navy">{alt.problem}</span>
                    </div>

                    {alt.side_effects_reported && (
                      <div className="rounded-md border border-red-200 bg-white p-2 text-xs text-red-900 font-medium">
                        <span className="font-bold text-red-800">Student Report: </span>
                        {alt.side_effects_reported}
                      </div>
                    )}

                    <div className="flex items-center text-[11px] text-slate-400 space-x-1 pt-1">
                      <Clock className="h-3 w-3" />
                      <span>Reported {alt.time}</span>
                      <span>&bull;</span>
                      <span>Campus Health Officer alerted in parallel</span>
                    </div>
                  </div>

                  {/* Action Buttons: Open Case & Mark Reviewed */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => onSelectRoll(alt.roll_number)}
                      className="bg-doctor-blue hover:bg-doctor-blueHover text-white text-xs h-8 shadow-xs"
                    >
                      Open Case <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkReviewed(alt.id)}
                      className="border-slate-300 text-slate-700 hover:bg-white text-xs h-8"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                      Mark Reviewed
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Archive */}
      {reviewedAlerts.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Reviewed Alert Archive ({reviewedAlerts.length})
          </h3>
          <div className="space-y-2">
            {reviewedAlerts.map((alt) => (
              <div
                key={alt.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs opacity-75"
              >
                <div>
                  <span className="font-semibold text-doctor-navy">{alt.student_name}</span>{" "}
                  <span className="font-mono text-slate-400">({alt.roll_number})</span> &bull; Outcome: {alt.reason}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-slate-300 text-slate-600 text-[10px]">
                    Reviewed
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectRoll(alt.roll_number)}
                    className="h-7 text-xs text-doctor-blue"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
