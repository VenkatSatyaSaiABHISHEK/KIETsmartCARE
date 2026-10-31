"use client";

import React from "react";
import {
  Users,
  BellRing,
  CheckCircle2,
  HeartHandshake,
  AlertOctagon,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { OfficerKPIs } from "@/lib/officer/types";

interface KPICardsGridProps {
  kpis: OfficerKPIs | null;
  isLoading?: boolean;
}

export function KPICardsGrid({ kpis, isLoading = false }: KPICardsGridProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse space-y-2"
          >
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-2 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Students Treated",
      value: kpis.students_treated.toLocaleString(),
      subtext: "Campus OPD total",
      icon: Users,
      iconColor: "text-[#2563EB]",
      bgAccent: "bg-blue-50/50",
    },
    {
      title: "Alarms Active",
      value: kpis.alarms_active.toLocaleString(),
      subtext: "Phone reminders live",
      icon: BellRing,
      iconColor: "text-indigo-600",
      bgAccent: "bg-indigo-50/50",
    },
    {
      title: "Doses Confirmed",
      value: `${kpis.doses_confirmed_pct}%`,
      subtext: "Meal adherence rate",
      icon: CheckCircle2,
      iconColor: "text-[#C9A24B]", // Gold highlight used sparingly
      valueColor: "text-[#C9A24B]",
      bgAccent: "bg-amber-50/40",
      highlightBorder: "border-[#C9A24B]/30",
    },
    {
      title: "Recovered",
      value: kpis.recovered_count.toLocaleString(),
      subtext: "Reported Better",
      icon: HeartHandshake,
      iconColor: "text-emerald-600",
      bgAccent: "bg-emerald-50/40",
    },
    {
      title: "Not Recovered",
      value: kpis.not_recovered_count.toLocaleString(),
      subtext: "Worse or Same",
      icon: TrendingUp,
      iconColor: "text-slate-600",
      bgAccent: "bg-slate-50",
    },
    {
      title: "Open Red Alerts",
      value: kpis.open_red_alerts.toLocaleString(),
      subtext: "Urgent telephonic call",
      icon: AlertOctagon,
      iconColor: "text-red-600",
      valueColor: "text-red-600",
      bgAccent: "bg-red-50/80",
      highlightBorder: "border-red-300 ring-2 ring-red-100",
      urgentBadge: true,
    },
    {
      title: "No-Response Cases",
      value: kpis.no_response_cases.toLocaleString(),
      subtext: "Unanswered for 24h",
      icon: HelpCircle,
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
      bgAccent: "bg-amber-50/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative rounded-2xl border bg-white p-4.5 shadow-xs transition-all hover:shadow-md ${
              card.highlightBorder || "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-semibold text-slate-500 truncate">
                {card.title}
              </span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgAccent} ${card.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-1">
              <div
                className={`text-2xl font-extrabold tracking-tight font-mono ${
                  card.valueColor || "text-[#0B1736]"
                }`}
              >
                {card.value}
              </div>
              <p className="mt-1 text-[11px] text-slate-400 truncate">
                {card.subtext}
              </p>
            </div>

            {card.urgentBadge && kpis.open_red_alerts > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
