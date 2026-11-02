"use client";

import React, { useEffect, useState } from "react";
import { AlertOctagon, X, PhoneCall } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface RealtimeToastProps {
  onDismiss?: () => void;
}

export function RealtimeToast({ onDismiss }: RealtimeToastProps) {
  const [toastAlert, setToastAlert] = useState<{
    id: string;
    student_name: string;
    roll_number: string;
    reason: string;
  } | null>(null);

  // Subscribe to real Supabase Realtime alerts channel
  useEffect(() => {
    try {
      const supabase = createClient();

      const channel = supabase
        .channel("officer_realtime_alerts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "alerts" },
          async (payload) => {
            try {
              const newAlert = payload.new as any;
              if (newAlert.severity === "red") {
                // Fetch student name and roll
                const { data: student } = await supabase
                  .from("students")
                  .select("name, roll_number")
                  .eq("id", newAlert.student_id)
                  .maybeSingle();

                setToastAlert({
                  id: newAlert.id,
                  student_name: (student as any)?.name || "Student",
                  roll_number: (student as any)?.roll_number || "KIET",
                  reason: newAlert.type === "worse" ? "Worse" : newAlert.type === "same" ? "Same" : "Adverse Reaction",
                });
              }
            } catch {
              // Ignore realtime payload parsing errors
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }, []);

  if (!toastAlert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-red-300 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shrink-0 shadow-md shadow-red-500/20">
          <AlertOctagon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 font-mono">
              Live RED ALERT
            </span>
            <button
              type="button"
              onClick={() => {
                setToastAlert(null);
                onDismiss?.();
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs font-bold text-[#0B1736] mt-0.5 truncate">
            {toastAlert.student_name} ({toastAlert.roll_number})
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Answered: <strong className="text-red-700">{toastAlert.reason}</strong> on course completion. Immediate triage required.
          </p>
          <div className="mt-3 flex items-center space-x-2">
            <Link
              href="/officer/alerts"
              onClick={() => setToastAlert(null)}
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              <PhoneCall className="mr-1.5 h-3.5 w-3.5" />
              Triage Outreach
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
