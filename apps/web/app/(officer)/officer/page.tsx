"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { OfficerHeader } from "./components/OfficerHeader";
import { DateFilterBar } from "./components/DateFilterBar";
import { KPICardsGrid } from "./components/KPICardsGrid";
import { DashboardCharts } from "./components/DashboardCharts";
import { OfficerService } from "@/lib/officer/service";
import {
  OfficerKPIs,
  DailyVisitsDataPoint,
  RecoveryDistributionDataPoint,
  ProblemCategoryDataPoint,
  AdherenceTrendDataPoint,
  FilterParams,
} from "@/lib/officer/types";
import { AlertOctagon, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

export default function OfficerDashboardPage() {
  const [filters, setFilters] = useState<FilterParams>({
    dateRange: "30days",
    branch: "all",
    year: "all",
  });

  const [kpis, setKpis] = useState<OfficerKPIs | null>(null);
  const [dailyVisits, setDailyVisits] = useState<DailyVisitsDataPoint[]>([]);
  const [recoveryDistribution, setRecoveryDistribution] = useState<RecoveryDistributionDataPoint[]>([]);
  const [problemCategories, setProblemCategories] = useState<ProblemCategoryDataPoint[]>([]);
  const [adherenceTrend, setAdherenceTrend] = useState<AdherenceTrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, dailyRes, recRes, catRes, adhRes] = await Promise.all([
        OfficerService.getKPIs(filters),
        OfficerService.getDailyVisitsSeries(filters),
        OfficerService.getRecoveryDistribution(filters),
        OfficerService.getProblemCategories(filters),
        OfficerService.getAdherenceTrend(filters),
      ]);
      setKpis(kpiRes);
      setDailyVisits(dailyRes);
      setRecoveryDistribution(recRes);
      setProblemCategories(catRes);
      setAdherenceTrend(adhRes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <OfficerHeader
        title="Campus Health Surveillance Executive Dashboard"
        subtitle="Aggregate epidemiological monitoring, adherence metrics, and telephonic escalation management"
        urgentCount={kpis?.open_red_alerts || 0}
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        {/* Urgent Action Banner if Red Alerts Exist */}
        {kpis && kpis.open_red_alerts > 0 && (
          <div className="rounded-2xl border border-red-300 bg-red-50/70 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-950">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shrink-0 shadow-md shadow-red-500/20">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  {kpis.open_red_alerts} Urgent Red Alerts Awaiting Telephonic Contact
                </h4>
                <p className="text-xs text-red-800">
                  Students have reported &ldquo;Worse&rdquo;, &ldquo;Same&rdquo;, or adverse side effects. Protocol requires immediate outreach.
                </p>
              </div>
            </div>
            <Link
              href="/officer/alerts"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 transition-all shrink-0"
            >
              Open Alerts Queue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* 2. Date Range & Parameter Filter Bar */}
        <DateFilterBar
          filters={filters}
          setFilters={setFilters}
          onRefresh={loadDashboardData}
          isLoading={isLoading}
        />

        {/* 3. Big Metric Cards (KPIs) */}
        <KPICardsGrid kpis={kpis} isLoading={isLoading} />

        {/* 4. Enterprise Recharts (Lines, Donut, Bar, Area) */}
        <DashboardCharts
          dailyVisits={dailyVisits}
          recoveryDistribution={recoveryDistribution}
          problemCategories={problemCategories}
          adherenceTrend={adherenceTrend}
        />

        {/* Privacy by Design Notice */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-[#2563EB]" />
            <span>
              <strong>Surveillance Architecture Note:</strong> All figures are strictly aggregated server-side via SQL views (<code>view_officer_daily_visits</code>, <code>view_officer_recovery_distribution</code>) and security-definer RPCs. Raw consultation notes are never transferred to the browser.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
