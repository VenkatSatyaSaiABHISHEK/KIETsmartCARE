"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";

export interface NavTabItem {
  id: string;
  label: string;
  href?: string;
  count?: number;
  isAlert?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

interface TopBarProps {
  area?: string; // Kept for backwards compatibility, not shown in breadcrumb
  tabs: NavTabItem[];
  userName?: string;
  userRole?: string;
  userQualification?: string;
  userDesignation?: string;
  showOfficerWidgets?: boolean;
  onSignOut?: () => void;
}

export function TopBar({
  tabs,
  userName = "Staff Member",
  userRole = "OPD Staff",
  userQualification,
  userDesignation,
  onSignOut,
}: TopBarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDefaultSignOut = async () => {
    try {
      // Clear client storage
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
      // Clear cookies
      document.cookie = "kiet_user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "kiet_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const signOutAction = onSignOut || handleDefaultSignOut;

  return (
    <header className="sticky top-0 z-40 h-[64px] w-full border-b border-[#e5e5e5] bg-white select-none">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        {/* Left: Text Wordmark ONLY (No Breadcrumbs) */}
        <div className="flex items-center gap-8 shrink-0">
          <Link href="/" className="flex items-center">
            <span className="text-[15px] font-semibold tracking-tight text-[#171717]">
              KIET Smart Care
            </span>
          </Link>

          {/* Center Tabs: Desktop (Clean Text, No Scrollbars, No Dots, No Arrows) */}
          <nav className="hidden md:flex h-[64px] items-center gap-1">
            {tabs.map((tab) => {
              const count = tab.count ?? 0;
              const hasCount = count > 0;
              const isAlert = tab.isAlert && hasCount;

              const labelWithCount = (
                <span className="inline-flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  {hasCount && (
                    <span
                      className={`text-[12px] font-medium tabular-nums ${
                        isAlert ? "text-[#dc2626] font-semibold" : "text-[#737373]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </span>
              );

              const tabClass = `relative flex h-[64px] items-center px-3.5 text-[14px] transition-colors ${
                tab.isActive
                  ? "text-[#171717] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#171717]"
                  : "text-[#737373] hover:text-[#171717]"
              }`;

              if (tab.href) {
                return (
                  <Link key={tab.id} href={tab.href} className={tabClass}>
                    {labelWithCount}
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={tab.onClick}
                  className={`${tabClass} bg-transparent border-0 cursor-pointer p-0`}
                >
                  {labelWithCount}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: User Profile & Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2 text-[#737373] hover:text-[#171717] rounded-[6px] hover:bg-[#f5f5f5]"
            aria-label="Toggle navigation"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* User Details with Dropdown Menu (No loose "Sign out" text) */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-[6px] hover:bg-[#f5f5f5] transition-colors text-left cursor-pointer focus:outline-none"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex flex-col text-right">
                <span className="text-[13px] font-medium leading-tight text-[#171717]">
                  {userName}
                </span>
                <span className="text-[11px] leading-tight text-[#737373] mt-0.5">
                  {userQualification ? `${userQualification} · ` : ""}
                  {userDesignation || userRole}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-[#737373] shrink-0" />
            </button>

            {/* Profile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-[8px] border border-[#e5e5e5] bg-white py-1 shadow-none z-50 animate-in fade-in-50 duration-100">
                <div className="px-3 py-2 border-b border-[#e5e5e5]">
                  <p className="text-[13px] font-medium text-[#171717] truncate">{userName}</p>
                  <p className="text-[11px] text-[#737373] truncate mt-0.5">
                    {userQualification ? `${userQualification} · ` : ""}
                    {userDesignation || userRole}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={signOutAction}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#dc2626] hover:bg-[#f5f5f5] transition-colors text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Collapses cleanly, never a horizontal scrollbar) */}
      {isMobileNavOpen && (
        <div className="md:hidden border-b border-[#e5e5e5] bg-white px-4 py-2 space-y-1">
          {tabs.map((tab) => {
            const count = tab.count ?? 0;
            const hasCount = count > 0;
            const isAlert = tab.isAlert && hasCount;

            const handleClick = () => {
              setIsMobileNavOpen(false);
              tab.onClick?.();
            };

            const content = (
              <div className="flex items-center justify-between py-2 text-[14px]">
                <span className={tab.isActive ? "font-medium text-[#171717]" : "text-[#737373]"}>
                  {tab.label}
                </span>
                {hasCount && (
                  <span
                    className={`text-[12px] font-medium tabular-nums ${
                      isAlert ? "text-[#dc2626] font-semibold" : "text-[#737373]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
            );

            if (tab.href) {
              return (
                <Link key={tab.id} href={tab.href} onClick={() => setIsMobileNavOpen(false)} className="block">
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={handleClick}
                className="w-full text-left bg-transparent border-0 cursor-pointer p-0"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
