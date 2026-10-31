"use client";

import React from "react";
import { Users, Clock, CheckCircle2, HeartPulse, BellRing, ArrowRight } from "lucide-react";
import { TodayPatientItem } from "@/lib/doctor/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TodayPatientsViewProps {
  patients: TodayPatientItem[];
  onSelectRoll: (roll: string) => void;
}

export function TodayPatientsView({
  patients,
  onSelectRoll,
}: TodayPatientsViewProps) {
  const statusConfig = {
    alarms_active: {
      label: "Alarms Active",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      icon: BellRing,
    },
    doses_confirmed: {
      label: "Doses Confirmed",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      icon: CheckCircle2,
    },
    recovered: {
      label: "Recovered",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: HeartPulse,
    },
  };

  return (
    <div className="space-y-4 rounded-12 border border-doctor-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-doctor-navy">
            Today&apos;s Treated Students ({patients.length})
          </h2>
          <p className="text-xs text-slate-500">
            Real-time adherence status for students prescribed during your current shift.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-doctor-panel text-doctor-navy border-slate-200">
            Shift OPD Active
          </Badge>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400">
          No patients have been recorded in this shift yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {patients.map((p) => {
            const config = statusConfig[p.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/70 text-doctor-blue font-bold text-xs">
                    {p.student_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-doctor-navy">
                        {p.student_name}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        ({p.roll_number})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Problem: <span className="font-medium text-doctor-navy">{p.problem}</span> &bull; Branch: {p.branch}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">{p.time}</span>
                    <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                      <StatusIcon className="mr-1 h-3 w-3 inline" />
                      {config.label}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectRoll(p.roll_number)}
                    className="h-8 border-slate-200 text-doctor-navy hover:bg-doctor-panel"
                  >
                    Open Desk <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
