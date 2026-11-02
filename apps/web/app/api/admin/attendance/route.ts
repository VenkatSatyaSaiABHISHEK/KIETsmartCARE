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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access: Administrator role required." },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Query non-clinical fields only (attendance records)
    const { data: visits, error } = await supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        students ( roll_number, name, branch, year ),
        profiles:doctor_id ( full_name )
      `)
      .order("visit_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const records = (visits || []).map((v: any) => {
      const d = new Date(v.visit_date);
      return {
        id: v.id,
        date: v.visit_date ? v.visit_date.slice(0, 10) : "",
        time: !isNaN(d.getTime())
          ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : "",
        roll_number: v.students?.roll_number || "N/A",
        student_name: v.students?.name || "Student",
        branch: v.students?.branch || "N/A",
        year: v.students?.year || 1,
        doctor_name: v.profiles?.full_name || "Campus Clinic Doctor",
      };
    });

    return NextResponse.json(
      { success: true, records },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

