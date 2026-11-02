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

    const { data: alerts, error } = await supabase
      .from("alerts")
      .select(`
        id,
        created_at,
        severity,
        type,
        status,
        students ( id, name, roll_number, phone ),
        visits (
          id,
          problem_category,
          visit_medications (
            medicines ( name )
          )
        )
      `)
      .in("doctor_id", candidateDoctorIds)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const doctorAlerts = (alerts || []).map((a: any) => {
      const s = Array.isArray(a.students) ? a.students[0] : a.students;
      const v = Array.isArray(a.visits) ? a.visits[0] : a.visits;
      const meds = (v?.visit_medications || []).map((vm: any) => {
        const m = Array.isArray(vm.medicines) ? vm.medicines[0] : vm.medicines;
        return m?.name || "Medication";
      });

      let reasonText = "Alert Flagged";
      if (a.type === "worse") reasonText = "Reported worse";
      else if (a.type === "same") reasonText = "Reported no improvement";
      else if (a.type === "side_effect") reasonText = "Side effect reported";
      else if (a.type === "no_response") reasonText = "No response";

      return {
        id: a.id,
        student_id: s?.id,
        student_name: s?.name || "Student",
        roll_number: s?.roll_number || "—",
        phone: s?.phone || "+91 98765 43210",
        problem_category: v?.problem_category || "Condition",
        reason: reasonText,
        reported_at: a.created_at,
        severity: a.severity,
        status: a.status,
        medicines: meds,
      };
    });

    return NextResponse.json({ alerts: doctorAlerts });
  } catch (err: any) {
    console.error("GET /api/doctor/alerts error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

