"use client";

import React, { useState, useEffect } from "react";
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
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Compact Icon */}
        <div className="flex items-center space-x-3">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="KIET Care Logo"
              className="h-8 w-8 rounded-lg object-contain shadow-sm border border-black/5"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm font-bold tracking-tight text-black">
                  KIET SMART CARE
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400">/</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Admin
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-neutral-100 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-medium text-neutral-700">
                  Zero Medical Access
                </span>
                <span className="hidden sm:inline text-[10px] text-neutral-400">• RLS Enforced</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation tabs */}
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

        {/* User Badge, Logout & Mobile Burger */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-medium text-black">Campus Administrator</span>
            <span className="text-[10px] text-neutral-500">Security Clearance Level 1</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:inline-flex h-8 px-3 items-center text-xs font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5 text-neutral-500" />
            Sign Out
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle admin navigation"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden w-full border-t border-[#E5E5E5] bg-white px-4 py-3 shadow-lg flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-neutral-100">
            <span className="text-xs font-semibold text-neutral-900">Campus Administrator</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 ${isActive ? "text-white/50" : "text-neutral-300"}`} />
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
