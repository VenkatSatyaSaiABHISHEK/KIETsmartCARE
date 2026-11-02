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

    const supabase = createAdminClient();
    const { data: medicines, error } = await supabase
      .from("medicines")
      .select("id, name, default_form, active")
      .eq("active", true)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medicines: medicines || [] });
  } catch (err: any) {
    console.error("GET /api/doctor/medicines error:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

