import { PhoneCall, ShieldAlert, Users, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OfficerDashboard() {
  return (
    <div className="space-y-8">
      {/* Executive Welcome & Campus Health Posture */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Campus Health Surveillance Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time aggregate health metrics, flagged recovery escalations, and telephonic outreach management.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Surveillance System Live
          </Badge>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Auditing Enforced
          </Badge>
        </div>
      </div>

      {/* Aggregate Counts By Default (Privacy By Design) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Prescriptions</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">42</div>
            <p className="mt-1 text-xs text-slate-500">Students undergoing treatment</p>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Flagged Red Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">3</div>
            <p className="mt-1 text-xs text-red-600/80">Require immediate telephonic contact</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">No-Response Checks (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">5</div>
            <p className="mt-1 text-xs text-amber-700/80">Pending student self-report</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Recovery Rate (7-Day)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">92.4%</div>
            <p className="mt-1 text-xs text-slate-500">Self-reported recovery outcome</p>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Cases Queue */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Flagged Cases Requiring Outreach
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Privacy Notice: Only problem category is displayed. Full clinical notes remain sealed. Every view event is written to audit_logs.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-indigo-300 text-indigo-700 w-fit">
              Read-Only Clinical Scope
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="divide-y divide-slate-100">
            <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider">
                    Red Alert
                  </Badge>
                  <span className="font-semibold text-slate-900">Roll: 2200290120019</span>
                  <span className="text-xs text-slate-500">&bull; Tagore Hostel Room 302</span>
                </div>
                <p className="text-sm text-slate-700">
                  Category: <span className="font-medium text-slate-900">Acute Viral Illness</span> &bull; Reason: Reported outcome &quot;Worse&quot; after 3-day course
                </p>
                <p className="text-xs text-slate-400">Prescribing Doctor: Dr. Sharma &bull; Reported 2 hours ago</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <PhoneCall className="mr-2 h-3.5 w-3.5" /> Call Student
                </Button>
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-700">
                  Log Outcome <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider bg-rose-600">
                    Side Effect
                  </Badge>
                  <span className="font-semibold text-slate-900">Roll: 2100290100112</span>
                  <span className="text-xs text-slate-500">&bull; Day Scholar (Ghaziabad)</span>
                </div>
                <p className="text-sm text-slate-700">
                  Category: <span className="font-medium text-slate-900">Bacterial Infection</span> &bull; Reason: Student flagged unexpected rash & nausea
                </p>
                <p className="text-xs text-slate-400">Prescribing Doctor: Dr. Verma &bull; Reported 45 mins ago</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <PhoneCall className="mr-2 h-3.5 w-3.5" /> Call Student
                </Button>
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-700">
                  Log Outcome <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
