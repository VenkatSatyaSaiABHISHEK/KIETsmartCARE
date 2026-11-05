"use client";

import React from "react";
import { Stethoscope, ShieldCheck, KeyRound, ChevronRight } from "lucide-react";
import { UserRole } from "@/lib/auth/pin-service";

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const ROLES: RoleOption[] = [
  {
    id: "doctor",
    title: "Doctor",
    description: "Consultations and prescriptions",
    icon: Stethoscope,
    iconBg: "bg-sky-50 group-hover:bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    id: "officer",
    title: "Officer",
    description: "Health surveillance and alerts",
    icon: ShieldCheck,
    iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    id: "admin",
    title: "Admin",
    description: "Access and roster management",
    icon: KeyRound,
    iconBg: "bg-slate-100 group-hover:bg-slate-200",
    iconColor: "text-slate-700",
  },
];

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {ROLES.map((role) => {
        const Icon = role.icon;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className="group relative flex h-[68px] w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg)] px-5 transition-all duration-200 ease-out shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_6px_-1px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_-4px_rgba(2,132,199,0.14),0_4px_10px_-2px_rgba(0,0,0,0.04)] hover:border-sky-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${role.iconBg} ${role.iconColor} transition-colors`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold leading-tight text-[var(--text)] group-hover:text-sky-950 transition-colors">
                  {role.title}
                </span>
                <span className="mt-0.5 text-[13px] leading-tight text-[var(--text-muted)] truncate">
                  {role.description}
                </span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-sky-600" />
          </button>
        );
      })}
    </div>
  );
}
