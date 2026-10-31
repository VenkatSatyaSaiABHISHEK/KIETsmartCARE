import { Stethoscope, Search, PlusCircle, AlertCircle, Clock, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorDashboard() {
  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
            Campus Clinic OPD
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Record student consultations, configure structured dosage timing, and monitor patient alerts.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none px-3 py-1">
            Campus OPD Active
          </Badge>
        </div>
      </div>

      {/* Student Search & Quick Visit Initiation */}
      <Card className="border-blue-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-blue-950">Student Lookup by Roll Number</CardTitle>
          <CardDescription>
            Enter the student roll number to view history and start a new medical consultation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 2100290100045"
                className="w-full rounded-md border border-blue-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Search className="mr-2 h-4 w-4" /> Fetch Student
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-800 hover:bg-blue-50">
              <PlusCircle className="mr-2 h-4 w-4" /> New Visit Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Active Patient Alerts & Today's Consultations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-red-100 bg-white shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-red-50 bg-red-50/40 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-red-900">
                Red Patient Alerts
              </CardTitle>
              <Badge variant="destructive" className="bg-red-600">
                Active
              </Badge>
            </div>
            <CardDescription className="text-xs text-red-700">
              Students reporting Worse, Same, or side effects after course completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-950">Roll: 2200290120019</p>
                  <p className="text-xs text-red-800">Outcome: Worse / Fever persisting</p>
                </div>
                <Badge variant="outline" className="border-red-300 text-red-700 text-[10px]">
                  High Priority
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-600">Prescription: Paracetamol + Azithromycin</p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-950">Roll: 2100290100112</p>
                  <p className="text-xs text-amber-800">Outcome: Reported mild nausea / side effect</p>
                </div>
                <Badge variant="outline" className="border-amber-300 text-amber-800 text-[10px]">
                  Side Effect
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-600">Contact doctor advisory active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-blue-50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-blue-950">
                Recent OPD Consultations
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                View All History
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Prescriptions automatically generate meal-anchored dose reminders for student mobile apps.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-blue-50/30">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Roll: 2300290130088 (CS)</p>
                    <p className="text-xs text-slate-500">Category: Seasonal Allergy &bull; 3 medicines</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Today, 09:30 AM</span>
                  <p className="text-xs font-medium text-green-700">Schedule Synced</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-blue-50/30">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Roll: 2100290100054 (ECE)</p>
                    <p className="text-xs text-slate-500">Category: Acute Gastritis &bull; 2 medicines</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Yesterday, 04:15 PM</span>
                  <p className="text-xs font-medium text-blue-700">In Progress (Day 2/3)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
