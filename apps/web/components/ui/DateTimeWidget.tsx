"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface DateTimeWidgetProps {
  variant?: "compact" | "card";
  className?: string;
}

export function DateTimeWidget({
  variant = "compact",
  className = "",
}: DateTimeWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !now) {
    if (variant === "card") {
      return (
        <div
          className={`relative rounded-[8px] border border-[var(--border)] bg-[var(--bg)] p-4 select-none ${className}`}
          style={{ minHeight: "82px" }}
          aria-hidden="true"
        >
          <div className="flex items-start justify-between">
            <div className="h-7 w-28 bg-[var(--bg-subtle)] rounded animate-pulse" />
            <Clock className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-60" />
          </div>
          <div className="mt-1 h-4 w-36 bg-[var(--bg-subtle)] rounded animate-pulse" />
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] select-none tabular-nums ${className}`}
        style={{ minWidth: "140px", minHeight: "20px" }}
        aria-hidden="true"
      >
        <Clock className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
        <span className="opacity-0">Sun, 1 Nov · 10:42 AM</span>
      </div>
    );
  }

  // Format strings
  // compact: "Sun, 1 Nov · 10:42 AM"
  const weekdayShort = now.toLocaleDateString("en-US", { weekday: "short" });
  const day = now.getDate();
  const monthShort = now.toLocaleDateString("en-US", { month: "short" });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // card: "Sunday, 1 November 2026"
  const fullWeekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const fullMonth = now.toLocaleDateString("en-US", { month: "long" });
  const fullYear = now.getFullYear();

  if (variant === "card") {
    return (
      <div
        className={`relative rounded-[8px] border border-[var(--border)] bg-[var(--bg)] p-4 select-none ${className}`}
      >
        <div className="flex items-start justify-between">
          <span className="font-mono text-[24px] font-semibold leading-none text-[var(--text)] tabular-nums">
            {timeStr}
          </span>
          <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        </div>
        <p className="mt-2 text-[13px] leading-tight text-[var(--text-muted)]">
          {fullWeekday}, {day} {fullMonth} {fullYear}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] select-none tabular-nums ${className}`}
    >
      <Clock className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
      <span>
        {weekdayShort}, {day} {monthShort} · {timeStr}
      </span>
    </div>
  );
}

