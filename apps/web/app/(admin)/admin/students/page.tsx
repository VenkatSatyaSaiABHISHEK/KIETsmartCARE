"use client";

import React, { useEffect, useState } from "react";
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

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleCreated = (data: {
    student: AdminStudent;
    temporaryPassword?: string;
  }) => {
    setIsCreateOpen(false);
    loadStudents();
    if (data.temporaryPassword) {
      setOtpModalData({
        isOpen: true,
        title: "Student Profile Provisioned",
        recipientName: data.student.name,
        identifier: data.student.roll_number,
        identifierLabel: "Roll Number",
        temporaryPassword: data.temporaryPassword,
        roleOrNote: `${data.student.branch} • Year ${data.student.year}`,
      });
    }
  };

  const handleResetPassword = (student: AdminStudent) => {
    setConfirmModalData({
      isOpen: true,
      title: "Generate One-Time Password",
      description: `Reset mobile application password for ${student.name} (${student.roll_number})?`,
      confirmLabel: "Generate OTP",
      isDestructive: false,
      onConfirm: async () => {
        const res = await fetch("/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reset_password",
            id: student.id,
          }),
        });
        const data = await res.json();
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        if (data.temporaryPassword) {
          setOtpModalData({
            isOpen: true,
            title: "Temporary Password Issued",
            recipientName: student.name,
            identifier: student.roll_number,
            identifierLabel: "Roll Number",
            temporaryPassword: data.temporaryPassword,
            roleOrNote: "Mobile Sign-in Credentials",
          });
        }
      },
    });
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase());
    const matchBranch = branchFilter === "all" || s.branch === branchFilter;
    const matchYear = yearFilter === "all" || s.year.toString() === yearFilter;
    return matchSearch && matchBranch && matchYear;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-baseline justify-between border-b border-[#E4E4E7] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#09090B]">Student Roster</h1>
          <p className="text-xs text-[#71717A] mt-1">
            Institutional student directory, baseline allergy records, and mobile provisioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="h-10 px-4 rounded border border-[#E4E4E7] text-[#09090B] text-xs font-medium hover:bg-[#FAFAFA] transition-colors"
          >
            Import CSV Roster
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 rounded bg-[#09090B] text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            Add Student
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or roll number..."
          className="h-10 px-3 w-80 text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
        />

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#71717A]">Branch:</span>
          {(["all", "CSE", "ECE", "ME", "IT"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBranchFilter(b)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                branchFilter === b
                  ? "bg-[#09090B] text-white font-medium"
                  : "text-[#71717A] hover:text-[#09090B] border border-[#E4E4E7]"
              }`}
            >
              {b === "all" ? "All" : b}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Table */}
      <div className="border border-[#E4E4E7] rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[11px] uppercase tracking-wider text-[#71717A]">
            <tr>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Roll Number</th>
              <th className="py-3 px-4 font-medium">Branch</th>
              <th className="py-3 px-4 font-medium">Year</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Recorded Allergies</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-[#71717A]">
                  No students found matching your search.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="h-12 hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#09090B]">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-[#71717A]">{s.roll_number}</td>
                  <td className="py-3 px-4 font-medium text-[#09090B]">{s.branch}</td>
                  <td className="py-3 px-4 text-[#71717A]">Year {s.year}</td>
                  <td className="py-3 px-4 text-[#09090B] font-medium capitalize">
                    {s.status}
                  </td>
                  <td className="py-3 px-4 text-[#71717A] max-w-xs truncate">
                    {s.allergies && s.allergies.length > 0
                      ? s.allergies.join(", ")
                      : "None recorded"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleResetPassword(s)}
                      className="text-xs text-[#09090B] hover:underline"
                    >
                      Reset password
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CreateStudentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(student, temporaryPassword) => handleCreated({ student, temporaryPassword })}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          setIsBulkOpen(false);
          loadStudents();
        }}
      />

      <ConfirmActionModal
        isOpen={confirmModalData.isOpen}
        onClose={() => setConfirmModalData((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModalData.title}
        description={confirmModalData.description}
        confirmLabel={confirmModalData.confirmLabel}
        isDestructive={confirmModalData.isDestructive}
        onConfirm={confirmModalData.onConfirm}
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
