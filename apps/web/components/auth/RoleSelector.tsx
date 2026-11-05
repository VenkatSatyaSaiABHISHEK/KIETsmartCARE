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
    <div className="w-full flex flex-col gap-3">
      {ROLES.map((role) => {
        const Icon = role.icon;
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className="group relative flex h-[72px] w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-5 transition-all duration-200 ease-out shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] hover:border-black/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black text-left cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-black group-hover:bg-black group-hover:text-white transition-all duration-200 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold leading-tight text-black group-hover:text-black transition-colors tracking-tight">
                  {role.title}
                </span>
                <span className="mt-1 text-[13px] leading-tight text-black/50 group-hover:text-black/70 transition-colors truncate">
                  {role.description}
                </span>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-black/30 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-black" />
          </button>
        );
      })}
    </div>
  );
}
