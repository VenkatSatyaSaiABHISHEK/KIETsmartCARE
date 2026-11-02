"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

interface StudentItem {
  id: string;
  name: string;
  roll_number: string;
  branch: string;
  year: number;
  phone: string;
  status: string;
  last_visit_date: string;
}

function OfficerStudentsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [counts, setCounts] = useState<{
    all: number;
    needs_attention: number;
    active: number;
    recovered: number;
  }>({
    all: 0,
    needs_attention: 0,
    active: 0,
    recovered: 0,
  });

  const [search, setSearch] = useState(initialSearch);
  const [tab, setTab] = useState<"all" | "needs_attention" | "active" | "recovered">("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real students from API
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("period", "all");
      params.set("tab", tab);
      if (search) params.set("search", search);
      if (branchFilter !== "all") params.set("branch", branchFilter);
      if (yearFilter !== "all") params.set("year", yearFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "150");

      const res = await fetch(`/api/officer/students?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.warn("Failed to load students:", e);
    } finally {
      setIsLoading(false);
    }
  }, [tab, search, branchFilter, yearFilter, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  return (
    <div className="w-full flex-1 flex flex-col py-6 select-none">
      {/* 1. Header Section */}
      <div className="pb-5 border-b border-[#E5E7EB]">
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
          STUDENTS
        </div>
        <h1 className="font-serif text-[clamp(26px,2.8vw,36px)] font-normal text-[#0F1B33] tracking-tight mt-0.5">
          All students
        </h1>
      </div>

      {/* 2. Controls Row: Search + 3 Plain Underlined Selects + Text Tabs */}
      <div className="py-4 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Text Tabs: All N | Needs attention N | Active N | Recovered N */}
        <div className="flex items-center gap-3 text-[13px] font-sans">
          {(
            [
              { id: "all", label: "All", count: counts.all },
              { id: "needs_attention", label: "Needs attention", count: counts.needs_attention },
              { id: "active", label: "Active", count: counts.active },
              { id: "recovered", label: "Recovered", count: counts.recovered },
            ] as const
          ).map((t, idx) => (
            <React.Fragment key={t.id}>
              {idx > 0 && <span className="text-[#E5E7EB]">|</span>}
              <button
                type="button"
                onClick={() => setTab(t.id)}
                className={`cursor-pointer transition-colors ${
                  tab === t.id
                    ? "text-[#0F1B33] font-medium border-b-2 border-[#0F1B33] pb-0.5"
                    : "text-[#6B7280] hover:text-[#0F1B33]"
                }`}
              >
                {t.label} <span className="tabular-nums">{t.count}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Filters Row: Plain Underlined Selects + Search Field */}
        <div className="flex flex-wrap items-center gap-4 text-[13px] font-sans">
          {/* Branch Select */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-transparent border-b border-[#E5E7EB] py-1 text-[#0F1B33] focus:outline-none focus:border-[#0F1B33] cursor-pointer"
          >
            <option value="all">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="AIML">AIML</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
          </select>

          {/* Year Select */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-transparent border-b border-[#E5E7EB] py-1 text-[#0F1B33] focus:outline-none focus:border-[#0F1B33] cursor-pointer"
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-b border-[#E5E7EB] py-1 text-[#0F1B33] focus:outline-none focus:border-[#0F1B33] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active_treatment">Active treatment</option>
            <option value="recovered">Recovered</option>
            <option value="not_recovered">Not recovered</option>
            <option value="no_response">No response</option>
          </select>

          {/* Search Box */}
          <div className="w-56">
            <input
              type="text"
              placeholder="Search roll number or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-3 pr-3 text-[13px] bg-white border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0F1B33]"
            />
          </div>
        </div>
      </div>

      {/* 3. Table: Identical in style to Overview table with infinite scroll */}
      <div className="flex-1 min-h-[400px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 border-b border-[#E5E7EB]">
            <tr className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
              <th className="py-3 pr-3 font-semibold">STUDENT</th>
              <th className="py-3 px-3 font-semibold">ROLL NUMBER</th>
              <th className="py-3 px-3 font-semibold">BRANCH</th>
              <th className="py-3 px-3 font-semibold">YEAR</th>
              <th className="py-3 px-3 font-semibold">STATUS</th>
              <th className="py-3 px-3 font-semibold">LAST VISIT</th>
              <th className="py-3 px-3 font-semibold">PHONE</th>
              <th className="py-3 pl-3 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans">
            {isLoading && students.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#6B7280]">
                  Loading students registry...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#6B7280]">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((s: any) => {
                const lastVisitFormatted = s.last_visit_date
                  ? new Date(s.last_visit_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                let dotColor = "bg-[#D97706]"; // Amber default
                let statusLabel = s.status || s.current_status || "Active treatment";
                if (statusLabel === "Recovered") {
                  dotColor = "bg-[#059669]";
                } else if (
                  statusLabel === "Not recovered" ||
                  statusLabel === "Needs attention"
                ) {
                  dotColor = "bg-[#B91C1C]";
                } else if (statusLabel === "No response") {
                  dotColor = "bg-[#9CA3AF]";
                }

                return (
                  <tr key={s.id || s.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-3 font-serif font-bold text-[#0F1B33]">
                      {s.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                      {s.roll_number}
                    </td>
                    <td className="py-3 px-3 text-[#6B7280]">{s.branch}</td>
                    <td className="py-3 px-3 text-[#6B7280]">{s.year}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span className="text-[#0F1B33]">{statusLabel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#6B7280] tabular-nums whitespace-nowrap">
                      {lastVisitFormatted}
                    </td>
                    <td className="py-3 px-3 font-mono text-[12px] text-[#0F1B33] tabular-nums">
                      {s.phone}
                    </td>
                    <td className="py-3 pl-3 text-right">
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
  );
}

export default function OfficerStudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-[#6B7280]">
          Loading students registry...
        </div>
      }
    >
      <OfficerStudentsContent />
    </Suspense>
  );
}
