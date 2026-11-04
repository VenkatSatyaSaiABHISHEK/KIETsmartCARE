"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  Users,
  GraduationCap,
  Calendar,
  ScrollText,
  Settings,
  Info,
  Menu,
  X,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    { href: "/admin/access", label: "Manage Access", icon: KeyRound },
    { href: "/admin/staff", label: "Staff Accounts", icon: Users },
    { href: "/admin/reports", label: "Reports", icon: Calendar },
    { href: "/admin/students", label: "Student Roster", icon: GraduationCap },
    { href: "/admin/activity", label: "Activity Log", icon: ScrollText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header (hidden on md+) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--bg-subtle)] border-b border-[var(--border)] flex items-center justify-between px-4">
        <div>
          <span className="text-[14px] font-semibold text-[var(--text)]">KIET Smart Care</span>
          <span className="text-[12px] text-[var(--text-muted)] ml-2 font-mono">Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text)]"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: Fixed on desktop, sliding drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[var(--bg-subtle)] border-r border-[var(--border)] flex flex-col justify-between p-4 select-none transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col">
          {/* Top: Wordmark & Role */}
          <div className="mb-6 px-2 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[var(--text)] leading-tight">
                KIET Smart Care
              </div>
              <div className="text-[12px] text-[var(--text-muted)] leading-tight mt-0.5">
                Admin
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex h-[34px] items-center gap-2 px-2.5 rounded-[6px] text-[14px] transition-colors ${
                    isActive
                      ? "bg-[var(--bg-hover)] text-[var(--text)] font-medium"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area */}
        <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-2">
          <div className="relative flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text)]">
                Administrator
              </span>
              <div
                className="relative inline-flex items-center cursor-help"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Info className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                {showTooltip && (
                  <div className="absolute bottom-full left-0 mb-1 w-48 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] p-2 text-[11px] leading-tight text-[var(--text)] shadow-none z-50 pointer-events-none">
                    Full system access; clinical records restricted by RLS
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="h-[32px] w-full text-left px-2 rounded-[6px] text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
