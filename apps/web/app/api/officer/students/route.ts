import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session expired: Please sign in again." },
        { status: 401 }
      );
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload || payload.role !== "officer") {
      return NextResponse.json(
        { error: "Access denied: Health Officer role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today";
    const anchorDateParam = searchParams.get("anchorDate");
    const tab = searchParams.get("tab") || "all";
    const branch = searchParams.get("branch") || "all";
    const year = searchParams.get("year") || "all";
    const statusParam = searchParams.get("status") || "all";
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const supabase = createAdminClient();

    // Fetch all currently open alerts
    const { data: openAlerts } = await supabase
      .from("alerts")
      .select("student_id, type")
      .in("status", ["open", "in_progress"]);

    const openAlertStudentIds = new Set((openAlerts || []).map((a) => a.student_id));
    const noResponseStudentIds = new Set(
      (openAlerts || []).filter((a) => a.type === "no_response").map((a) => a.student_id)
    );

    // Fetch all visits with students, ordered by visit_date DESC
    let visitQuery = supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        status,
        students!inner ( id, name, roll_number, branch, year, phone )
      `)
      .order("visit_date", { ascending: false });

    if (period !== "all") {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowIst = new Date(now.getTime() + istOffset);
      const todayIstStr = nowIst.toISOString().slice(0, 10);
      const anchorDate = anchorDateParam || todayIstStr;

      const anchorStart = new Date(`${anchorDate}T00:00:00.000+05:30`);
      const anchorEnd = new Date(`${anchorDate}T23:59:59.999+05:30`);

      let periodStart = anchorStart;
      if (period === "7d") {
        const d = new Date(anchorStart);
        d.setDate(d.getDate() - 6);
        periodStart = d;
      } else if (period === "30d") {
        const d = new Date(anchorStart);
        d.setDate(d.getDate() - 29);
        periodStart = d;
      }
      visitQuery = visitQuery
        .gte("visit_date", periodStart.toISOString())
        .lte("visit_date", anchorEnd.toISOString());
    }

    const { data: visits } = await visitQuery;

    // Group visits by student
    const studentMap = new Map<string, any>();
    for (const v of (visits as any[]) || []) {
      const s: any = Array.isArray(v.students) ? v.students[0] : v.students;
      if (!s || studentMap.has(s.id)) continue;

      let current_status = "Active treatment";
      if (noResponseStudentIds.has(s.id)) {
        current_status = "No response";
      } else if (openAlertStudentIds.has(s.id)) {
        current_status = "Needs attention";
      } else if (v.status === "recovered" || v.status === "completed") {
        current_status = "Completed";
      } else if (v.status === "not_recovered") {
        current_status = "Not recovered";
      }

      studentMap.set(s.id, {
        student_id: s.id,
        name: s.name,
        roll_number: s.roll_number,
        branch: s.branch,
        year: s.year || 1,
        phone: s.phone || "+91 98765 43210",
        current_status,
        last_visit_date: v.visit_date,
        has_open_alert: openAlertStudentIds.has(s.id),
      });
    }

    // If period is "all", also include students without visits
    if (period === "all") {
      const { data: allStudentsData } = await supabase
        .from("students")
        .select("id, name, roll_number, branch, year, phone")
        .order("name");

      for (const s of allStudentsData || []) {
        if (!studentMap.has(s.id)) {
          studentMap.set(s.id, {
            student_id: s.id,
            name: s.name,
            roll_number: s.roll_number,
            branch: s.branch,
            year: s.year || 1,
            phone: s.phone || "+91 98765 43210",
            current_status: "No visits",
            last_visit_date: null,
            has_open_alert: false,
          });
        }
      }
    }

    let allStudents = Array.from(studentMap.values());

    // Calculate tab counts before filtering by tab, branch, year, status
    const countAll = allStudents.length;
    const countNeedsAttention = allStudents.filter((s) => s.has_open_alert || s.current_status === "Needs attention").length;
    const countActive = allStudents.filter((s) => s.current_status === "Active treatment").length;
    const countRecovered = allStudents.filter((s) => s.current_status === "Recovered").length;

    // Filter by tab
    if (tab === "needs_attention") {
      allStudents = allStudents.filter((s) => s.has_open_alert || s.current_status === "Needs attention");
    } else if (tab === "active") {
      allStudents = allStudents.filter((s) => s.current_status === "Active treatment");
    } else if (tab === "recovered") {
      allStudents = allStudents.filter((s) => s.current_status === "Recovered");
    }

    // Filter by branch
    if (branch && branch !== "all") {
      allStudents = allStudents.filter((s) =>
        s.branch?.toLowerCase().includes(branch.toLowerCase())
      );
    }

    // Filter by year
    if (year && year !== "all") {
      allStudents = allStudents.filter((s) => String(s.year) === String(year));
    }

    // Filter by status dropdown
    if (statusParam && statusParam !== "all") {
      allStudents = allStudents.filter((s) =>
        s.current_status?.toLowerCase().replace(/\s+/g, "_") ===
        statusParam.toLowerCase().replace(/\s+/g, "_")
      );
    }

    // Filter by search
    if (search) {
      allStudents = allStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.roll_number.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      counts: {
        all: countAll,
        needs_attention: countNeedsAttention,
        active: countActive,
        recovered: countRecovered,
      },
      students: allStudents.slice(0, limit),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load officer students" },
      { status: 500 }
    );
  }
}
