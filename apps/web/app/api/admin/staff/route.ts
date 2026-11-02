import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { PinAuthService } from "@/lib/auth/pin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: staff, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, phone, email, qualification, designation, status, created_at")
      .in("role", ["doctor", "officer"])
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ staff: staff || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { role, name, email, phone, pin, qualification, designation } = body;

    // Validations
    if (!role || (role !== "doctor" && role !== "officer")) {
      return NextResponse.json({ error: "Role must be 'doctor' or 'officer'" }, { status: 400 });
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Staff full name is required" }, { status: 400 });
    }
    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: "Phone number must be exactly 10 digits" }, { status: 400 });
    }
    const cleanPin = (pin || "").trim();
    if (!/^\d{5}$/.test(cleanPin)) {
      return NextResponse.json({ error: "PIN must be exactly 5 numeric digits (e.g. 12345)" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Create or resolve user in auth.users
    const staffEmail = email?.trim() || `${role}.${cleanPhone}@kiet.edu`;
    let authUserId: string | null = null;

    try {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: staffEmail,
        password: `StaffPIN${cleanPin}!`,
        email_confirm: true,
        user_metadata: {
          role,
          full_name: name.trim(),
        },
      });

      if (authUser?.user) {
        authUserId = authUser.user.id;
      } else if (authErr) {
        const { data: userList } = await supabase.auth.admin.listUsers();
        const match = userList?.users?.find((u) => u.email === staffEmail);
        if (match) authUserId = match.id;
      }
    } catch (authException) {
      console.warn("[STAFF CREATION AUTH NOTICE]", authException);
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Failed to create staff authentication identity" }, { status: 500 });
    }

    // 2. Insert into profiles table
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .upsert({
        id: authUserId,
        role,
        full_name: name.trim(),
        phone: cleanPhone,
        email: staffEmail,
        qualification: qualification?.trim() || (role === "doctor" ? "MBBS, MD" : "B.Sc Nursing"),
        designation: designation?.trim() || (role === "doctor" ? "Campus Clinic OPD Doctor" : "Health Surveillance Officer"),
        status: "active",
      }, { onConflict: "id" })
      .select("id, full_name, role, phone, email, qualification, designation, status")
      .single();

    if (profErr || !profile) {
      console.error("[CREATE STAFF PROFILE ERROR]", profErr);
      return NextResponse.json({ error: profErr?.message || "Failed to create staff profile" }, { status: 500 });
    }

    // 3. Hash PIN and save into access_credentials table
    const pinHash = bcrypt.hashSync(cleanPin, 10);
    const { error: credErr } = await supabase
      .from("access_credentials")
      .upsert({
        id: profile.id,
        role,
        name: profile.full_name,
        pin_hash: pinHash,
        pin_length: 5,
        is_active: true,
        status: "active",
        email: profile.email,
        qualification: profile.qualification,
        designation: profile.designation,
      }, { onConflict: "id" });

    if (credErr) {
      console.error("[CREATE STAFF CREDENTIAL ERROR]", credErr);
      return NextResponse.json({ error: credErr?.message || "Failed to save login credentials" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${role.toUpperCase()} account provisioned successfully with PIN: ${cleanPin}`,
      staff: {
        id: profile.id,
        name: profile.full_name,
        role: profile.role,
        phone: profile.phone,
        email: profile.email,
        pin: cleanPin,
      },
    });
  } catch (error: any) {
    console.error("[CREATE STAFF EXCEPTION]", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
