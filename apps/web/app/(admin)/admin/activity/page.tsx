"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminAuditLogEntry } from "@/lib/admin/types";

const ACTION_TYPES = [
  { value: "all", label: "All Activity" },
  { value: "CREATE_STAFF", label: "Create Staff" },
  { value: "DISABLE_STAFF", label: "Disable Staff" },
  { value: "ENABLE_STAFF", label: "Enable Staff" },
  { value: "RESET_PASSWORD", label: "Reset Password" },
  { value: "CHANGE_ROLE", label: "Change Role" },
  { value: "CREATE_STUDENT", label: "Create Student" },
  { value: "BULK_IMPORT_STUDENTS", label: "Bulk Import" },
  { value: "UPDATE_SETTINGS", label: "Update Settings" },
  { value: "ADMIN_LOGIN", label: "Admin Login" },
  { value: "MFA_VERIFIED", label: "MFA Verified" },
];

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (actionFilter !== "all") params.append("action", actionFilter);

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const data = await res.json();
      setLogs(data.audit_logs || []);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;

    const headers = "Log ID,Timestamp,Actor Email,Action,Target Type,Target ID,Description,IP Address\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.actor_email}","${l.action}","${l.target_type}","${l.target_id}","${l.description.replace(/"/g, '""')}","${l.ip_address}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kiet_admin_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-black">
            System Activity & Audit Log
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Immutable PostgreSQL audit_logs records capturing all provisioning, credentials, and settings actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="rounded-lg border-[#E5E5E5] text-xs font-semibold px-3 h-9 text-black hover:bg-neutral-100"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export Audit Log (.CSV)
          </Button>
        </div>
      </div>

      {/* Security notice */}
      <div className="rounded-lg border border-[#E5E5E5] bg-neutral-50 p-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-neutral-700">
          <Lock className="h-4 w-4 text-black" />
          <span>
            <strong className="text-black">Audit Invariant:</strong> Every administrative event, login, and temporary password generation is recorded with actor email, IP address, and timestamp.
          </span>
        </div>
        <div className="text-[11px] font-mono text-neutral-500">
          Total Recorded: {logs.length}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by actor email, description, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E5E5E5] pl-8 pr-3 py-1.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
          />
        </form>

        <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
          <span className="text-[11px] font-semibold uppercase text-neutral-500">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-[#E5E5E5] px-2.5 py-1 text-xs bg-white text-black focus:border-black focus:outline-none font-medium"
          >
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="rounded-lg border-[#E5E5E5] text-xs h-8"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] uppercase font-semibold text-neutral-600 tracking-wider">
              <tr>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Description & Scope</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Target ID</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                    No activity entries found matching your query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-black max-w-md">
                      {log.description}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 font-mono text-[11px]">
                      {log.actor_email}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                      {log.target_id}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                      {log.ip_address}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-neutral-400">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
