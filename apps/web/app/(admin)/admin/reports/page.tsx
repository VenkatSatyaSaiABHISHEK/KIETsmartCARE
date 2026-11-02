"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, X } from "lucide-react";

export const dynamic = "force-dynamic";

interface AttendanceRecord {
  id: string;
  date: string;
  time: string;
  roll_number: string;
  student_name: string;
  branch: string;
  year: number;
  doctor_name: string;
}

export default function AdminReportsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayRecords, setSelectedDayRecords] = useState<AttendanceRecord[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState<string>("");

  // Export controls
  const [exportRange, setExportRange] = useState<"month" | "range" | "all">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadAttendance = async () => {
    setIsLoading(true);
    setExportMessage(null);
    try {
      const res = await fetch("/api/admin/attendance", { cache: "no-store" });
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayRecords(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayRecords(null);
  };

  // Group by YYYY-MM-DD
  const recordsByDay = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const list = recordsByDay.get(r.date) || [];
    list.push(r);
    recordsByDay.set(r.date, list);
  }

  const handleDayClick = (dayNumber: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const dayRecs = recordsByDay.get(dayStr) || [];
    setSelectedDayStr(dayStr);
    setSelectedDayRecords(dayRecs);
  };

  const handleDownloadCsv = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      let url = `/api/admin/export?range=${exportRange}`;
      if (exportRange === "range") {
        if (!customStart || !customEnd) {
          setExportMessage("Please select both start and end dates.");
          setIsExporting(false);
          return;
        }
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportMessage(data.error || "No records in this period.");
        return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `kiet-attendance-${exportRange}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setExportMessage("Network error during CSV download.");
    } finally {
      setIsExporting(false);
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="relative space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text)]">
            Campus Attendance Reports
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
            Institutional clinic attendance records. Clinical diagnoses and prescriptions remain restricted by Row-Level Security.
          </p>
        </div>

        {/* CSV Export Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={exportRange}
            onChange={(e) => setExportRange(e.target.value as any)}
            className="h-[32px] px-2.5 text-[13px] rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="month">This Month</option>
            <option value="range">Custom Range</option>
            <option value="all">All-time Records</option>
          </select>

          {exportRange === "range" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-[32px] px-2 text-[12px] font-mono rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
              />
              <span className="text-[12px] text-[var(--text-muted)]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-[32px] px-2 text-[12px] font-mono rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={isExporting}
            className="inline-flex h-[32px] items-center gap-1.5 px-3 rounded-[6px] bg-[var(--text)] text-[var(--bg)] text-[13px] font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? "Exporting..." : "Download CSV"}</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 text-[13px] rounded-[6px] border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
          {exportMessage}
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="text-[16px] font-medium text-[var(--text)]">{monthName}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="h-[32px] w-[32px] flex items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] cursor-pointer text-[var(--text)]"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="h-[32px] w-[32px] flex items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] cursor-pointer text-[var(--text)]"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-[var(--border)] rounded-[8px] overflow-hidden bg-[var(--bg)]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-subtle)] text-center text-[12px] font-medium text-[var(--text-muted)] py-2">
          {weekDays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border)]">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[96px] bg-[var(--bg-subtle)]/40 p-2" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayRecs = recordsByDay.get(dayStr) || [];
            const count = dayRecs.length;
            const isSelected = selectedDayStr === dayStr;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[96px] p-2 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--bg-hover)] ring-2 ring-[var(--accent)] ring-inset"
                    : "hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <span className="text-[13px] font-medium text-[var(--text)] tabular-nums">
                  {dayNum}
                </span>

                <div className="mt-2">
                  {count > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border border-[var(--border)] bg-[var(--bg)] text-[12px] font-medium text-[var(--text)] tabular-nums">
                      <span>{count}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {count === 1 ? "student" : "students"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Drawer for Selected Day Attendance */}
      {selectedDayRecords && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-[var(--bg)] border-l border-[var(--border)] shadow-none flex flex-col">
          {/* Drawer Header */}
          <div className="h-[64px] px-6 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--text)]">
                Attendance for {selectedDayStr}
              </h3>
              <p className="text-[12px] text-[var(--text-muted)]">
                {selectedDayRecords.length} student{selectedDayRecords.length === 1 ? "" : "s"} attended
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayRecords(null)}
              className="p-1 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {selectedDayRecords.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[var(--text-muted)]">
                No clinic visits recorded on this date.
              </div>
            ) : (
              selectedDayRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-[8px] border border-[var(--border)] bg-[var(--bg)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[var(--text)]">
                      {r.student_name}
                    </span>
                    <span className="text-[12px] font-mono text-[var(--text-muted)] tabular-nums">
                      {r.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                    <span className="font-mono text-[var(--text)]">{r.roll_number}</span>
                    <span>•</span>
                    <span>{r.branch}</span>
                    <span>•</span>
                    <span>Year {r.year}</span>
                  </div>

                  <div className="pt-1 text-[11px] text-[var(--text-muted)]">
                    Attended by: <span className="font-medium text-[var(--text)]">{r.doctor_name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

