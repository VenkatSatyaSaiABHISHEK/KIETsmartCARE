"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { OfficerCallDrawer } from "./components/OfficerCallDrawer";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

interface DashboardData {
  anchor_date: string;
  period: "today" | "7d" | "30d";
  needs_action: {
    open_alerts: number;
    no_response: number;
  };
  under_treatment: {
    active: number;
    doses_confirmed: number;
    doses_due: number;
  };
  this_period: {
    students_seen: number;
    recovered: number;
    not_recovered: number;
  };
  last_7_days: Array<{
    date: string;
    weekday: string;
    day_number: string;
    students_seen: number;
    is_anchor: boolean;
  }>;
  common_problems: {
    start_date: string;
    end_date: string;
    widened: boolean;
    items: Array<{
      category: string;
      count: number;
    }>;
  };
  needs_call: Array<{
    id: string;
    student_id: string;
    student_name: string;
    roll_number: string;
    branch: string;
    phone: string;
    reason: string;
    severity: string;
    created_at: string;
  }>;
  open_alert_count: number;
}

interface StudentItem {
  student_id: string;
  name: string;
  roll_number: string;
  branch: string;
  year?: number;
  phone: string;
  current_status: string;
  last_visit_date: string;
  has_open_alert: boolean;
}

interface StudentCounts {
  all: number;
  needs_attention: number;
  active: number;
  recovered: number;
}

// Timezone Helper: Asia/Kolkata
function getTodayIst(): string {
  const d = new Date();
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
}

