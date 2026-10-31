"use client";

import React from "react";
import { ShieldCheck, Radio, Phone, Bell, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OfficerHeaderProps {
  title: string;
  subtitle?: string;
  urgentCount?: number;
}

export function OfficerHeader({
  title,
  subtitle = "Campus-wide health surveillance and telephonic escalation management",
  urgentCount = 3,
}: OfficerHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-6 py-5 shadow-xs">
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0B1736]">
            {title}
          </h1>
          {urgentCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
              {urgentCount} Urgent Red
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-2.5">
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50/70 text-[#2563EB] text-xs font-medium py-1 px-2.5"
        >
          <Activity className="mr-1.5 h-3.5 w-3.5" />
          Surveillance Stream Active
        </Badge>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium py-1 px-2.5"
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
          Audit Ledger Enforced
        </Badge>
      </div>
    </div>
  );
}
