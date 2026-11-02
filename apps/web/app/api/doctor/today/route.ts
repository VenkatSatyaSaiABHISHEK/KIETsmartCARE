import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload || payload.role !== "doctor") {
      return NextResponse.json({ error: "Doctor role required" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Resolve doctor ID to valid profiles.id and candidate IDs
    let candidateDoctorIds = [payload.id];
    const { data: directProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", payload.id)
      .maybeSingle();

    if (directProfile) {
      candidateDoctorIds = [directProfile.id];
    } else {
      const { data: matchedDoc } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "doctor")
        .limit(1)
        .maybeSingle();
      if (matchedDoc) {
        candidateDoctorIds = [payload.id, matchedDoc.id];
      }
    }

    // Start and end of current day in Asia/Kolkata
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffset);
    const todayStr = nowIst.toISOString().slice(0, 10);
    const startOfDay = new Date(`${todayStr}T00:00:00.000+05:30`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999+05:30`);

    // 1. Fetch today's visits for this doctor
    let visits: any[] | null = null;
    const { data: primaryVisits, error: primaryError } = await supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        problem_category,
        problems,
        status,
        student_id,
        students!inner ( id, name, roll_number, branch, year, status )
      `)
      .in("doctor_id", candidateDoctorIds)
      .eq("students.status", "active")
      .gte("visit_date", startOfDay.toISOString())
      .lte("visit_date", endOfDay.toISOString())
      .order("visit_date", { ascending: false });

    if (primaryError && primaryError.code === "42703") {
      // Graceful fallback if 'problems' column is pending migration
      const { data: fallbackVisits, error: fallbackError } = await supabase
        .from("visits")
        .select(`
          id,
          visit_date,
          problem_category,
          status,
          student_id,
          students ( id, name, roll_number, branch, year )
        `)
        .in("doctor_id", candidateDoctorIds)
        .gte("visit_date", startOfDay.toISOString())
        .lte("visit_date", endOfDay.toISOString())
        .order("visit_date", { ascending: false });

      if (fallbackError) {
        console.error("Error fetching fallback today visits:", fallbackError);
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      visits = fallbackVisits;
    } else if (primaryError) {
      console.error("Error fetching today visits:", primaryError);
      return NextResponse.json({ error: primaryError.message }, { status: 500 });
    } else {
      visits = primaryVisits;
    }

    // 2. Distinct students seen today
    const seenStudentIds = new Set((visits || []).map((v: any) => v.student_id));
    const patientsSeenCount = seenStudentIds.size;

    // 3. Courses active (active visits for this doctor with unfinished scheduled doses)
    const { count: activeCoursesCount } = await supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .in("doctor_id", candidateDoctorIds)
      .eq("status", "active");

    // 4. Open alerts for this doctor
    const { count: alertsCount } = await supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .in("doctor_id", candidateDoctorIds)
      .in("status", ["open", "in_progress"]);

    const todayPatients = (visits || []).map((v: any) => {
      const s = Array.isArray(v.students) ? v.students[0] : v.students;
      return {
        id: v.id,
        student_id: s?.id,
        student_name: s?.name || "Student",
        roll_number: s?.roll_number || "—",
        branch: s?.branch || "Campus",
        year: s?.year || 1,
        problem: (v.problems && v.problems.length > 0)
          ? v.problems.join(", ")
          : v.problem_category || "General Health",
        consultation_time: new Date(v.visit_date).toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        status: v.status || "active",
      };
    });

    return NextResponse.json({
      summary: {
        patients_seen: patientsSeenCount,
        courses_active: activeCoursesCount || 0,
        alerts: alertsCount || 0,
      },
      todayPatients,
    });
  } catch (err: any) {
    console.error("GET /api/doctor/today error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
