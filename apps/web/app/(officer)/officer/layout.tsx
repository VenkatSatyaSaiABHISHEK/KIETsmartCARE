import React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, PhoneCall, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-indigo-100 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                KIET Smart Care
              </span>
              <span className="ml-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                Campus Health Officer Executive
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100">
              <Activity className="mr-2 h-4 w-4 text-indigo-600" /> Executive Overview
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100">
              <PhoneCall className="mr-2 h-4 w-4 text-indigo-600" /> Outreach Logs
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-slate-100">
              <FileText className="mr-2 h-4 w-4 text-indigo-600" /> Audit Ledger
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
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
