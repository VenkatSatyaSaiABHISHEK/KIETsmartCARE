import React from "react";
import Link from "next/link";
import { Stethoscope, Bell, ClipboardList, LogOut, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-blue-100 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-blue-900">
                KIET Smart Care
              </span>
              <span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Doctor Portal
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-blue-900 hover:bg-blue-50">
              <ClipboardList className="mr-2 h-4 w-4 text-blue-600" /> Consultations
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-900 hover:bg-blue-50 relative">
              <Bell className="mr-2 h-4 w-4 text-blue-600" />
              Patient Alerts
              <span className="ml-1.5 flex h-2 w-2 rounded-full bg-red-600" />
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-blue-200 text-blue-800 hover:bg-blue-50">
                <LogOut className="mr-2 h-4 w-4" /> Exit
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
