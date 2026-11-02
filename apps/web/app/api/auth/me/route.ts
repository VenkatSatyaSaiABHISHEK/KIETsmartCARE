import { NextRequest, NextResponse } from "next/server";
import { PinAuthService, UserRole } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false, error: "Session expired: Please sign in again." },
        { status: 401 }
      );
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload) {
      const res = NextResponse.json(
        { authenticated: false, error: "Session expired: Please sign in again." },
        { status: 401 }
      );
      res.cookies.delete("kiet_session");
      res.cookies.delete("kiet_user_role");
      return res;
    }

    // Always query database live to verify status = 'active'
    const supabase = createAdminClient();
    
    // Check access_credentials
    let cred: any = null;
    try {
      const { data } = await supabase
        .from("access_credentials")
        .select("id, name, role, is_active")
        .eq("id", payload.id)
        .maybeSingle();
      cred = data;
    } catch {
      // Ignore
    }

    // Check profiles table
    let profile: any = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role, status")
        .eq("id", payload.id)
        .maybeSingle();
      profile = data;
    } catch {
      // Ignore
    }

    // If account neither exists in access_credentials nor profiles, it has been deleted
    if (!cred && !profile) {
      const res = NextResponse.json(
        { authenticated: false, error: "This account has been deleted or no longer exists. Please contact the administrator." },
        { status: 403 }
      );
      res.cookies.delete("kiet_session");
      res.cookies.delete("kiet_user_role");
      return res;
    }

    // If either record is deactivated or deleted, block immediately
    if (cred && cred.is_active === false) {
      const res = NextResponse.json(
        { authenticated: false, error: "This account is no longer active. Please contact the administrator." },
        { status: 403 }
      );
      res.cookies.delete("kiet_session");
      res.cookies.delete("kiet_user_role");
      return res;
    }

    if (profile && (profile.status === "disabled" || profile.status === "deleted" || profile.status === "suspended")) {
      const res = NextResponse.json(
        { authenticated: false, error: "This account is no longer active. Please contact the administrator." },
        { status: 403 }
      );
      res.cookies.delete("kiet_session");
      res.cookies.delete("kiet_user_role");
      return res;
    }

    // Determine canonical name, qualification, and designation
    const name = profile?.full_name || cred?.name || payload.name;
    const role: UserRole = (profile?.role || cred?.role || payload.role) as UserRole;
    
    let defaultQual = "MBBS, MD";
    let defaultDesig = "Campus Clinic OPD Doctor";
    if (role === "admin") {
      defaultQual = "System Administrator";
      defaultDesig = "Institutional Admin";
    } else if (role === "officer") {
      defaultQual = "B.Sc Nursing, MPH";
      defaultDesig = "Health Surveillance & Triage Officer";
    }

    const qualification = cred?.qualification || payload.qualification || defaultQual;
    const designation = cred?.designation || payload.designation || defaultDesig;

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: payload.id,
          name,
          role,
          qualification,
          designation,
          email: cred?.email || payload.email,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err?.message || "Failed to authenticate" },
      { status: 500 }
    );
  }
}
