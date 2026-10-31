import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/admin/service";
import { adminLoginSchema, mfaVerifySchema } from "@/lib/admin/validation";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await request.json();
    const action = body.action || "login";

    if (action === "login") {
      const parsed = adminLoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const result = adminService.verifyAdminCredentials(
        parsed.data.email,
        parsed.data.password,
        ip
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }

      return NextResponse.json({
        mfa_required: true,
        temp_token: result.tempToken,
        message: "Credentials verified. Please input 6-digit TOTP authenticator code.",
      });
    }

    if (action === "verify_mfa") {
      const parsed = mfaVerifySchema.safeParse({ code: body.code });
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const tempToken = body.temp_token || "mfa_temp_session";
      const result = adminService.verifyMfaCode(tempToken, parsed.data.code, ip);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }

      // Set cookie kiet_user_role=admin
      const response = NextResponse.json({
        success: true,
        role: "admin",
        redirect_url: "/admin",
      });

      response.cookies.set("kiet_user_role", "admin", {
        path: "/",
        httpOnly: false, // accessible to client for mock role state
        sameSite: "lax",
        maxAge: 60 * 60 * 12, // 12 hours
      });

      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true, redirect_url: "/admin/login" });
      response.cookies.delete("kiet_user_role");
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
