"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  DailyVisitsDataPoint,
  RecoveryDistributionDataPoint,
  ProblemCategoryDataPoint,
  AdherenceTrendDataPoint,
} from "@/lib/officer/types";

interface DashboardChartsProps {
  dailyVisits: DailyVisitsDataPoint[];
  recoveryDistribution: RecoveryDistributionDataPoint[];
  problemCategories: ProblemCategoryDataPoint[];
  adherenceTrend: AdherenceTrendDataPoint[];
}

export function DashboardCharts({
  dailyVisits,
  recoveryDistribution,
  problemCategories,
  adherenceTrend,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Daily Consultations Time Series (Line Chart) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1736]">
              Daily Consultations (Visits / Day)
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated from view_officer_daily_visits
            </p>
          </div>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#2563EB]">
            Line Trend
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyVisits} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B1736",
                  color: "#FFFFFF",
                  borderRadius: 10,
                  fontSize: 12,
                  border: "none",
                }}
                labelStyle={{ fontWeight: "bold", color: "#C9A24B" }}
              />
              <Line
                type="monotone"
                dataKey="visits"
                name="Visits"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563EB" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Recovery Rate Distribution (Donut Chart) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1736]">
              End-of-Course Recovery Outcomes
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated from view_officer_recovery_distribution
            </p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            Donut KPI
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between h-64 w-full">
          <div className="h-56 w-56 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recoveryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {recoveryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B1736",
                    color: "#FFFFFF",
                    borderRadius: 10,
                    fontSize: 12,
                    border: "none",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-[#0B1736]">91.8%</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Better</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs flex-1 pl-4">
            {recoveryDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Problem Categories Breakdown (Bar Chart) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1736]">
              Epidemiology: Visits by Problem Category
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated from view_officer_problem_categories
            </p>
          </div>
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
            Categorical Bar
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={problemCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B1736",
                  color: "#FFFFFF",
                  borderRadius: 10,
                  fontSize: 12,
                  border: "none",
                }}
              />
              <Bar dataKey="count" name="Case Count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Dose Adherence Rate Trend (Area Chart) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1736]">
              Mobile Dose Adherence Rate Trend (%)
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated from view_officer_adherence_trend (Gold KPI)
            </p>
          </div>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#C9A24B] border border-amber-200">
            Adherence Area
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={adherenceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A24B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C9A24B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B1736",
                  color: "#FFFFFF",
                  borderRadius: 10,
                  fontSize: 12,
                  border: "none",
                }}
                formatter={(val: any) => [`${val}%`, "Adherence"]}
              />
              <Area
                type="monotone"
                dataKey="adherence_pct"
                name="Adherence %"
                stroke="#C9A24B"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#goldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
