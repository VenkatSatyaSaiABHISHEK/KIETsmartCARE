"use client";

import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  UserPlus,
  FileSpreadsheet,
  Search,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Phone,
  ShieldAlert,
  ChevronRight,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminStudent } from "@/lib/admin/types";
import { CreateStudentModal } from "../components/CreateStudentModal";
import { BulkImportModal } from "../components/BulkImportModal";
import { OneTimePasswordModal } from "../components/OneTimePasswordModal";
import { ConfirmActionModal } from "../components/ConfirmActionModal";

export default function StudentManagementPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Selected student for detail drawer/modal
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
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

  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "",
    isDestructive: false,
    onConfirm: () => {},
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (branchFilter !== "all") params.append("branch", branchFilter);
      if (yearFilter !== "all") params.append("year", yearFilter);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [branchFilter, yearFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleCreateSuccess = (newStudent: AdminStudent, temporaryPassword: string) => {
    setOtpModalData({
      isOpen: true,
      title: "Student Registered",
      recipientName: newStudent.name,
      identifier: newStudent.roll_number,
      identifierLabel: "Roll Number",
      temporaryPassword,
      roleOrNote: `${newStudent.branch} • Year ${newStudent.year}`,
    });
    fetchStudents();
  };

  const handleResetPassword = (student: AdminStudent) => {
    setConfirmModalData({
      isOpen: true,
      title: "Reset Student Password",
      description: `Generate a new temporary password for ${student.name} (${student.roll_number})? The student will be forced to change this on their next mobile login.`,
      confirmLabel: "Generate Temporary Password",
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/students", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: student.id }),
          });
          const data = await res.json();
          if (res.ok) {
            setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
            setOtpModalData({
              isOpen: true,
              title: "Temporary Password Generated",
              recipientName: student.name,
              identifier: student.roll_number,
              identifierLabel: "Roll Number",
              temporaryPassword: data.temporary_password,
              roleOrNote: student.branch,
            });
            fetchStudents();
          }
        } catch {
          // Handle error
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-black">
            Student Roster Management
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Enrol individual students or batch import with column-mapping and credentials distribution
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkOpen(true)}
            className="rounded-lg border-[#E5E5E5] text-xs font-semibold px-3 h-9 text-black hover:bg-neutral-100"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Batch CSV Ingest
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 h-9"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Enroll Student
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by roll number, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E5E5E5] pl-8 pr-3 py-1.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Branch Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-500">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-lg border border-[#E5E5E5] px-2.5 py-1 text-xs bg-white text-black focus:border-black focus:outline-none"
            >
              <option value="all">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="IT">IT</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold uppercase text-neutral-500">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-lg border border-[#E5E5E5] px-2.5 py-1 text-xs bg-white text-black focus:border-black focus:outline-none"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            className="rounded-lg border-[#E5E5E5] text-xs h-8"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] uppercase font-semibold text-neutral-600 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-mono">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Dept & Year</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Allergies</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    Loading student roster...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    No students found matching your filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-black">
                      {student.roll_number}
                    </td>

                    <td className="px-4 py-3 font-medium text-black">
                      {student.name}
                    </td>

                    <td className="px-4 py-3 text-neutral-700">
                      <span className="font-semibold text-black">{student.branch}</span> • Year {student.year}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-700">
                      {student.phone}
                    </td>

                    <td className="px-4 py-3">
                      {student.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.allergies.slice(0, 2).map((a) => (
                            <span
                              key={a}
                              className="rounded border border-[#E5E5E5] bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-black"
                            >
                              {a}
                            </span>
                          ))}
                          {student.allergies.length > 2 && (
                            <span className="text-[10px] text-neutral-400">
                              +{student.allergies.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">None known</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-[11px] font-medium text-black">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-black"></span>
                        {student.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          title="View student profile details"
                          className="rounded-lg border-[#E5E5E5] text-[11px] h-7 px-2"
                        >
                          <Info className="h-3 w-3 mr-1" /> Details
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(student)}
                          title="Issue new temporary password"
                          className="rounded-lg border-[#E5E5E5] text-[11px] h-7 px-2 hover:bg-neutral-100"
                        >
                          <KeyRound className="h-3 w-3 mr-1" /> Reset Pass
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Drawer / Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-black">
                  Student Institutional Card
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {selectedStudent.roll_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                <span className="text-neutral-500">Full Name</span>
                <span className="font-semibold text-black">{selectedStudent.name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                <span className="text-neutral-500">Branch & Academic Year</span>
                <span className="font-semibold text-black">
                  {selectedStudent.branch} (Year {selectedStudent.year})
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                <span className="text-neutral-500">Student Phone</span>
                <span className="font-mono text-black">{selectedStudent.phone}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#E5E5E5]">
                <span className="text-neutral-500">Emergency Contact</span>
                <span className="font-mono text-black font-semibold">
                  {selectedStudent.emergency_contact}
                </span>
              </div>

              <div>
                <span className="block text-neutral-500 mb-1">Recorded Drug Allergies</span>
                {selectedStudent.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.allergies.map((a) => (
                      <span
                        key={a}
                        className="rounded-lg border border-black bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-black"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-neutral-400 italic">No drug allergies recorded.</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const s = selectedStudent;
                  setSelectedStudent(null);
                  handleResetPassword(s);
                }}
                className="rounded-lg border-[#E5E5E5] text-xs h-8"
              >
                <KeyRound className="h-3 w-3 mr-1" /> Reset Password
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold h-8 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateStudentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={fetchStudents}
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

      <ConfirmActionModal
        isOpen={confirmModalData.isOpen}
        onClose={() => setConfirmModalData({ ...confirmModalData, isOpen: false })}
        onConfirm={confirmModalData.onConfirm}
        title={confirmModalData.title}
        description={confirmModalData.description}
        confirmLabel={confirmModalData.confirmLabel}
        isDestructive={confirmModalData.isDestructive}
      />
    </div>
  );
}
