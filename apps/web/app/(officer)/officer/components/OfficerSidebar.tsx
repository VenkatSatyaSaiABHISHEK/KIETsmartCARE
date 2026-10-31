"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  FileSpreadsheet,
  LogOut,
  HeartPulse,
  Radio,
  Menu,
  X,
  PhoneCall,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OfficerSidebarProps {
  redAlertCount?: number;
}

export function OfficerSidebar({ redAlertCount = 3 }: OfficerSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigation = [
    {
      name: "Surveillance Dashboard",
      href: "/officer",
      icon: LayoutDashboard,
      active: pathname === "/officer",
    },
    {
      name: "Alerts Queue",
      href: "/officer/alerts",
      icon: ShieldAlert,
      badge: redAlertCount > 0 ? redAlertCount : undefined,
      active: pathname.startsWith("/officer/alerts"),
    },
    {
      name: "Students Overview",
      href: "/officer/students",
      icon: Users,
      active: pathname.startsWith("/officer/students"),
    },
    {
      name: "Reports & Exports",
      href: "/officer/reports",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/officer/reports"),
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1736] text-white p-5 select-none">
      {/* Top Brand & Officer Credential */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-lg shadow-blue-600/30">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                KIET Smart Care
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Health Surveillance CRM
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Officer Badge Profile */}
        <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A24B]">
              Campus Executive
            </span>
            <span className="flex items-center text-[10px] text-slate-400 font-mono">
              <Radio className="mr-1 h-2.5 w-2.5 text-emerald-400 animate-spin" />
              Live
            </span>
          </div>
          <div className="text-xs font-bold text-white">Officer S. Mukherjee</div>
          <div className="text-[11px] text-slate-400">
            Health Officer &bull; Overviewer
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 pt-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  item.active
                    ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-mono font-bold text-white shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="space-y-4 border-t border-white/10 pt-4">
        <div className="rounded-lg bg-black/20 p-2.5 text-[10px] text-slate-400 leading-relaxed border border-white/5">
          <span className="font-bold text-slate-300">Read-Only Medical Scope: </span>
          Full doctor notes remain sealed. Every case inspection is written to audit ledger.
        </div>

        <Link href="/">
          <button
            type="button"
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Exit Officer Portal</span>
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-[#0B1736] px-4 md:hidden text-white">
        <div className="flex items-center space-x-2">
          <HeartPulse className="h-5 w-5 text-[#2563EB]" />
          <span className="text-sm font-bold text-white">KIET Officer CRM</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-[#0B1736] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
