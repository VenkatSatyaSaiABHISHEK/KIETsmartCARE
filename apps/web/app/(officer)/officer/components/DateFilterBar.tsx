"use client";

import React from "react";
import { Filter, Calendar, RotateCcw } from "lucide-react";
import { FilterParams } from "@/lib/officer/types";

interface DateFilterBarProps {
  filters: FilterParams;
  setFilters: React.Dispatch<React.SetStateAction<FilterParams>>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function DateFilterBar({
  filters,
  setFilters,
  onRefresh,
  isLoading = false,
}: DateFilterBarProps) {
  const branches = [
    { value: "all", label: "All Departments" },
    { value: "computer science", label: "Computer Science" },
    { value: "information technology", label: "Information Technology" },
    { value: "electronics & comm.", label: "Electronics & Comm." },
    { value: "mechanical", label: "Mechanical Engineering" },
    { value: "electrical", label: "Electrical Engineering" },
    { value: "pharmacy", label: "Pharmacy" },
  ];

  const years = [
    { value: "all", label: "All Years" },
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
      {/* Date Range Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
          <Calendar className="mr-1 h-3.5 w-3.5 text-slate-400" />
          Range:
        </span>
        {(["today", "7days", "30days", "custom"] as const).map((range) => {
          const isSelected = filters.dateRange === range;
          const labels = {
            today: "Today",
            "7days": "Last 7 Days",
            "30days": "Last 30 Days",
            custom: "Custom Range",
          };
          return (
            <button
              key={range}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, dateRange: range }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {labels[range]}
            </button>
          );
        })}

        {/* Custom date range inputs if selected */}
        {filters.dateRange === "custom" && (
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="date"
              value={filters.customStartDate || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, customStartDate: e.target.value }))
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={filters.customEndDate || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, customEndDate: e.target.value }))
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        )}
      </div>

      {/* Branch & Year Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filters.branch}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, branch: e.target.value }))
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB]"
          >
            {branches.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={filters.year}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, year: e.target.value }))
          }
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB]"
        >
          {years.map((y) => (
            <option key={y.value} value={y.value}>
              {y.label}
            </option>
          ))}
        </select>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh aggregate metrics from views"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 text-slate-500 ${
                isLoading ? "animate-spin text-[#2563EB]" : ""
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
