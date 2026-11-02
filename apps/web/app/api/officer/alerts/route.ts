import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PinAuthService } from "@/lib/auth/pin-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized. Session expired." }, { status: 401 });
    }

    const session = PinAuthService.verifySessionToken(sessionToken);
    if (!session || session.role !== "officer") {
      return NextResponse.json({ error: "Unauthorized. Officer access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all"; // all | red | no_response
    const status = searchParams.get("status") || "all"; // all | open | in_progress | resolved

    const supabase = createAdminClient();

    let query = supabase
      .from("alerts")
      .select(`
        id,
        type,
        severity,
        status,
        created_at,
        student_id,
        doctor_id,
        visit_id,
        students (
          id,
          name,
          roll_number,
          branch,
          year,
          phone
        ),
        profiles:doctor_id (
          full_name
        ),
        visits:visit_id (
          id,
          problem_category,
          status,
          visit_medications (
            dose,
            medicines ( name )
          )
        )
      `)
      .order("created_at", { ascending: true }); // Longest waiting first

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (tab === "red") {
      query = query.eq("severity", "red");
    } else if (tab === "no_response") {
      query = query.eq("type", "no_response");
    }

    const { data, error } = await query;
    if (error) {
      console.error("Alerts query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Tab count totals
    const { data: allAlerts } = await supabase.from("alerts").select("id, severity, type, status");
    const counts = {
      all: (allAlerts || []).length,
      red: (allAlerts || []).filter((a: any) => a.severity === "red").length,
      no_response: (allAlerts || []).filter((a: any) => a.type === "no_response").length,
      open: (allAlerts || []).filter((a: any) => a.status === "open").length,
      in_progress: (allAlerts || []).filter((a: any) => a.status === "in_progress").length,
      resolved: (allAlerts || []).filter((a: any) => a.status === "resolved").length,
    };

    const formattedAlerts = (data || []).map((a: any) => {
      const s = Array.isArray(a.students) ? a.students[0] : a.students;
      const v = Array.isArray(a.visits) ? a.visits[0] : a.visits;
      const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
      const vMeds = v?.visit_medications || [];
      const meds = vMeds.map((vm: any) => {
        const m = Array.isArray(vm.medicines) ? vm.medicines[0] : vm.medicines;
        return m?.name ? `${m.name} ${vm.dose || ""}`.trim() : "Medication";
      });

      let reasonText = "Alert flagged";
      if (a.type === "worse") reasonText = "Reported worse";
      else if (a.type === "same") reasonText = "Symptoms not improved";
      else if (a.type === "side_effect") reasonText = "Side effect reported";
      else if (a.type === "no_response") reasonText = "No response";

      return {
        id: a.id,
        student_id: a.student_id,
        student_name: s?.name || "Student",
        roll_number: s?.roll_number || "—",
        branch: s?.branch || "Campus",
        year: s?.year ? `${s.year}th Year` : "Student",
        phone: s?.phone || "+91 98765 43210",
        doctor_name: p?.full_name ? `Dr. ${p.full_name}` : "OPD Doctor",
        reason: reasonText,
        type: a.type,
        severity: a.severity,
        status: a.status,
        created_at: a.created_at,
        doses_confirmed: 0,
        doses_total: 0,
        case_details: {
          problem_category: v?.problem_category || "Health Condition",
          medicines: meds.length > 0 ? meds : ["Prescribed Medication"],
          doses_confirmed: 0,
          total_doses: 0,
          recovery_answer: reasonText,
          side_effects: a.type === "side_effect" ? "Adverse reaction / side effect reported by student" : undefined,
        },
      };
    });

    return NextResponse.json({
      alerts: formattedAlerts,
      counts,
    });
  } catch (err: any) {
    console.error("GET /api/officer/alerts error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch alerts" }, { status: 500 });
  }
}
