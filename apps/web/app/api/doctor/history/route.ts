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
    const studentId = searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json({ history: [] });
    }

    const supabase = createAdminClient();

    const { data: visits, error } = await supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        problem_category,
        notes,
        status,
        doctor_id,
        profiles:doctor_id ( full_name ),
        visit_medications (
          id,
          dose,
          meal_relation,
          medicines ( name )
        )
      `)
      .eq("student_id", studentId)
      .order("visit_date", { ascending: false });

    if (error) {
      console.error("Doctor history query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const history = (visits || []).map((v: any) => {
      const vMeds = v.visit_medications || [];
      const meds = vMeds.map((vm: any) => {
        const m = Array.isArray(vm.medicines) ? vm.medicines[0] : vm.medicines;
        return m?.name ? `${m.name} ${vm.dose || ""}`.trim() : "Medication";
      });

      const p = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;

      return {
        id: v.id,
        visit_date: v.visit_date,
        problem_category: v.problem_category || "OPD Consultation",
        doctor_name: p?.full_name ? `Dr. ${p.full_name}` : "OPD Doctor",
        status: v.status || "active",
        recovery_status: v.status === "recovered" ? "Recovered" : "Active",
        doses_summary: "Prescribed course",
        medications_summary: meds.join(", ") || "No medications",
      };
    });

    return NextResponse.json({ history });
  } catch (err: any) {
    console.error("GET /api/doctor/history error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
