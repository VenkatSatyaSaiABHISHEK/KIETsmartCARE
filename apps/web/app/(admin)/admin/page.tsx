"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CreateStaffModal } from "./components/CreateStaffModal";
import { CreateStudentModal } from "./components/CreateStudentModal";
import { BulkImportModal } from "./components/BulkImportModal";
import { OneTimePasswordModal } from "./components/OneTimePasswordModal";
import { DateTimeWidget } from "@/components/ui/DateTimeWidget";
import { StatusDot } from "@/components/ui/StatusDot";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import {
  AdminOverviewMetrics,
  AdminAuditLogEntry,
  StaffMember,
  AdminStudent,
} from "@/lib/admin/types";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminOverviewMetrics>({
    total_doctors: 0,
    total_officers: 0,
    total_students: 0,
    recent_actions_count: 0,
  });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
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
      const [staffRes, studentsRes, logsRes] = await Promise.all([
        fetch("/api/admin/staff"),
        fetch("/api/admin/students"),
        fetch("/api/admin/activity"),
      ]);

      const staffData = await staffRes.json().catch(() => ({ staff: [] }));
      const studentsData = await studentsRes.json().catch(() => ({ students: [] }));
      const logsData = await logsRes.json().catch(() => ({ logs: [] }));

      const activeStaff: StaffMember[] = (staffData.staff || []).filter(
        (s: any) => s.status === "active"
      );
      const totalDoctors = activeStaff.filter((s) => s.role === "doctor").length;
      const totalOfficers = activeStaff.filter((s) => s.role === "officer").length;
      const studentList: AdminStudent[] = (studentsData.students || []).filter(
        (s: any) => s.status === "active"
      );

      setMetrics({
        total_doctors: totalDoctors,
        total_officers: totalOfficers,
        total_students: studentList.length,
        recent_actions_count: (logsData.logs || []).length,
      });

      setStaffList(activeStaff);
      setRecentLogs((logsData.logs || []).slice(0, 10));
    } catch (e) {
      console.warn("Failed to load admin overview data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStaffCreated = (data: {
    staff: StaffMember;
    temporaryPassword?: string;
  }) => {
    setIsStaffModalOpen(false);
    loadData();
    if (data.temporaryPassword) {
      setOtpModalData({
        isOpen: true,
        title: "Staff Account Created",
        recipientName: data.staff.name,
        identifier: data.staff.email,
        identifierLabel: "Email / Username",
        temporaryPassword: data.temporaryPassword,
        roleOrNote: `${data.staff.role.toUpperCase()} • 5-Digit PIN Assigned`,
      });
    }
  };

  const handleStudentCreated = (data: {
    student: AdminStudent;
    temporaryPassword?: string;
  }) => {
    setIsStudentModalOpen(false);
    loadData();
    if (data.temporaryPassword) {
      setOtpModalData({
        isOpen: true,
        title: "Student Roster Profile Created",
        recipientName: data.student.name,
        identifier: data.student.roll_number,
        identifierLabel: "Roll Number",
        temporaryPassword: data.temporaryPassword,
        roleOrNote: `${data.student.branch} • Year ${data.student.year}`,
      });
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text)] leading-tight">
            Overview
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-muted)] leading-normal">
            Institutional access management, roster provisioning, clinical throughput metrics, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 flex-wrap">
          <DateTimeWidget variant="compact" />

          <Link
            href="/admin/access"
            className="h-[32px] px-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            Manage PIN Access
          </Link>

          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="h-[32px] px-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            Add Staff Member
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="h-[32px] px-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg)] text-[13px] font-medium text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors inline-flex items-center justify-center cursor-pointer"
          >
            Bulk Import (Excel / PDF)
          </button>

          <button
            type="button"
            onClick={() => setIsStudentModalOpen(true)}
            className="h-[32px] px-3 rounded-[6px] bg-[var(--text)] text-[var(--bg)] text-[13px] font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center cursor-pointer"
          >
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Strip: 3 metrics in one horizontal panel */}
      <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
        <div className="p-5 flex flex-col justify-center">
          {loading ? (
            <SkeletonLoader className="w-12 h-7 rounded" />
          ) : (
            <div className="text-[24px] font-semibold text-[var(--text)] tabular-nums leading-none">
              {metrics.total_doctors}
            </div>
          )}
          <div className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-tight">
            Doctors provisioned
          </div>
        </div>

        <div className="p-5 flex flex-col justify-center">
          {loading ? (
            <SkeletonLoader className="w-12 h-7 rounded" />
          ) : (
            <div className="text-[24px] font-semibold text-[var(--text)] tabular-nums leading-none">
              {metrics.total_officers}
            </div>
          )}
          <div className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-tight">
            Health officers active
          </div>
        </div>

        <div className="p-5 flex flex-col justify-center">
          {loading ? (
            <SkeletonLoader className="w-12 h-7 rounded" />
          ) : (
            <div className="text-[24px] font-semibold text-[var(--text)] tabular-nums leading-none">
              {metrics.total_students}
            </div>
          )}
          <div className="text-[12px] text-[var(--text-muted)] mt-1.5 leading-tight">
            Students enrolled
          </div>
        </div>
      </div>

      {/* Clinical OPD Staff Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[var(--text)]">
            Clinical staff roster
          </h2>
          <Link
            href="/admin/staff"
            className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Manage staff accounts &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="h-[96px] border border-[var(--border)] rounded-[8px] p-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-[13px] text-[var(--text-muted)]">
              <span className="inline-block w-4 h-4 border-2 border-[var(--border)] border-t-[var(--text)] rounded-full animate-spin" />
              <span>Loading staff directory...</span>
            </div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="h-[80px] flex flex-col items-center justify-center text-[13px] text-[var(--text-muted)] border border-[var(--border)] rounded-[8px] bg-[var(--bg)] px-4 text-center">
            <span>No clinical staff provisioned yet.</span>
            <span className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Click &quot;Add Staff Member&quot; above to create Doctor or Health Officer accounts.
            </span>
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[12px] text-[var(--text-muted)]">
                  <th className="py-2.5 px-4 font-normal">Staff Name</th>
                  <th className="py-2.5 px-4 font-normal">Role</th>
                  <th className="py-2.5 px-4 font-normal">Contact Phone</th>
                  <th className="py-2.5 px-4 font-normal">Status</th>
                  <th className="py-2.5 px-4 font-normal text-right">Access PIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="h-[44px] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[var(--text)]">
                      {staff.name}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)] capitalize">
                      {staff.role}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text)] font-mono text-[12px] tabular-nums">
                      {staff.phone || "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusDot
                        status={staff.status || "active"}
                        label={staff.role === "doctor" ? "Active OPD" : "Active triage"}
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href="/admin/access"
                        className="text-[13px] text-[var(--text)] hover:underline font-medium"
                      >
                        Manage PIN &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[var(--text)]">
            Recent administrative activity
          </h2>
          <Link
            href="/admin/activity"
            className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            View all logs &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="h-[64px] border border-[var(--border)] rounded-[8px] p-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-[13px] text-[var(--text-muted)]">
              <span className="inline-block w-4 h-4 border-2 border-[var(--border)] border-t-[var(--text)] rounded-full animate-spin" />
              <span>Loading recent activity...</span>
            </div>
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="h-[64px] flex items-center justify-center text-[13px] text-[var(--text-muted)] border border-[var(--border)] rounded-[8px] bg-[var(--bg)]">
            No administrative events recorded yet.
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[12px] text-[var(--text-muted)]">
                  <th className="py-2.5 px-4 font-normal">Timestamp</th>
                  <th className="py-2.5 px-4 font-normal">Action</th>
                  <th className="py-2.5 px-4 font-normal">Target</th>
                  <th className="py-2.5 px-4 font-normal">Record ID</th>
                  <th className="py-2.5 px-4 font-normal">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="h-[44px] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-2.5 px-4 text-[var(--text-muted)] font-mono text-[12px] tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp || (log as any).created_at || Date.now()).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[var(--text)]">{log.action}</td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[var(--text-muted)]">
                      {log.target_type || (log as any).table_name || "—"}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[var(--text-muted)]">
                      {log.target_id ? log.target_id.slice(0, 8) + "..." : "—"}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-[var(--text-muted)]">
                      {log.actor_email || (log as any).user_id || "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSuccess={(staff, temporaryPassword) => handleStaffCreated({ staff, temporaryPassword })}
      />

      <CreateStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSuccess={(student, temporaryPassword) => handleStudentCreated({ student, temporaryPassword })}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => loadData()}
      />

      <OneTimePasswordModal
        isOpen={otpModalData.isOpen}
        onClose={() => setOtpModalData((prev) => ({ ...prev, isOpen: false }))}
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