function getIstClockString(): string {
  const d = new Date();
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatAnchorDate(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPeriodDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
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

function formatReason(r: string): string {
  if (r === "worse") return "Reported worse";
  if (r === "same") return "Symptoms not improved";
  if (r === "side_effect") return "Side effect reported";
  if (r === "no_response") return "No response";
  return r;
}

export default function OfficerOverviewPage() {
  const todayIst = getTodayIst();
  const [anchorDate, setAnchorDate] = useState<string>(todayIst);
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");

  // Live Clock (Asia/Kolkata)
  const [clockStr, setClockStr] = useState<string>("");

  // Dashboard Data State
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Students Table State
  const [studentTab, setStudentTab] = useState<"all" | "needs_attention" | "active" | "recovered">("all");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentCounts, setStudentCounts] = useState<StudentCounts>({
    all: 0,
    needs_attention: 0,
    active: 0,
    recovered: 0,
  });
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // Outreach Call Drawer
  const [activeAlertToCall, setActiveAlertToCall] = useState<{
    id: string;
    student_name: string;
    roll_number: string;
    branch: string;
    phone: string;
    reason: string;
  } | null>(null);
  const [isCallDrawerOpen, setIsCallDrawerOpen] = useState(false);

  const refreshDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Clock timer
  useEffect(() => {
    setClockStr(getIstClockString());
    const interval = setInterval(() => {
      setClockStr(getIstClockString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 3. Fetch dashboard function
  const loadDashboard = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const res = await fetch(
          `/api/officer/dashboard?anchorDate=${anchorDate}&period=${period}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error("Could not refresh. Retrying.");
        }
        const data: DashboardData = await res.json();
        setDashboard(data);
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage("Connection issue. Showing cached overview.");
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    },
    [anchorDate, period]
  );

  // 4. Fetch students function
  const loadStudents = useCallback(
    async (overrideSearch?: string) => {
      setIsStudentsLoading(true);
      try {
        const q = overrideSearch !== undefined ? overrideSearch : studentSearch;
        const res = await fetch(
          `/api/officer/students?anchorDate=${anchorDate}&period=${period}&tab=${studentTab}&search=${encodeURIComponent(
            q
          )}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          if (data.counts) {
            setStudentCounts(data.counts);
          }
        }
      } catch {
        // Fallback silently
      } finally {
        setIsStudentsLoading(false);
      }
    },
    [anchorDate, period, studentTab, studentSearch]
  );

  // Load when parameters change
  useEffect(() => {
    loadDashboard();
    loadStudents();
  }, [loadDashboard, loadStudents]);

  // 5. Debounced refresh for Realtime notifications
  const triggerDebouncedRefresh = useCallback(() => {
    if (refreshDebounceTimer.current) {
      clearTimeout(refreshDebounceTimer.current);
    }
    refreshDebounceTimer.current = setTimeout(() => {
      loadDashboard(true);
      loadStudents();
    }, 2000);
  }, [loadDashboard, loadStudents]);

  // 6. Supabase Realtime Subscription + 60s fallback poll
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("officer_realtime_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        triggerDebouncedRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dose_events" },
        triggerDebouncedRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visits" },
        triggerDebouncedRefresh
      )
      .subscribe();

    const fallbackPoll = setInterval(() => {
      loadDashboard(true);
      loadStudents();
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackPoll);
      if (refreshDebounceTimer.current) {
        clearTimeout(refreshDebounceTimer.current);
      }
    };
  }, [triggerDebouncedRefresh, loadDashboard, loadStudents]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const parts = anchorDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 1);
    const newStr = d.toLocaleDateString("en-CA");
    setAnchorDate(newStr);
  };

  const handleNextDay = () => {
    if (anchorDate >= todayIst) return;
    const parts = anchorDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    const newStr = d.toLocaleDateString("en-CA");
    setAnchorDate(newStr);
  };

  const handleBackToToday = () => {
    setAnchorDate(todayIst);
  };

  const isTodayAnchor = anchorDate === todayIst;

  const handleCallClick = (alert: any) => {
    setActiveAlertToCall({
      id: alert.id,
      student_name: alert.student_name,
      roll_number: alert.roll_number,
      branch: alert.branch,
      phone: alert.phone,
      reason: formatReason(alert.reason),
    });
    setIsCallDrawerOpen(true);
  };

  const handleCallSuccess = () => {
    setIsCallDrawerOpen(false);
    setActiveAlertToCall(null);
    loadDashboard(true);
    loadStudents();
  };

  const periodCaption =
    period === "today" ? "today" : period === "7d" ? "last 7 days" : "last 30 days";

  const commonProblemsCaption = dashboard?.common_problems
    ? `${formatPeriodDateLabel(dashboard.common_problems.start_date)} – ${formatPeriodDateLabel(
        dashboard.common_problems.end_date
      )}`
    : "";

  return (
    <div className="w-full flex-1 flex flex-col md:h-[calc(100dvh-62px)] md:overflow-hidden select-none">
      {/* Network / Offline Banner */}
      {isOffline && (
        <div className="text-[12px] text-[#B91C1C] bg-[#FFF5F5] border border-[#FEE2E2] px-3 py-1.5 rounded-[6px] mb-2 shrink-0">
          You appear to be offline.
        </div>
      )}
      {errorMessage && !isOffline && (
        <div className="text-[12px] text-[#6B7280] italic mb-1 shrink-0">
          {errorMessage}
        </div>
      )}

      {/* Main Column Flex */}
      <div className="flex-1 min-h-0 flex flex-col pt-3 pb-2 gap-3.5 md:overflow-hidden">
        {/* 1. DATE ROW */}
        <div className="order-1 flex flex-col sm:flex-row sm:items-end justify-between gap-2 shrink-0">
          <div>
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              CAMPUS HEALTH OVERVIEW
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <h1 className="font-serif text-[clamp(26px,2.8vw,40px)] font-normal leading-tight text-[#0F1B33] tracking-tight">
                {formatAnchorDate(anchorDate)}
              </h1>

              {/* Day arrows */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#0F1B33] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  title="Previous day"
                  aria-label="Previous day"
                >
                  <span className="font-serif text-[18px]">‹</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextDay}
                  disabled={isTodayAnchor}
                  className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#0F1B33] hover:bg-[#F9FAFB] disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Next day"
                  aria-label="Next day"
                >
                  <span className="font-serif text-[18px]">›</span>
                </button>
              </div>

              {!isTodayAnchor && (
                <button
                  type="button"
                  onClick={handleBackToToday}
                  className="text-[12px] font-sans text-[#0F1B33] hover:underline cursor-pointer"
                >
                  Back to today
                </button>
              )}

              {/* Live Asia/Kolkata Clock */}
              <div className="font-serif tabular-nums lining-nums text-[15px] text-[#6B7280] ml-1">
                {clockStr}
              </div>
            </div>
          </div>

          {/* Period Selector (Right side) */}
          <div className="flex items-center gap-3 text-[13px] font-sans self-start sm:self-auto mb-1">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "7 days" },
                { id: "30d", label: "30 days" },
              ] as const
            ).map((p, idx) => (
              <React.Fragment key={p.id}>
                {idx > 0 && <span className="text-[#E5E7EB]">|</span>}
                <button
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`cursor-pointer transition-colors ${
                    period === p.id
                      ? "text-[#0F1B33] font-medium border-b-2 border-[#0F1B33] pb-0.5"
                      : "text-[#6B7280] hover:text-[#0F1B33]"
                  }`}
                >
                  {p.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 2. STATUS BAND (Three soft shaded boxes) */}
        <div className="order-3 md:order-2 grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
          {/* Card 1: NEEDS ACTION (Faint rose tint) */}
          <div className="p-5 rounded-[20px] bg-[#FFF5F5] shadow-[0_14px_36px_rgba(15,27,51,0.06),0_2px_6px_rgba(15,27,51,0.03)] flex flex-col justify-between min-h-[115px]">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              NEEDS ACTION
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div
                  className={`font-serif text-[clamp(28px,3vw,38px)] leading-none tabular-nums lining-nums ${
                    (dashboard?.needs_action.open_alerts || 0) > 0
                      ? "text-[#B91C1C] font-semibold"
                      : "text-[#0F1B33]"
                  }`}
                >
                  {dashboard?.needs_action.open_alerts ?? 0}
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  Open alerts
                </div>
              </div>
              <div>
                <div className="font-serif text-[clamp(28px,3vw,38px)] leading-none text-[#0F1B33] tabular-nums lining-nums">
                  {dashboard?.needs_action.no_response ?? 0}
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  No response
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: UNDER TREATMENT (Faint blue tint) */}
          <div className="p-5 rounded-[20px] bg-[#F0F7FF] shadow-[0_14px_36px_rgba(15,27,51,0.06),0_2px_6px_rgba(15,27,51,0.03)] flex flex-col justify-between min-h-[115px]">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              UNDER TREATMENT
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="font-serif text-[clamp(28px,3vw,38px)] leading-none text-[#0F1B33] tabular-nums lining-nums">
                  {dashboard?.under_treatment.active ?? 0}
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  Active treatments
                </div>
              </div>
              <div>
                <div className="font-serif text-[clamp(28px,3vw,38px)] leading-none text-[#0F1B33] tabular-nums lining-nums flex items-baseline">
                  <span>{dashboard?.under_treatment.doses_confirmed ?? 0}</span>
                  <span className="text-[18px] text-[#6B7280] font-normal mx-1">of</span>
                  <span>{dashboard?.under_treatment.doses_due ?? 0}</span>
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  Doses confirmed {periodCaption}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: THIS PERIOD (Faint grey tint) */}
          <div className="p-5 rounded-[20px] bg-[#F9FAFB] shadow-[0_14px_36px_rgba(15,27,51,0.06),0_2px_6px_rgba(15,27,51,0.03)] flex flex-col justify-between min-h-[115px]">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              THIS PERIOD
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <div className="font-serif text-[clamp(28px,3vw,38px)] leading-none text-[#0F1B33] tabular-nums lining-nums">
                  {dashboard?.this_period.students_seen ?? 0}
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  Students seen
                </div>
              </div>
              <div>
                <div className="font-serif text-[clamp(28px,3vw,38px)] leading-none text-[#0F1B33] tabular-nums lining-nums">
                  {dashboard?.this_period.recovered ?? 0}
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  Recovered
                </div>
              </div>
              <div>
                <div className="font-serif text-[clamp(28px,3vw,38px)] leading-none text-[#0F1B33] tabular-nums lining-nums">
                  {dashboard?.this_period.not_recovered ?? 0}
                </div>
                <div className="text-[12px] font-sans text-[#6B7280] mt-1">
                  Not recovered
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE SECTION (Hairline above, thin vertical divider between 65% and 35%) */}
        <div className="order-4 md:order-3 border-t border-[#E5E7EB] pt-3 grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
          {/* Left 65%: LAST 7 DAYS, STUDENTS SEEN */}
          <div className="lg:col-span-8">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2">
              LAST 7 DAYS, STUDENTS SEEN
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(dashboard?.last_7_days || []).map((day) => (
                <div
                  key={day.date}
                  className="text-center py-1 flex flex-col items-center justify-between"
                >
                  <div className="text-[12px] font-sans text-[#6B7280]">
                    {day.weekday} {day.day_number}
                  </div>
                  <div
                    className={`font-serif text-[clamp(20px,2vw,28px)] font-normal text-[#0F1B33] mt-0.5 tabular-nums lining-nums inline-block ${
                      day.is_anchor ? "border-b-2 border-[#0F1B33] pb-0.5" : ""
                    }`}
                  >
                    {day.students_seen}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thin Vertical Hairline Divider & Right 35%: COMMON PROBLEMS */}
          <div className="lg:col-span-4 lg:border-l lg:border-[#E5E7EB] lg:pl-6">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                COMMON PROBLEMS {period === "30d" ? "THIS MONTH" : "THIS WEEK"}
              </div>
              <div className="text-[11px] font-sans text-[#6B7280]">
                {commonProblemsCaption}
              </div>
            </div>

            {dashboard?.common_problems?.widened && (
              <div className="text-[11px] font-sans text-[#6B7280] mb-1 italic">
                Widened to 30 days due to low volume.
              </div>
            )}

            <div className="space-y-1">
              {!dashboard?.common_problems?.items ||
              dashboard.common_problems.items.length === 0 ? (
                <div className="text-[13px] font-sans text-[#6B7280] py-1">
                  No problem data yet.
                </div>
              ) : (
                dashboard.common_problems.items.slice(0, 5).map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between text-[13px] font-sans"
                  >
                    <span className="text-[#0F1B33] truncate max-w-[200px]">
                      {item.category}
                    </span>
                    <span className="font-serif font-medium text-[#0F1B33] tabular-nums lining-nums">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. "NEEDS A CALL NOW" ALERT CARDS ROW */}
        <div className="order-2 md:order-4 border-t border-[#E5E7EB] pt-3 shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              NEEDS A CALL NOW
            </div>
            {(dashboard?.needs_call?.length || 0) > 0 && (
              <Link
                href="/officer/alerts"
                className="text-[12px] font-sans text-[#0F1B33] font-medium hover:underline cursor-pointer"
              >
                See all {dashboard?.needs_call?.length}
              </Link>
            )}
          </div>

          {!dashboard?.needs_call || dashboard.needs_call.length === 0 ? (
            <div className="text-[13px] font-sans text-[#6B7280] py-2">
              No students need a call right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dashboard.needs_call.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-[8px] border border-[#E5E7EB] bg-white flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-serif font-bold text-[14px] text-[#0F1B33] leading-tight truncate">
                      {alert.student_name}
                    </div>
                    <div className="text-[11px] font-sans text-[#6B7280] mt-0.5 truncate">
                      {alert.roll_number} • {alert.branch}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-sans font-semibold text-[#B91C1C] leading-tight">
                      {formatReason(alert.reason)}
                    </div>
                    <div className="text-[11px] font-sans text-[#6B7280] mt-0.5">
                      {formatWaiting(alert.created_at)}
                    </div>
                  </div>

                  <a
                    href={`tel:${alert.phone}`}
                    onClick={() => handleCallClick(alert)}
                    className="inline-flex items-center justify-center h-[28px] px-3 rounded-[6px] bg-[#0F1B33] text-white text-[12px] font-medium hover:bg-[#1A2D54] transition-colors cursor-pointer shrink-0"
                  >
                    Call
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. STUDENTS TABLE (Takes leftover height on desktop, scrolls internally) */}
        <div className="order-5 md:order-5 border-t border-[#E5E7EB] pt-3 flex-1 min-h-0 flex flex-col md:overflow-hidden pb-14 md:pb-0">
          {/* Header Row: Label, Tabs, and Search Input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                STUDENTS
              </span>

              {/* Text Tabs: All N | Needs attention N | Active N | Recovered N */}
              <div className="flex items-center gap-3 text-[13px] font-sans">
                {(
                  [
                    { id: "all", label: "All", count: studentCounts.all },
                    { id: "needs_attention", label: "Needs attention", count: studentCounts.needs_attention },
                    { id: "active", label: "Active", count: studentCounts.active },
                    { id: "recovered", label: "Recovered", count: studentCounts.recovered },
                  ] as const
                ).map((t, idx) => (
                  <React.Fragment key={t.id}>
                    {idx > 0 && <span className="text-[#E5E7EB]">|</span>}
                    <button
                      type="button"
                      onClick={() => setStudentTab(t.id)}
                      className={`cursor-pointer transition-colors ${
                        studentTab === t.id
                          ? "text-[#0F1B33] font-medium border-b-2 border-[#0F1B33] pb-0.5"
                          : "text-[#6B7280] hover:text-[#0F1B33]"
                      }`}
                    >
                      {t.label} <span className="tabular-nums">{t.count}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Small Search Field Right */}
            <div className="w-56 self-start sm:self-auto">
              <input
                type="text"
                placeholder="Search roll number or name"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  loadStudents(e.target.value);
                }}
                className="w-full h-7 pl-2.5 pr-2.5 text-[12px] bg-white border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0F1B33]"
              />
            </div>
          </div>

          {/* Clean Table with Internal Scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto border-t border-[#E5E7EB]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-[#E5E7EB]">
                <tr className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                  <th className="py-2 pr-3 font-semibold">STUDENT</th>
                  <th className="py-2 px-3 font-semibold">ROLL NUMBER</th>
                  <th className="py-2 px-3 font-semibold">BRANCH</th>
                  <th className="py-2 px-3 font-semibold">STATUS</th>
                  <th className="py-2 px-3 font-semibold">LAST VISIT</th>
                  <th className="py-2 px-3 font-semibold">PHONE</th>
                  <th className="py-2 pl-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
                {isStudentsLoading && students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#6B7280]">
                      Loading students...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#6B7280]">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const lastVisitFormatted = s.last_visit_date
                      ? new Date(s.last_visit_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    // Status dot styling
                    let dotColor = "bg-[#D97706]"; // Amber default
                    let statusLabel = s.current_status;
                    if (s.current_status === "Recovered") {
                      dotColor = "bg-[#059669]";
                    } else if (
                      s.current_status === "Not recovered" ||
                      s.current_status === "Needs attention"
                    ) {
                      dotColor = "bg-[#B91C1C]";
                    } else if (s.current_status === "No response") {
                      dotColor = "bg-[#9CA3AF]";
                    }

                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 pr-3 font-serif font-bold text-[#0F1B33]">
                          {s.name}
                        </td>
                        <td className="py-2 px-3 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                          {s.roll_number}
                        </td>
                        <td className="py-2 px-3 text-[#6B7280]">{s.branch}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            <span className="text-[#0F1B33]">{statusLabel}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#6B7280] tabular-nums whitespace-nowrap">
                          {lastVisitFormatted}
                        </td>
                        <td className="py-2 px-3 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                          {s.phone}
                        </td>
                        <td className="py-2 pl-3 text-right">
                          <a
                            href={`tel:${s.phone}`}
                            className="text-[#0F1B33] font-medium hover:underline cursor-pointer"
                          >
                            Call
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Outreach Drawer */}
      {isCallDrawerOpen && activeAlertToCall && (
        <OfficerCallDrawer
          isOpen={isCallDrawerOpen}
          onClose={() => setIsCallDrawerOpen(false)}
          alertId={activeAlertToCall.id}
          studentName={activeAlertToCall.student_name}
          rollNumber={activeAlertToCall.roll_number}
          branch={activeAlertToCall.branch}
          phone={activeAlertToCall.phone}
          reason={activeAlertToCall.reason}
          onSuccess={handleCallSuccess}
        />
      )}
    </div>
  );
}
