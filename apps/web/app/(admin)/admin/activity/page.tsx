"use client";

import React, { useEffect, useState } from "react";
import { AdminAuditLogEntry } from "@/lib/admin/types";

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
      setLogs(data.logs || data.audit_logs || []);
    } catch {
      // fallback
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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-baseline justify-between border-b border-[#E4E4E7] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#09090B]">Activity Log</h1>
          <p className="text-xs text-[#71717A] mt-1">
            Immutable administrative audit ledger. Every account modification and roster change is permanently recorded.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action, table, or user ID..."
          className="h-10 px-3 w-80 text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
        />

        <button
          type="submit"
          className="h-10 px-4 rounded bg-[#09090B] text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Clean Table */}
      <div className="border border-[#E4E4E7] rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[11px] uppercase tracking-wider text-[#71717A]">
            <tr>
              <th className="py-3 px-4 font-medium">Timestamp</th>
              <th className="py-3 px-4 font-medium">Action</th>
              <th className="py-3 px-4 font-medium">Table</th>
              <th className="py-3 px-4 font-medium">Record ID</th>
              <th className="py-3 px-4 font-medium">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#71717A]">
                  {loading ? "Loading activity logs..." : "No administrative events found."}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="h-12 hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 px-4 font-mono text-[#71717A] whitespace-nowrap">
                    {new Date(log.timestamp || (log as any).created_at || Date.now()).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#09090B]">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-[#71717A]">{log.target_type || (log as any).table_name || "—"}</td>
                  <td className="py-3 px-4 font-mono text-[#71717A]">
                    {log.target_id ? log.target_id.slice(0, 8) + "..." : "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#71717A]">
                    {log.actor_email || (log as any).user_id || "System"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
