"use client";

import React, { useEffect, useState } from "react";
import { AlertOctagon, X, PhoneCall } from "lucide-react";
import Link from "next/link";

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

  // Simulate an incoming live alert via Supabase Realtime after 12 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setToastAlert({
        id: "alt-live-99",
        student_name: "Karan Johar",
        roll_number: "2200290130099",
        reason: "Worse",
      });
    }, 12000);

    return () => clearTimeout(timer);
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
              Realtime RED ALERT
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
            Reported outcome &ldquo;{toastAlert.reason}&rdquo; post-medication course.
          </p>
          <div className="mt-2.5 flex items-center space-x-2">
            <Link
              href="/officer/alerts"
              onClick={() => setToastAlert(null)}
              className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-700 transition-colors"
            >
              Review Case &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
