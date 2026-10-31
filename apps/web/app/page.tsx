import Link from "next/link";
import { Stethoscope, ShieldCheck, UserCheck, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            KIET Smart Care
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            KIET Group of Institutions, Korangi, India
          </p>
          <p className="text-xs text-slate-500">
            Central Staff Authentication Portal (Doctor, Officer, Admin)
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl">Staff Sign In</CardTitle>
            <CardDescription>
              Sign in with institutional credentials. Your role will automatically route you to your dedicated portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Institutional Email
              </label>
              <input
                type="email"
                placeholder="staff@kiet.edu"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                disabled
              />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
              <Lock className="mr-2 h-4 w-4" /> Sign In via Supabase Auth
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Portal Architecture Links
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
              <Link href="/doctor" className="w-full">
                <Button variant="outline" className="w-full justify-start text-xs border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Stethoscope className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Doctor
                </Button>
              </Link>
              <Link href="/officer" className="w-full">
                <Button variant="outline" className="w-full justify-start text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-indigo-600" /> Officer
                </Button>
              </Link>
              <Link href="/admin" className="w-full">
                <Button variant="outline" className="w-full justify-start text-xs border-slate-800 text-slate-900 hover:bg-slate-100 dark:text-white">
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Admin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Student portal is accessible exclusively through the KIET Smart Care Expo Mobile App.
        </p>
      </div>
    </div>
  );
}
