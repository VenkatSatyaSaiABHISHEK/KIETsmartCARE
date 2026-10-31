"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  History,
  UserPlus,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateStaffModal } from "./components/CreateStaffModal";
import { CreateStudentModal } from "./components/CreateStudentModal";
import { BulkImportModal } from "./components/BulkImportModal";
import { OneTimePasswordModal } from "./components/OneTimePasswordModal";
import { AdminOverviewMetrics, AdminAuditLogEntry, StaffMember, AdminStudent } from "@/lib/admin/types";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics>({
    total_doctors: 3,
    total_officers: 2,
    total_students: 7,
    recent_actions_count: 4,
  });
  const [recentLogs, setRecentLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [otpModalData, setOtpModalData] = useState<{
    isOpen: boolean;
    title: string;
    recipientName: string;
    identifier: string;
    identifierLabel: string;
    temporaryPassword: string;
    roleOrNote?: string;
  }>({
    isOpen: false,
    title: "",
    recipientName: "",
    identifier: "",
    identifierLabel: "",
    temporaryPassword: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch staff, students, and activity logs
      const [staffRes, studentsRes, logsRes] = await Promise.all([
        fetch("/api/admin/staff"),
        fetch("/api/admin/students"),
        fetch("/api/admin/activity"),
      ]);

      const staffData = await staffRes.json();
      const studentsData = await studentsRes.json();
      const logsData = await logsRes.json();

      const staffList: StaffMember[] = staffData.staff || [];
      const totalDoctors = staffList.filter((s) => s.role === "doctor" && s.status === "active").length;
      const totalOfficers = staffList.filter((s) => s.role === "officer" && s.status === "active").length;
      const totalStudents = studentsData.students?.length || 0;
      const logsList: AdminAuditLogEntry[] = logsData.audit_logs || [];

      setMetrics({
        total_doctors: totalDoctors,
        total_officers: totalOfficers,
        total_students: totalStudents,
        recent_actions_count: logsList.length,
      });

      setRecentLogs(logsList.slice(0, 5));
    } catch {
      // Fallback in case of mock offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStaffSuccess = (staff: StaffMember, temporaryPassword: string) => {
    setOtpModalData({
      isOpen: true,
      title: "Staff Account Provisioned",
      recipientName: staff.name,
      identifier: staff.email,
      identifierLabel: "Institutional Email",
      temporaryPassword,
      roleOrNote: staff.role === "doctor" ? "Campus Doctor" : "Campus Health Officer",
    });
    loadData();
  };

  const handleStudentSuccess = (student: AdminStudent, temporaryPassword: string) => {
    setOtpModalData({
      isOpen: true,
      title: "Student Enrolled Successfully",
      recipientName: student.name,
      identifier: student.roll_number,
      identifierLabel: "Roll Number",
      temporaryPassword,
      roleOrNote: `${student.branch} • Year ${student.year}`,
    });
    loadData();
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Status Banner */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold uppercase tracking-tight text-black">
                KIET Smart Care Administration
              </h1>
              <span className="rounded-lg border border-black bg-black px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Live Console
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-600">
              Provision doctor and health officer accounts, manage student enrolment rosters, and configure campus healthcare parameters.
            </p>
          </div>

          <div className="rounded-lg border border-[#E5E5E5] bg-neutral-50 px-3.5 py-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-black uppercase tracking-wider text-[10px]">
              <Lock className="h-3.5 w-3.5" />
              <span>RLS Zero-Medical-Access</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Medical records (visits, prescriptions, alerts) are strictly inaccessible to role &apos;admin&apos;.
            </div>
          </div>
        </div>
      </div>

      {/* Big Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Enrolled Students
            </span>
            <GraduationCap className="h-4 w-4 text-black" />
          </div>
          <div className="mt-2 text-3xl font-bold text-black tracking-tight">
            {metrics.total_students.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>Across Engineering & Polytechnic</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Campus Doctors
            </span>
            <Users className="h-4 w-4 text-black" />
          </div>
          <div className="mt-2 text-3xl font-bold text-black tracking-tight">
            {metrics.total_doctors}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>OPD consultation clinicians</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Health Officers
            </span>
            <ShieldCheck className="h-4 w-4 text-black" />
          </div>
          <div className="mt-2 text-3xl font-bold text-black tracking-tight">
            {metrics.total_officers}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>Overview & tele-outreach</span>
          </div>
        </div>

        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Audit Events
            </span>
            <History className="h-4 w-4 text-black" />
          </div>
          <div className="mt-2 text-3xl font-bold text-black tracking-tight">
            {metrics.recent_actions_count}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>Immutable security trail</span>
          </div>
        </div>
      </div>

      {/* Quick Action Launchpad */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">
          Management Launchpad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="flex items-start space-x-3 rounded-lg border border-[#E5E5E5] bg-white p-4 text-left shadow-sm hover:border-black transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-black">Provision Staff</div>
              <p className="mt-0.5 text-[11px] text-neutral-500 leading-snug">
                Issue temporary credentials for a doctor or health officer.
              </p>
            </div>
          </button>

          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-start space-x-3 rounded-lg border border-[#E5E5E5] bg-white p-4 text-left shadow-sm hover:border-black transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-black">Enroll Single Student</div>
              <p className="mt-0.5 text-[11px] text-neutral-500 leading-snug">
                Register a student with roll number, allergies, and emergency phone.
              </p>
            </div>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-start space-x-3 rounded-lg border border-[#E5E5E5] bg-white p-4 text-left shadow-sm hover:border-black transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-black">Batch CSV Ingest</div>
              <p className="mt-0.5 text-[11px] text-neutral-500 leading-snug">
                Column-mapping wizard with credentials sheet export.
              </p>
            </div>
          </button>

          <Link
            href="/admin/settings"
            className="flex items-start space-x-3 rounded-lg border border-[#E5E5E5] bg-white p-4 text-left shadow-sm hover:border-black transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-black">Campus Settings</div>
              <p className="mt-0.5 text-[11px] text-neutral-500 leading-snug">
                Edit default meal times, emergency hotlines & medicine catalog.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Activity Stream & Security Invariant Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Stream */}
        <div className="lg:col-span-2 rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-black">
                Recent Administrative Activity
              </h2>
              <p className="text-xs text-neutral-500">
                Immutable audit entries recorded via PostgreSQL audit_logs
              </p>
            </div>
            <Link href="/admin/activity">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-[#E5E5E5] text-xs font-medium"
              >
                View All Logs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-[#E5E5E5]">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between text-xs">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-black rounded bg-neutral-100 px-1.5 py-0.5 text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="font-medium text-black">{log.actor_email}</span>
                  </div>
                  <p className="text-neutral-600 text-[11px]">{log.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[10px] text-neutral-400">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500">{log.ip_address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strict Boundary / RLS Policy Status Box */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-black">
              Security & Privacy Policy
            </h2>
            <p className="text-xs text-neutral-500">Institutional healthcare boundary</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-black">Role Segregation</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Admins manage accounts only. Clinical diagnoses, medical notes, and prescriptions are isolated by RLS.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-black">Zero Plaintext Passwords</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Passwords are created via server routes and displayed once. Hashes are securely handled by Supabase Auth.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-black shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-black">Private Buckets</span>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Student photographs are stored in private Supabase Storage buckets, requiring signed short-lived URLs.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-black bg-neutral-50 p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-black">
              KIET Group of Institutions
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              Campus Clinic OPD • Korangi, Andhra Pradesh
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={handleStaffSuccess}
      />

      <CreateStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSuccess={handleStudentSuccess}
      />

      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadData}
      />

      <OneTimePasswordModal
        isOpen={otpModalData.isOpen}
        onClose={() => setOtpModalData({ ...otpModalData, isOpen: false })}
        title={otpModalData.title}
        recipientName={otpModalData.recipientName}
        identifier={otpModalData.identifier}
        identifierLabel={otpModalData.identifierLabel}
        temporaryPassword={otpModalData.temporaryPassword}
        roleOrNote={otpModalData.roleOrNote}
      />
    </div>
  );
}
