"use client";

import React, { useState, useEffect } from "react";
import { PinCredential, UserRole } from "@/lib/auth/pin-service";

export default function ManageAccessPage() {
  const [credentials, setCredentials] = useState<PinCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Credential Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("doctor");
  const [newEmail, setNewEmail] = useState("");
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPinNotice, setGeneratedPinNotice] = useState<{
    name: string;
    role: string;
    pin: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Admin Code Change State
  const [isAdminCodeOpen, setIsAdminCodeOpen] = useState(false);
  const [currentAdminCode, setCurrentAdminCode] = useState("");
  const [newAdminCode, setNewAdminCode] = useState("");
  const [adminCodeStatus, setAdminCodeStatus] = useState<string | null>(null);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/access");
      const data = await res.json();
      if (data.success && data.credentials) {
        setCredentials(data.credentials);
      }
    } catch {
      setErrorMsg("Failed to load access credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (newRole === "admin" && !currentAdminPassword) {
      setErrorMsg("Please re-enter your current 8-digit admin code to authorize creating a new administrator.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          role: newRole,
          email: newEmail.trim() || undefined,
          currentAdminPassword: newRole === "admin" ? currentAdminPassword : undefined,
        }),
      });
      const data = await res.json();

      if (data.success && data.credential) {
        setGeneratedPinNotice({
          name: data.credential.name,
          role: data.credential.role,
          pin: data.credential.pin,
        });
        setNewName("");
        setNewEmail("");
        setCurrentAdminPassword("");
        setIsCreateOpen(false);
        fetchCredentials();
      } else {
        setErrorMsg(data.error || "Failed to issue new PIN.");
      }
    } catch {
      setErrorMsg("Server error while generating PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async (id: string, name: string, role: string) => {
    if (!confirm(`Regenerate security PIN for ${name}? The existing PIN will be immediately revoked.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", id }),
      });
      const data = await res.json();
      if (data.success && data.pin) {
        setGeneratedPinNotice({
          name,
          role,
          pin: data.pin,
        });
        fetchCredentials();
      } else {
        alert(data.error || "Failed to regenerate PIN.");
      }
    } catch {
      alert("Error regenerating PIN.");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCredentials();
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleDeleteCredential = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete access for ${name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/access?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCredentials();
      } else {
        alert(data.error || "Failed to delete credential.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleChangeAdminCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCodeStatus(null);

    if (newAdminCode.length !== 8 || !/^\d{8}$/.test(newAdminCode)) {
      setAdminCodeStatus("New Admin code must be exactly 8 numeric digits.");
      return;
    }

    try {
      const res = await fetch("/api/admin/access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_admin_code",
          oldPin: currentAdminCode,
          newPin: newAdminCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminCodeStatus("Admin 8-digit code successfully updated.");
        setCurrentAdminCode("");
        setNewAdminCode("");
        setTimeout(() => setIsAdminCodeOpen(false), 1500);
      } else {
        setAdminCodeStatus(data.error || "Failed to change admin code.");
      }
    } catch {
      setAdminCodeStatus("Error updating code.");
    }
  };

  const copyToClipboard = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCredentials = (credentials || []).filter((c) => {
    const credName = (c?.name || "").toLowerCase();
    const credRole = (c?.role || "").toLowerCase();
    const query = (searchQuery || "").toLowerCase().trim();
    return !query || credName.includes(query) || credRole.includes(query);
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
        <div>
          <h1 className="text-xl font-semibold text-[#09090B] tracking-tight">
            Manage Access & PINs
          </h1>
          <p className="text-xs text-[#71717A] mt-1 font-normal">
            Issue, regenerate, or revoke 5-digit PIN credentials for Doctors and Officers, and manage Master Admin security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdminCodeOpen(true)}
            className="h-9 px-3.5 rounded bg-white hover:bg-[#FAFAFA] border border-[#E4E4E7] text-[#09090B] text-xs font-medium transition-colors cursor-pointer"
          >
            Change Admin 8-Digit Code
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            + Issue New PIN
          </button>
        </div>
      </div>

      {/* Generated PIN Notice Banner (Shown once when created or regenerated) */}
      {generatedPinNotice && (
        <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50/60 p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                Generated Security PIN (Shown Once)
              </span>
              <h3 className="text-sm font-semibold text-emerald-950 mt-1">
                PIN for {generatedPinNotice.name} ({generatedPinNotice.role.toUpperCase()})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setGeneratedPinNotice(null)}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-medium cursor-pointer"
            >
              Dismiss &times;
            </button>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="font-mono text-3xl font-bold tracking-widest text-emerald-900 bg-white px-5 py-2 rounded border border-emerald-300">
              {generatedPinNotice.pin}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(generatedPinNotice.pin)}
              className="h-10 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? "Copied!" : "Copy PIN"}
            </button>
          </div>

          <p className="text-[11px] text-emerald-800 font-normal">
            Important: This PIN is stored in hashed format in the database and cannot be recovered. Ensure the staff member records it securely.
          </p>
        </div>
      )}

      {/* Search & Statistics Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by staff name or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-72 rounded border border-[#E4E4E7] bg-white px-3 text-xs text-[#09090B] placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#09090B]"
        />

        <div className="text-xs text-[#71717A]">
          Showing {filteredCredentials.length} credential{filteredCredentials.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Credentials Table */}
      <div className="rounded border border-[#E4E4E7] bg-white overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA] text-[#71717A]">
              <th className="py-3 px-4 font-medium">Staff Member</th>
              <th className="py-3 px-4 font-medium">Role</th>
              <th className="py-3 px-4 font-medium">PIN Length</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Issued Date</th>
              <th className="py-3 px-4 font-medium">Last Login</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#71717A]">
                  Loading access credentials...
                </td>
              </tr>
            ) : filteredCredentials.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#71717A]">
                  No credentials found.
                </td>
              </tr>
            ) : (
              filteredCredentials.map((cred) => {
                const isAdmin = cred.role === "admin";
                const activeAdminCount = credentials.filter((c) => c.role === "admin" && c.is_active).length;
                const isLastActiveAdmin = isAdmin && cred.is_active && activeAdminCount <= 1;

                return (
                  <tr key={cred.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#09090B]">
                      {cred.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide ${cred.role === "doctor"
                            ? "bg-sky-50 text-sky-800 border border-sky-200"
                            : cred.role === "officer"
                              ? "bg-slate-100 text-slate-800 border border-slate-200"
                              : "bg-neutral-900 text-white"
                          }`}
                      >
                        {cred.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#71717A] font-mono">
                      {cred.pin_length} digits
                    </td>
                    <td className="py-3 px-4">
                      {cred.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#71717A]">
                      {new Date(cred.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-[#71717A]">
                      {cred.last_login_at
                        ? new Date(cred.last_login_at).toLocaleString()
                        : "Never logged in"}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {isLastActiveAdmin ? (
                        <span
                          className="text-xs text-[#71717A] italic"
                          title="Action blocked: The last active administrator account cannot be disabled, deleted, or demoted."
                        >
                          Last active admin (protected)
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleRegenerate(cred.id, cred.name, cred.role)
                            }
                            className="text-xs text-[#09090B] hover:underline font-medium cursor-pointer"
                          >
                            Regenerate
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(cred.id, cred.is_active)
                            }
                            className={`text-xs font-medium cursor-pointer ${cred.is_active
                                ? "text-amber-700 hover:underline"
                                : "text-emerald-600 hover:underline"
                              }`}
                          >
                            {cred.is_active ? "Revoke" : "Activate"}
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCredential(cred.id, cred.name)
                            }
                            className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Issue New Access PIN */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-[#E4E4E7] bg-white p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#09090B]">
                Issue Access Credentials
              </h2>
              <p className="text-xs text-[#71717A] mt-1 font-normal">
                Generates a cryptographically secure, unique PIN for staff or secondary administrators.
              </p>
            </div>

            <form onSubmit={handleCreateCredential} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#09090B]">
                  Account Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta or Admin Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-9 rounded border border-[#E4E4E7] px-3 text-xs text-[#09090B] focus:outline-none focus:ring-1 focus:ring-[#09090B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#09090B]">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full h-9 rounded border border-[#E4E4E7] px-3 text-xs text-[#09090B] focus:outline-none focus:ring-1 focus:ring-[#09090B]"
                >
                  <option value="doctor">Doctor (OPD Prescriptions)</option>
                  <option value="officer">Health Officer (Campus Triage)</option>
                  <option value="admin">Administrator (System & Roster Access)</option>
                </select>
              </div>

              {newRole === "admin" && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#09090B]">
                      Administrator Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin.name@kiet.edu"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full h-9 rounded border border-[#E4E4E7] px-3 text-xs text-[#09090B] focus:outline-none focus:ring-1 focus:ring-[#09090B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#09090B]">
                      Confirm Current Admin 8-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      required
                      placeholder="Enter your current 8-digit admin PIN"
                      value={currentAdminPassword}
                      onChange={(e) => setCurrentAdminPassword(e.target.value)}
                      className="w-full h-9 rounded border border-[#E4E4E7] px-3 text-xs text-[#09090B] font-mono focus:outline-none focus:ring-1 focus:ring-[#09090B]"
                    />
                  </div>

                  <div className="rounded-[6px] border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Note: An 8-digit PIN will be issued for this secondary administrator. Multi-factor recovery will be required upon first sign-in. The last active admin is protected by database triggers.
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-[#E4E4E7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 px-4 rounded border border-[#E4E4E7] text-xs font-medium text-[#71717A] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Generate & Issue PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Admin 8-Digit Code */}
      {isAdminCodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-[#E4E4E7] bg-white p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#09090B]">
                Change Admin 8-Digit Code
              </h2>
              <p className="text-xs text-[#71717A] mt-1 font-normal">
                Update the master administrator login PIN. Must be exactly 8 digits.
              </p>
            </div>

            <form onSubmit={handleChangeAdminCode} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#09090B]">
                  Current 8-Digit Code
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="Enter current code"
                  value={currentAdminCode}
                  onChange={(e) => setCurrentAdminCode(e.target.value)}
                  className="w-full h-9 rounded border border-[#E4E4E7] px-3 text-xs text-[#09090B] font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#09090B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#09090B]">
                  New 8-Digit Code
                </label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="Enter new 8-digit code"
                  value={newAdminCode}
                  onChange={(e) => setNewAdminCode(e.target.value)}
                  className="w-full h-9 rounded border border-[#E4E4E7] px-3 text-xs text-[#09090B] font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#09090B]"
                />
              </div>

              {adminCodeStatus && (
                <div
                  className={`text-xs p-2.5 rounded ${adminCodeStatus.includes("successfully")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {adminCodeStatus}
                </div>
              )}

              <div className="pt-3 border-t border-[#E4E4E7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminCodeOpen(false)}
                  className="h-9 px-4 rounded border border-[#E4E4E7] text-xs font-medium text-[#71717A] hover:bg-[#FAFAFA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Update Admin Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

