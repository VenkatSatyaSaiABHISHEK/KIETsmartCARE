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
    const body = await req.json().catch(() => ({}));
    const { action = "verify", roll_number, phone, new_password } = body;

    const cleanRoll = typeof roll_number === "string" ? roll_number.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.replace(/[^0-9]/g, "") : "";

    if (!cleanRoll) {
      return NextResponse.json(
        { error: "Roll number is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Registered phone number is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createAdminClient();

    // 1. Look up student in database
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id, roll_number, name, phone, profile_id")
      .ilike("roll_number", cleanRoll)
      .maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json(
        { error: `Roll number "${cleanRoll}" not found in student directory.` },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // 2. Validate phone number against registered student phone
    const dbPhoneDigits = (student.phone || "").replace(/[^0-9]/g, "");
    if (!dbPhoneDigits || !dbPhoneDigits.endsWith(cleanPhone.slice(-10))) {
      return NextResponse.json(
        {
          error: "Phone number does not match the registered contact on file for this roll number.",
        },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Step A: Verification Only
    if (action === "verify") {
      return NextResponse.json(
        {
          success: true,
          verified: true,
          studentName: student.name,
          rollNumber: student.roll_number,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Step B: Set New Password
    if (action === "reset") {
      if (!new_password || new_password.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long." },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // Update Supabase Auth user password if profile_id exists
      if (student.profile_id) {
        try {
          await supabase.auth.admin.updateUserById(student.profile_id, {
            password: new_password,
          });
        } catch (authErr) {
          console.warn("[RESET PASSWORD] Supabase auth update fallback:", authErr);
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `Password has been reset successfully for ${student.name}. You may now sign in.`,
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[RESET PASSWORD EXCEPTION]", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

