import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session expired. Please sign in as a doctor or admin." },
        { status: 401 }
      );
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload || (payload.role !== "doctor" && payload.role !== "admin")) {
      return NextResponse.json(
        { error: "Doctor role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rollNumber, minutesOffset = 2, customTime, tabletLabel = "Tablet 1" } = body;

    const cleanRoll = rollNumber?.trim();
    if (!cleanRoll) {
      return NextResponse.json(
        { error: "Please provide a valid student roll number." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Find student
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id, roll_number, name, branch, year, phone")
      .ilike("roll_number", cleanRoll)
      .eq("status", "active")
      .maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json(
        { error: `No student found with roll number "${cleanRoll}".` },
        { status: 404 }
      );
    }

    // 2. Resolve Doctor ID
    let doctorId = payload.id;
    const { data: docProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", doctorId)
      .maybeSingle();

    if (!docProfile) {
      const { data: fallbackDoctor } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "doctor")
        .limit(1)
        .maybeSingle();

      if (fallbackDoctor) {
        doctorId = fallbackDoctor.id;
      }
    }

    // 3. Compute target alarm timestamp (Precise Asia/Kolkata alignment)
    const now = new Date();
    let targetDate: Date;

    if (customTime && customTime.includes(":")) {
      const [h, m] = customTime.split(":").map(Number);
      targetDate = new Date();
      targetDate.setHours(h, m, 0, 0);
      // If time selected was already in the past, schedule for tomorrow at that time
      if (targetDate.getTime() <= now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else {
      const offsetMinutes = Math.max(1, Number(minutesOffset) || 2);
      targetDate = new Date(now.getTime() + offsetMinutes * 60 * 1000);
    }

    const scheduledIso = targetDate.toISOString();
    const currentHour = targetDate.getHours();
    const slot =
      currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : currentHour < 21 ? "evening" : "night";

    // 4. Create or reuse an active test visit
    const { data: existingVisit } = await supabase
      .from("visits")
      .select("id")
      .eq("student_id", student.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let visitId = existingVisit?.id;

    if (!visitId) {
      const { data: newVisit, error: visitErr } = await supabase
        .from("visits")
        .insert({
          student_id: student.id,
          doctor_id: doctorId,
          visit_date: now.toISOString(),
          status: "active",
          problem_category: "Diagnostic Alarm Test",
        })
        .select("id")
        .single();

      if (visitErr) {
        console.error("Visit insert error:", visitErr);
        return NextResponse.json({ error: visitErr.message }, { status: 500 });
      }
      visitId = newVisit.id;
    }

    // 5. Create visit medication
    const { data: visitMed, error: medErr } = await supabase
      .from("visit_medications")
      .insert({
        visit_id: visitId,
        label: tabletLabel,
        dose: "1 tablet",
        days: 1,
        meal_relation: "after",
        times_per_day: 1,
      })
      .select("id")
      .single();

    if (medErr) {
      console.error("Visit medication error:", medErr);
      return NextResponse.json({ error: medErr.message }, { status: 500 });
    }

    // 6. Insert dose schedule trigger
    const { data: scheduledDose, error: schedErr } = await supabase
      .from("dose_schedule")
      .insert({
        visit_medication_id: visitMed.id,
        student_id: student.id,
        scheduled_at: scheduledIso,
        slot,
        tablets: 1,
        meal_relation: "after",
        group_key: `test_${Date.now()}`,
      })
      .select("id, scheduled_at, slot")
      .single();

    if (schedErr) {
      console.error("Schedule error:", schedErr);
      return NextResponse.json({ error: schedErr.message }, { status: 500 });
    }

    const scheduledTimeIST = targetDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return NextResponse.json({
      success: true,
      message: `Alarm scheduled for ${student.name} (${student.roll_number}) at ${scheduledTimeIST}!`,
      dose: scheduledDose,
      student,
      scheduledTimeIST,
      minutesFromNow: Math.round((targetDate.getTime() - now.getTime()) / 60000),
    });
  } catch (error: any) {
    console.error("Test dose error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to schedule test dose" },
      { status: 500 }
    );
  }
}
