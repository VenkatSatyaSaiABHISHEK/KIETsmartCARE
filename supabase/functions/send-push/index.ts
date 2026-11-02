// Supabase Edge Function: send-push
// Dispatches push notifications to student devices (via Expo Push API)
// for upcoming meal-anchored doses, reminders, and recovery checks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface PushPayload {
  to?: string | string[];
  student_id?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = (await req.json()) as PushPayload;
    let pushTokens: string[] = [];

    // If 'to' is provided directly
    if (payload.to) {
      pushTokens = Array.isArray(payload.to) ? payload.to : [payload.to];
    }

    // If student_id is provided, resolve tokens from devices table
    if (payload.student_id && pushTokens.length === 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: devices, error: deviceErr } = await supabase
        .from("devices")
        .select("expo_push_token")
        .eq("student_id", payload.student_id);

      if (deviceErr) {
        throw new Error(`Device lookup failed: ${deviceErr.message}`);
      }

      if (devices && devices.length > 0) {
        pushTokens = devices.map((d: { expo_push_token: string }) => d.expo_push_token);
      }
    }

    if (pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No registered device push tokens found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare messages for Expo Push API
    const messages = pushTokens
      .filter((token) => token && token.startsWith("ExponentPushToken["))
      .map((token) => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: "default",
        priority: "high",
        channelId: "kiet-care-reminders",
      }));

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No valid Expo push tokens found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const expoData = await expoRes.json();

    return new Response(
      JSON.stringify({ success: true, count: messages.length, result: expoData }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
