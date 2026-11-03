import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, student_id, dose_id, status, notes, recovery_id, answer, meal_times } = body;

    const supabase = createAdminClient();

    if (action === "dose_status" && dose_id) {
      // Resolve student_id if missing
      let resolvedStudentId = student_id;
      if (!resolvedStudentId) {
        const { data: dose } = await supabase
          .from("dose_schedule")
          .select("student_id")
          .eq("id", dose_id)
          .maybeSingle();
        if (dose) resolvedStudentId = dose.student_id;
      }

      const adherenceResponse =
        status === "taken" ? "taken" : status === "taken_late" ? "taken_late" : "not_taken";

      // 1. Check if event exists already
      const { data: existingEvent } = await supabase
        .from("dose_events")
        .select("id")
        .eq("schedule_id", dose_id)
        .maybeSingle();

      let eventResult = null;
      if (existingEvent) {
        const { data, error } = await supabase
          .from("dose_events")
          .update({
            response: adherenceResponse,
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingEvent.id)
          .select()
          .single();

        if (error) {
          console.error("[DOSE EVENT UPDATE ERROR]", error);
          return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
        }
        eventResult = data;
      } else {
        const { data, error } = await supabase
          .from("dose_events")
          .insert({
            schedule_id: dose_id,
            student_id: resolvedStudentId,
            response: adherenceResponse,
            responded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error("[DOSE EVENT INSERT ERROR]", error);
          return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
        }
        eventResult = data;
      }

      // CRITICAL: Synchronize dose_schedule table directly so ALL web, mobile, and doctor views reflect taken status immediately
      await supabase
        .from("dose_schedule")
        .update({
          status: adherenceResponse,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dose_id);

      return NextResponse.json(
        {
          success: true,
          status: adherenceResponse,
          event: eventResult,
        },
        { headers: CORS_HEADERS }
      );
    }

    if (action === "recovery_answer" && recovery_id && answer) {
      const { data, error } = await supabase
        .from("recovery_checks")
        .update({
          answer,
          answered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", recovery_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
      }

      return NextResponse.json({ success: true, recovery: data }, { headers: CORS_HEADERS });
    }

    if (action === "update_meal_times" && student_id && meal_times) {
      const { data, error } = await supabase
        .from("student_meal_times")
        .upsert(
          {
            student_id,
            breakfast: `${meal_times.breakfast}:00`,
            lunch: `${meal_times.lunch}:00`,
            dinner: `${meal_times.dinner}:00`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" }
        )
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
      }

      return NextResponse.json({ success: true, meal_times: data }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("[STUDENT ACTION ERROR]", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500, headers: CORS_HEADERS });
  }
}
