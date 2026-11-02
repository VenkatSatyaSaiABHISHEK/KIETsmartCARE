"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Settings,
  History,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      document.cookie = "kiet_user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "kiet_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/staff", label: "Staff Accounts", icon: Users },
    { href: "/admin/students", label: "Student Roster", icon: GraduationCap },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/activity", label: "Activity Log", icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Security posture */}
        <div className="flex items-center space-x-3">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-black">
                  KIET SMART CARE
                </span>
                <span className="text-xs text-neutral-400">/</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Admin Console
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-neutral-100 px-1.5 py-0.2 text-[10px] font-medium text-neutral-700">
                  Zero Medical Access
                </span>
                <span className="text-[10px] text-neutral-400">• RLS Enforced</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-black"
                  }`}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-black">admin@kiet.edu</span>
            <span className="text-[10px] text-neutral-500">Super Administrator</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="rounded-lg border-[#E5E5E5] text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden overflow-x-auto border-t border-[#E5E5E5] px-4 py-2 space-x-1 bg-neutral-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className="whitespace-nowrap">
              <span
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                  isActive
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Icon className="mr-1 h-3 w-3" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
