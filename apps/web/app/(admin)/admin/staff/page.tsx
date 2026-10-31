"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  KeyRound,
  UserCheck,
  UserX,
  RefreshCw,
  Stethoscope,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const res = await fetch(`/api/admin/staff?${params.toString()}`);
      const data = await res.json();
      setStaff(data.staff || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleCreateSuccess = (newStaff: StaffMember, temporaryPassword: string) => {
    setOtpModalData({
      isOpen: true,
      title: "Staff Account Created",
      recipientName: newStaff.name,
      identifier: newStaff.email,
      identifierLabel: "Institutional Email",
      temporaryPassword,
      roleOrNote: newStaff.role === "doctor" ? "Campus Doctor" : "Campus Health Officer",
    });
    fetchStaff();
  };

  const handleResetPassword = async (member: StaffMember) => {
    setConfirmModalData({
      isOpen: true,
      title: "Reset Staff Password",
      description: `Generate a new one-time temporary password for ${member.name} (${member.email})? The existing password will be revoked immediately.`,
      confirmLabel: "Generate Temporary Password",
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/staff", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: member.id }),
          });
          const data = await res.json();
          if (res.ok) {
            setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
            setOtpModalData({
              isOpen: true,
              title: "Temporary Password Reset",
              recipientName: member.name,
              identifier: member.email,
              identifierLabel: "Institutional Email",
              temporaryPassword: data.temporary_password,
              roleOrNote: member.role,
            });
            fetchStaff();
          }
        } catch {
          // Handle error
        }
      },
    });
  };

  const handleToggleStatus = (member: StaffMember) => {
    const isDisabling = member.status === "active";
    setConfirmModalData({
      isOpen: true,
      title: isDisabling ? "Disable Staff Account" : "Re-Enable Staff Account",
      description: isDisabling
        ? `Are you sure you want to disable ${member.name}? They will immediately lose access to the ${member.role === "doctor" ? "Doctor OPD Portal" : "Health Officer Portal"}.`
        : `Re-enable account for ${member.name}? They will be permitted to authenticate again.`,
      confirmLabel: isDisabling ? "Disable Account" : "Enable Account",
      isDestructive: isDisabling,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/staff", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: member.id,
              status: isDisabling ? "disabled" : "active",
            }),
          });
          if (res.ok) {
            setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
            fetchStaff();
          }
        } catch {
          // Handle error
        }
      },
    });
  };

  const handleChangeRole = (member: StaffMember) => {
    const newRole = member.role === "doctor" ? "officer" : "doctor";
    setConfirmModalData({
      isOpen: true,
      title: "Change Account Role",
      description: `Switch ${member.name}'s role from ${member.role} to ${newRole}? This modifies their portal permissions upon their next session refresh.`,
      confirmLabel: `Change to ${newRole}`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/staff", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: member.id,
              role: newRole,
            }),
          });
          if (res.ok) {
            setConfirmModalData((prev) => ({ ...prev, isOpen: false }));
            fetchStaff();
          }
        } catch {
          // Handle error
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-black">
            Staff Account Management
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Provision and manage Campus Doctors and Health Officers via Supabase Service Role Key
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 h-9"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Provision New Staff
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E5E5E5] pl-8 pr-3 py-1.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-neutral-500 font-medium">Role:</span>
          <div className="flex rounded-lg border border-[#E5E5E5] p-0.5 bg-neutral-100">
            <button
              onClick={() => setRoleFilter("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === "all"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter("doctor")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === "doctor"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setRoleFilter("officer")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === "officer"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              Officers
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStaff}
            className="rounded-lg border-[#E5E5E5] text-xs h-8"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] uppercase font-semibold text-neutral-600 tracking-wider">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Created / Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    No staff accounts found matching your query.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-black">{member.name}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">{member.email}</div>
                    </td>

                    <td className="px-4 py-3">
                      {member.role === "doctor" ? (
                        <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                          <Stethoscope className="mr-1 h-3 w-3" /> Doctor
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wider">
                          <Eye className="mr-1 h-3 w-3" /> Officer
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {member.status === "active" ? (
                        <span className="inline-flex items-center text-[11px] font-medium text-black">
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-black"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-medium text-neutral-400">
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-neutral-400"></span>
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-neutral-700">{member.phone}</div>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-neutral-500">
                      <div>Created: {new Date(member.created_at).toLocaleDateString()}</div>
                      {member.last_active && (
                        <div className="text-[10px] text-neutral-400">
                          Active: {new Date(member.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(member)}
                          title="Generate new temporary password"
                          className="rounded-lg border-[#E5E5E5] text-[11px] h-7 px-2"
                        >
                          <KeyRound className="h-3 w-3 mr-1" /> Reset Pass
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeRole(member)}
                          title="Switch role"
                          className="rounded-lg border-[#E5E5E5] text-[11px] h-7 px-2"
                        >
                          Role
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(member)}
                          title={member.status === "active" ? "Disable staff" : "Enable staff"}
                          className={`rounded-lg border-[#E5E5E5] text-[11px] h-7 px-2 ${
                            member.status === "active"
                              ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                              : "hover:bg-black hover:text-white"
                          }`}
                        >
                          {member.status === "active" ? (
                            <UserX className="h-3 w-3" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
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

      {/* Modals */}
      <CreateStaffModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
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
