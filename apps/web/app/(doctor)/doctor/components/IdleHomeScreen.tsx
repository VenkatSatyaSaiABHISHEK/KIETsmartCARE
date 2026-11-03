"use client";

import React, { useState, useEffect, useRef } from "react";
import { DoctorService } from "@/lib/doctor/service";
import { StudentSearchResult } from "@/lib/doctor/types";

interface TodaySummary {
  patients_seen: number;
  courses_active: number;
  alerts: number;
}

interface TodayPatientRow {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  year: number;
  problem: string;
  consultation_time: string;
  status: string;
}

interface IdleHomeScreenProps {
  onSelectStudent: (rollNumber: string) => void;
  isLoadingStudent?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

// In-memory module cache for doctor home metrics
let cachedDoctorTodayData: {
  summary: TodaySummary;
  todayPatients: TodayPatientRow[];
} | null = null;

export function IdleHomeScreen({
  onSelectStudent,
  isLoadingStudent = false,
  errorMessage = null,
  onClearError,
}: IdleHomeScreenProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [todaySummary, setTodaySummary] = useState<TodaySummary>(() => {
    return cachedDoctorTodayData?.summary || {
      patients_seen: 0,
      courses_active: 0,
      alerts: 0,
    };
  });
  const [todayPatients, setTodayPatients] = useState<TodayPatientRow[]>(() => {
    return cachedDoctorTodayData?.todayPatients || [];
  });
  const [isTodayLoading, setIsTodayLoading] = useState(() => !cachedDoctorTodayData);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Auto-focus search field on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 2. Load Today summary & patient rows
  useEffect(() => {
    async function loadTodayData() {
      if (!cachedDoctorTodayData) {
        setIsTodayLoading(true);
      }
      try {
        const res = await fetch("/api/doctor/today", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const summary = data.summary || { patients_seen: 0, courses_active: 0, alerts: 0 };
          const patients = data.todayPatients || [];
          cachedDoctorTodayData = { summary, todayPatients: patients };
          setTodaySummary(summary);
          setTodayPatients(patients);
        }
      } catch (err) {
        console.warn("Failed to load today data:", err);
      } finally {
        setIsTodayLoading(false);
      }
    }
    loadTodayData();
  }, []);

  // 3. Debounced Live Search (120ms) with instant feedback
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    if (onClearError) onClearError();
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await DoctorService.searchStudents(query.trim());
        setSearchResults(results);
        setHasSearched(true);
        setSelectedIndex(-1);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, onClearError]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (roll: string) => {
    setSearchResults([]);
    onSelectStudent(roll.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex].roll_number);
      } else if (searchResults.length === 1) {
        handleSelect(searchResults[0].roll_number);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setSearchResults([]);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col pt-10 pb-6 select-none">
      {/* 1. Large Search Section Matching Image 2 */}
      <div className="w-full flex flex-col items-center">
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.15em] text-[#6B7280] mb-4 text-center">
          NEXT PATIENT
        </div>

        {/* 760px Wide Search Box with Wide Diffused Shadow */}
        <div ref={wrapperRef} className="relative w-full max-w-[760px]">
          <div className="w-full h-[72px] bg-white rounded-[16px] shadow-[0_14px_36px_rgba(15,27,51,0.08),0_2px_6px_rgba(15,27,51,0.04)] flex items-center px-6 gap-3 border border-transparent focus-within:border-[#1D4ED8]/30 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={isLoadingStudent}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter roll number or student name"
              className="w-full h-full text-[17px] sm:text-[19px] font-sans text-[#0F1B33] placeholder-[#9CA3AF] bg-transparent focus:outline-none disabled:opacity-60"
            />

            {/* Spinner or Clear Icon */}
            {(isSearching || isLoadingStudent) ? (
              <div className="shrink-0 flex items-center pr-1 text-[#1D4ED8] animate-spin">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearchResults([]);
                  if (onClearError) onClearError();
                  inputRef.current?.focus();
                }}
                className="shrink-0 w-7 h-7 rounded-full text-[#9CA3AF] hover:text-[#0F1B33] flex items-center justify-center text-[15px] font-bold"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {query.trim().length > 0 && (
            <div className="absolute top-[80px] left-0 right-0 bg-white rounded-[12px] shadow-2xl border border-[#E5E7EB] z-30 overflow-hidden divide-y divide-[#E5E7EB]">
              {isSearching && searchResults.length === 0 ? (
                <div className="p-4 flex items-center justify-center gap-2 text-[13px] text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-ping" />
                  <span>Searching student directory...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.roll_number)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      idx === selectedIndex ? "bg-[#F0F7FF]" : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-serif font-bold text-[15px] text-[#0F1B33]">
                        {item.name}
                      </div>
                      <div className="text-[12px] font-sans text-[#6B7280]">
                        {item.roll_number} • {item.branch} ({item.year}th Year)
                      </div>
                    </div>
                    <span className="text-[12px] font-sans text-[#1D4ED8] font-medium flex items-center gap-1">
                      Open consultation →
                    </span>
                  </div>
                ))
              ) : hasSearched && !isSearching ? (
                <div className="p-4 text-center text-[13px] text-[#6B7280]">
                  No student found matching &ldquo;{query}&rdquo;.
                </div>
              ) : null}
            </div>
          )}

          {/* Status, Loading or Error message under search box */}
          {errorMessage ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-[#B91C1C] text-[13px] font-medium bg-[#FEF2F2] border border-[#FEE2E2] px-4 py-2.5 rounded-[10px] shadow-sm animate-in fade-in duration-200">
              <svg className="w-4 h-4 text-[#B91C1C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          ) : isLoadingStudent ? (
            <div className="mt-3 flex items-center justify-center gap-2 text-[#1D4ED8] text-[13px] font-medium animate-pulse">
              <svg className="animate-spin h-3.5 w-3.5 text-[#1D4ED8]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading student clinical record &amp; past visits...</span>
            </div>
          ) : (
            <div className="text-center text-[13px] font-sans text-[#6B7280] mt-3">
              Press Enter to open the student
            </div>
          )}
        </div>
      </div>

      {/* 2. Divider Hairline */}
      <div className="w-full border-t border-[#E5E7EB] mt-12 pt-6">
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-4">
          TODAY
        </div>

        {/* Three Large Numerals */}
        <div className="grid grid-cols-3 gap-6 max-w-[760px] mb-8">
          <div>
            {isTodayLoading && !cachedDoctorTodayData ? (
              <div className="h-[40px] w-14 bg-black/10 rounded-[6px] animate-pulse" />
            ) : (
              <div className="font-serif text-[40px] text-[#0F1B33] leading-none tabular-nums">
                {todaySummary.patients_seen}
              </div>
            )}
            <div className="text-[13px] font-sans text-[#6B7280] mt-1.5">
              Patients seen
            </div>
          </div>

          <div>
            {isTodayLoading && !cachedDoctorTodayData ? (
              <div className="h-[40px] w-14 bg-black/10 rounded-[6px] animate-pulse" />
            ) : (
              <div className="font-serif text-[40px] text-[#0F1B33] leading-none tabular-nums">
                {todaySummary.courses_active}
              </div>
            )}
            <div className="text-[13px] font-sans text-[#6B7280] mt-1.5">
              Courses active
            </div>
          </div>

          <div>
            {isTodayLoading && !cachedDoctorTodayData ? (
              <div className="h-[40px] w-14 bg-black/10 rounded-[6px] animate-pulse" />
            ) : (
              <div className="font-serif text-[40px] text-[#0F1B33] leading-none tabular-nums">
                {todaySummary.alerts}
              </div>
            )}
            <div className="text-[13px] font-sans text-[#6B7280] mt-1.5">
              {todaySummary.alerts === 1 ? "Alert" : "Alerts"}
            </div>
          </div>
        </div>

        {/* Clean Table of Today's Patients */}
        <div className="w-full border-t border-[#E5E7EB]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] border-b border-[#E5E7EB]">
                <th className="py-2.5 pr-4 font-semibold">PATIENT</th>
                <th className="py-2.5 px-4 font-semibold">ROLL NUMBER</th>
                <th className="py-2.5 px-4 font-semibold">TIME</th>
                <th className="py-2.5 pl-4 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
              {isTodayLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#6B7280]">
                    Loading today&apos;s consultations...
                  </td>
                </tr>
              ) : todayPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#6B7280]">
                    No patients yet today. Search a roll number to begin.
                  </td>
                </tr>
              ) : (
                todayPatients.map((p) => {
                  let dotColor = "bg-[#D97706]";
                  let statusWord = "Under treatment";

                  if (p.status === "recovered") {
                    dotColor = "bg-[#059669]";
                    statusWord = "Recovered";
                  } else if (p.status === "needs_attention" || p.status === "not_recovered") {
                    dotColor = "bg-[#B91C1C]";
                    statusWord = "Needs attention";
                  } else if (p.status === "no_response") {
                    dotColor = "bg-[#9CA3AF]";
                    statusWord = "No response";
                  }

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectStudent(p.roll_number)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 pr-4 font-serif font-bold text-[#0F1B33]">
                        {p.student_name}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                        {p.roll_number}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[12px] text-[#6B7280] tabular-nums">
                        {p.consultation_time}
                      </td>
                      <td className="py-2.5 pl-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <span className="text-[#0F1B33]">{statusWord}</span>
                        </span>
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
  );
}

