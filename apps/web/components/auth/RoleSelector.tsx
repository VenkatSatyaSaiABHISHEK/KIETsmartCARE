"use client";

import React from "react";
import { Stethoscope, ShieldCheck, KeyRound, ChevronRight } from "lucide-react";
import { UserRole } from "@/lib/auth/pin-service";

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLES: RoleOption[] = [
  {
    id: "doctor",
    title: "Doctor",
    description: "Consultations and prescriptions",
    icon: Stethoscope,
  },
  {
    id: "officer",
    title: "Officer",
    description: "Health surveillance and alerts",
    icon: ShieldCheck,
  },
  {
    id: "admin",
    title: "Admin",
    description: "Access and roster management",
    icon: KeyRound,
  },
];

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {ROLES.map((role) => {
        const Icon = role.icon;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className="group flex h-[56px] w-full items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="h-[18px] w-[18px] text-[var(--text-muted)] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-medium leading-tight text-[var(--text)]">
                  {role.title}
                </span>
                <span className="text-[13px] leading-tight text-[var(--text-muted)] truncate">
                  {role.description}
                </span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        );
      })}
    </div>
  );
}
