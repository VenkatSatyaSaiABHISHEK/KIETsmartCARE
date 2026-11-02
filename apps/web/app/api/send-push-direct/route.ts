import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { student_id, title, body, data } = await request.json();

    if (!student_id || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Fetch registered push tokens for student
    const { data: devices, error: devErr } = await supabaseAdmin
      .from("devices")
      .select("expo_push_token")
      .eq("student_id", student_id);

    if (devErr) {
      return NextResponse.json({ error: devErr.message }, { status: 500 });
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json({ success: true, message: "No registered push tokens found" });
    }

    const tokens = devices
      .map((d: any) => d.expo_push_token)
      .filter((t: string) => t && t.startsWith("ExponentPushToken["));

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: "No valid Expo push tokens found" });
    }

    // Call Expo Push API
    const messages = tokens.map((to: string) => ({
      to,
      title,
      body,
      data: data || {},
      sound: "default",
      priority: "high",
    }));

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const expoResult = await expoRes.json();
    return NextResponse.json({ success: true, count: tokens.length, result: expoResult });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to dispatch push" }, { status: 500 });
  }
}
