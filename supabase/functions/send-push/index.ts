// Supabase Edge Function: send-push
// Dispatches push notifications to student devices (via Expo Push API)
// for upcoming meal-anchored doses, reminders, and recovery checks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface PushPayload {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  try {
    const { to, title, body, data } = (await req.json()) as PushPayload;

    if (!to || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required push notification fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Expo push service endpoint
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        title,
        body,
        data,
        sound: "default",
        priority: "high",
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
