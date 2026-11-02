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
    if (!payload || (payload.role !== "doctor" && payload.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = createAdminClient();

    let candidateDoctorIds: string[] | null = null;
    if (payload.role === "doctor") {
      candidateDoctorIds = [payload.id];
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
    }

    let query = supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        problem_category,
        notes,
        status,
        doctor_id,
        students!inner ( id, name, roll_number, branch ),
        profiles:doctor_id ( full_name ),
        visit_medications (
          dose,
          medicines ( name )
        )
      `)
      .eq("students.status", "active")
      .order("visit_date", { ascending: false });

    if (candidateDoctorIds) {
      query = query.in("doctor_id", candidateDoctorIds);
    }

    if (startDate) {
      query = query.gte("visit_date", `${startDate}T00:00:00.000Z`);
    }

    if (endDate) {
      query = query.lte("visit_date", `${endDate}T23:59:59.999Z`);
    }

    const { data: visits, error } = await query.limit(100);

    if (error) {
      console.error("Doctor records query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let records = (visits || []).map((v: any) => {
      const s = Array.isArray(v.students) ? v.students[0] : v.students;
      const p = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
      const vMeds = v.visit_medications || [];
      const meds = vMeds.map((vm: any) => {
        const m = Array.isArray(vm.medicines) ? vm.medicines[0] : vm.medicines;
        return m?.name ? `${m.name} ${vm.dose || ""}`.trim() : "Medication";
      });

      return {
        id: v.id,
        visit_date: v.visit_date,
        student_id: s?.id,
        student_name: s?.name || "Student",
        roll_number: s?.roll_number || "—",
        branch: s?.branch || "Campus",
        problem_category: v.problem_category || "General Health",
        clinical_notes: v.notes || "OPD consultation",
        doctor_name: p?.full_name ? `Dr. ${p.full_name}` : "OPD Doctor",
        status: v.status || "active",
        recovery_response: v.status === "recovered" ? "Recovered" : "Active",
        doses_summary: "Course recorded",
        medications: meds,
      };
    });

    if (search) {
      records = records.filter(
        (r) =>
          r.student_name.toLowerCase().includes(search) ||
          r.roll_number.toLowerCase().includes(search) ||
          r.problem_category.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ records });
  } catch (err: any) {
    console.error("GET /api/doctor/records error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
