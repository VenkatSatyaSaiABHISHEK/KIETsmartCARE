"use client";

import React, { useEffect, useState } from "react";
import { StaffMember } from "@/lib/admin/types";
import { CreateStaffModal } from "../components/CreateStaffModal";
import { OneTimePasswordModal } from "../components/OneTimePasswordModal";
import { ConfirmActionModal } from "../components/ConfirmActionModal";

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      setStaff(data.staff || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreated = (data: {
    staff: StaffMember;
    temporaryPassword?: string;
  }) => {
    setIsCreateOpen(false);
    loadStaff();
    if (data.temporaryPassword) {
      setOtpModalData({
        isOpen: true,
        title: "Staff Account Created",
        recipientName: data.staff.name,
        identifier: data.staff.email,
        identifierLabel: "Institutional Email",
        temporaryPassword: data.temporaryPassword,
        roleOrNote: `${data.staff.role.toUpperCase()} Account Created`,
      });
    }
  };

  const handleToggleStatus = (member: StaffMember) => {
    const isSuspending = member.status === "active";
    setConfirmModalData({
      isOpen: true,
      title: isSuspending ? "Suspend Staff Access" : "Reinstate Staff Access",
      description: isSuspending
        ? `Are you sure you want to suspend access for ${member.name} (${member.email})? They will be unable to log in to their clinical portal.`
        : `Reinstate portal access for ${member.name}?`,
      confirmLabel: isSuspending ? "Suspend Access" : "Reinstate Access",
      isDestructive: isSuspending,
      onConfirm: async () => {
        await fetch("/api/admin/staff", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: member.id,
            status: isSuspending ? "inactive" : "active",
          }),
        });
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        loadStaff();
      },
    });
  };

  const handleResetPassword = (member: StaffMember) => {
    setConfirmModalData({
      isOpen: true,
      title: "Generate One-Time Password",
      description: `Reset authentication credentials for ${member.name}? A temporary password will be generated.`,
      confirmLabel: "Generate OTP",
      isDestructive: false,
      onConfirm: async () => {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reset_password",
            id: member.id,
          }),
        });
        const data = await res.json();
        setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
        if (data.temporaryPassword) {
          setOtpModalData({
            isOpen: true,
            title: "Temporary Password Issued",
            recipientName: member.name,
            identifier: member.email,
            identifierLabel: "Email",
            temporaryPassword: data.temporaryPassword,
            roleOrNote: "Password Reset Complete",
          });
        }
      },
    });
  };

  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-baseline justify-between border-b border-[#E4E4E7] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#09090B]">Staff Accounts</h1>
          <p className="text-xs text-[#71717A] mt-1">
            Provision and manage credentials for OPD Doctors and Campus Health Officers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-4 rounded bg-[#09090B] text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
        >
          Add Staff Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="h-10 px-3 w-80 text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
        />

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#71717A]">Role:</span>
          {(["all", "doctor", "officer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                roleFilter === r
                  ? "bg-[#09090B] text-white font-medium"
                  : "text-[#71717A] hover:text-[#09090B] border border-[#E4E4E7]"
              }`}
            >
              {r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}
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
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Created</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#71717A]">
                  No staff members match the current filter.
                </td>
              </tr>
            ) : (
              filteredStaff.map((s) => (
                <tr key={s.id} className="h-12 hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#09090B]">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-[#71717A]">{s.email}</td>
                  <td className="py-3 px-4 uppercase text-2xs font-semibold text-[#09090B]">
                    {s.role}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-[#09090B]">
                    {s.status === "active" ? "Active" : "Inactive"}
                  </td>
                  <td className="py-3 px-4 text-[#71717A]">
                    {new Date(s.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => handleResetPassword(s)}
                      className="text-xs text-[#09090B] hover:underline"
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s)}
                      className={`text-xs hover:underline ${
                        s.status === "active" ? "text-[#DC2626]" : "text-[#09090B]"
                      }`}
                    >
                      {s.status === "active" ? "Suspend" : "Reinstate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(staff, temporaryPassword) => handleCreated({ staff, temporaryPassword })}
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
