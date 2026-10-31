import { UserPlus, UserCheck, UploadCloud, Shield, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <div className="space-y-8 font-mono">
      {/* Title & Privacy Policy Banner */}
      <div className="border border-black p-4 bg-neutral-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight text-black">
              Administrator Management Console
            </h1>
            <p className="mt-1 text-xs text-neutral-600">
              Provision doctor/officer credentials, batch onboard students, and configure institution settings.
            </p>
          </div>
          <div className="border border-black bg-white px-3 py-1.5 text-xs">
            <span className="font-bold uppercase">[RLS ENFORCED]</span> Medical tables strictly inaccessible to role &apos;admin&apos;
          </div>
        </div>
      </div>

      {/* Metrics Row (Strictly Non-Medical) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-black p-4 bg-white">
          <div className="text-xs uppercase text-neutral-500 font-bold">Total Enrolled Students</div>
          <div className="text-2xl font-bold mt-1 text-black">6,840</div>
          <div className="text-[11px] text-neutral-600 mt-1">KIET Group of Institutions</div>
        </div>
        <div className="border border-black p-4 bg-white">
          <div className="text-xs uppercase text-neutral-500 font-bold">Active Doctor Accounts</div>
          <div className="text-2xl font-bold mt-1 text-black">6</div>
          <div className="text-[11px] text-neutral-600 mt-1">Campus Clinic OPD doctors</div>
        </div>
        <div className="border border-black p-4 bg-white">
          <div className="text-xs uppercase text-neutral-500 font-bold">Campus Health Officers</div>
          <div className="text-2xl font-bold mt-1 text-black">3</div>
          <div className="text-[11px] text-neutral-600 mt-1">Surveillance & outreach officers</div>
        </div>
      </div>

      {/* Action Columns: Staff Provisioning & Student Roster */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-black p-5 bg-white space-y-4">
          <div className="border-b border-black pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Create Staff Account
            </h2>
            <UserPlus className="h-4 w-4" />
          </div>
          <p className="text-xs text-neutral-600">
            Create an authenticated account for a Campus Doctor or Health Officer. Login role will automatically route to their dedicated portal.
          </p>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Role Type</label>
              <select className="w-full border border-black p-2 text-xs bg-white rounded-none focus:outline-none">
                <option value="doctor">Doctor (OPD Consultations & Prescriptions)</option>
                <option value="officer">Health Officer (Surveillance & Outreach)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Dr. Rajesh Kumar"
                className="w-full border border-black p-2 text-xs rounded-none focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase block mb-1">KIET Institutional Email</label>
              <input
                type="email"
                placeholder="rajesh.kumar@kiet.edu"
                className="w-full border border-black p-2 text-xs rounded-none focus:outline-none"
              />
            </div>
            <Button className="w-full rounded-none bg-black text-white hover:bg-neutral-800 text-xs uppercase font-mono">
              <UserPlus className="mr-2 h-3.5 w-3.5" /> Provision Staff Account
            </Button>
          </div>
        </div>

        <div className="border border-black p-5 bg-white space-y-4">
          <div className="border-b border-black pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Student Batch Ingestion
            </h2>
            <UploadCloud className="h-4 w-4" />
          </div>
          <p className="text-xs text-neutral-600">
            Import CSV of enrolled students with roll number, department, year, hostel status, and emergency contact details.
          </p>
          <div className="border-2 border-dashed border-black p-6 text-center bg-neutral-50">
            <UploadCloud className="mx-auto h-8 w-8 text-neutral-700 mb-2" />
            <p className="text-xs font-bold uppercase">Drag and drop student roster (.csv)</p>
            <p className="text-[10px] text-neutral-500 mt-1">Columns: roll_number, email, full_name, department, year, hostel_status, emergency_phone</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-none border-black text-xs uppercase font-mono hover:bg-black hover:text-white">
              Select CSV File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
