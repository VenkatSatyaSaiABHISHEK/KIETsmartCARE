"use client";

import React from "react";
import Link from "next/link";
import {
  Stethoscope,
  Bell,
  Users,
  LogOut,
  ShieldAlert,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DoctorHeaderProps {
  doctorName?: string;
  doctorRole?: string;
  activeTab: "desk" | "today" | "alerts";
  setActiveTab: (tab: "desk" | "today" | "alerts") => void;
  todayCount: number;
  alertCount: number;
}

export function DoctorHeader({
  doctorName = "Dr. Alok Verma, MBBS, MD",
  doctorRole = "Campus Clinic OPD Doctor",
  activeTab,
  setActiveTab,
  todayCount,
  alertCount,
}: DoctorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-doctor-border bg-white shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Doctor Credentials */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-doctor-blue text-white shadow-md shadow-blue-500/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-doctor-navy">
                KIET Smart Care
              </span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-doctor-blue border border-blue-100">
                OPD Active
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span className="font-semibold text-doctor-navy">{doctorName}</span>
              <span>&bull;</span>
              <span className="text-slate-400">{doctorRole}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab("desk")}
            className={`flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "desk"
                ? "bg-doctor-panel text-doctor-blue border border-blue-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Consultation Desk</span>
            <span className="sm:hidden">Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "today"
                ? "bg-doctor-panel text-doctor-blue border border-blue-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Today&apos;s Treated</span>
            <span className="sm:hidden">Today</span>
            <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-mono font-bold text-slate-700">
              {todayCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={`relative flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === "alerts"
                ? "bg-red-50 text-red-700 border border-red-200 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bell className="mr-1.5 h-4 w-4 text-red-600" />
            <span className="hidden sm:inline">My Alerts</span>
            <span className="sm:hidden">Alerts</span>
            {alertCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.2 text-[10px] font-mono font-bold text-white animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Exit
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
