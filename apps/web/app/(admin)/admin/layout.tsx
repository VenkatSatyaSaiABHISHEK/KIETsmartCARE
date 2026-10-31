import React from "react";
import Link from "next/link";
import { UserCheck, Users, ShieldAlert, Settings, LogOut, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black font-mono">
      <header className="sticky top-0 z-40 border-b border-black bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-none bg-black text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold uppercase tracking-wider text-black">
                KIET Smart Care // Admin CRM
              </span>
              <span className="ml-2 border border-black px-1.5 py-0.5 text-[10px] font-bold uppercase">
                Zero Medical Access
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="rounded-none text-black hover:bg-neutral-100 font-mono text-xs">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Staff Accounts
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none text-black hover:bg-neutral-100 font-mono text-xs">
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Student Roster
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none text-black hover:bg-neutral-100 font-mono text-xs">
              <Settings className="mr-1.5 h-3.5 w-3.5" /> System Settings
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-none border-black text-black hover:bg-black hover:text-white font-mono text-xs">
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Exit
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
