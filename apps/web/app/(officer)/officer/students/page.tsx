"use client";

import React, { useState, useEffect } from "react";
import { OfficerHeader } from "../components/OfficerHeader";
import { OfficerService } from "@/lib/officer/service";
import { StudentOverviewItem } from "@/lib/officer/types";
import {
  Search,
  Users,
  Filter,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OfficerStudentsPage() {
  const [students, setStudents] = useState<StudentOverviewItem[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await OfficerService.getStudentsOverview(
        search,
        branchFilter,
        yearFilter,
        statusFilter
      );
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, branchFilter, yearFilter, statusFilter]);

  const branches = [
    { value: "all", label: "All Departments" },
    { value: "computer science", label: "Computer Science" },
    { value: "information technology", label: "Information Technology" },
    { value: "electronics & comm.", label: "Electronics & Comm." },
    { value: "mechanical", label: "Mechanical Engineering" },
    { value: "electrical", label: "Electrical Engineering" },
  ];

  const getStatusBadge = (status: StudentOverviewItem["status"]) => {
    switch (status) {
      case "Recovered":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3 inline text-emerald-600" />
            Recovered
          </Badge>
        );
      case "Active treatment":
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200">
            <Clock className="mr-1 h-3 w-3 inline text-blue-600" />
            Active Treatment
          </Badge>
        );
      case "Not recovered":
        return (
          <Badge className="bg-red-50 text-red-800 border-red-300">
            <AlertTriangle className="mr-1 h-3 w-3 inline text-red-600" />
            Not Recovered
          </Badge>
        );
      case "No response":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200">
            <HelpCircle className="mr-1 h-3 w-3 inline text-amber-600" />
            No Response (24h)
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <OfficerHeader
        title="Campus Students Healthcare Registry"
        subtitle="Searchable overview of active treatment status and recovery adherence across all academic departments"
      />

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-[#0B1736] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-[#0B1736] focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="sm:col-span-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-[#0B1736] focus:outline-none"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2 text-xs text-[#0B1736] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Active treatment">Active Treatment</option>
              <option value="Recovered">Recovered</option>
              <option value="Not recovered">Not Recovered</option>
              <option value="No response">No Response</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#0B1736]">
                Enrolled Students Under Surveillance ({students.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Privacy rule: Default view shows status only, not clinical notes.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Roll Number</th>
                  <th className="px-6 py-3">Department Branch</th>
                  <th className="px-6 py-3">Academic Year</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3">Last OPD Visit</th>
                  <th className="px-6 py-3 text-right">Telephonic Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No students found matching current search and filter selections.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-[#0B1736]">
                        {student.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-600 font-medium">
                        {student.roll_number}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        {student.branch}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">
                        Year {student.year}
                      </td>
                      <td className="px-6 py-3.5">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                        {student.last_visit_date}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <a
                          href={`tel:${student.phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          title={`Direct call to ${student.phone}`}
                        >
                          <PhoneCall className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                          Call
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
