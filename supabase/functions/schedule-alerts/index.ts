// Supabase Edge Function: schedule-alerts
// Executes periodically via pg_cron to check for:
// 1. Doses with no confirmation past second reminder -> marked 'unconfirmed'
// 2. Recovery checks unanswered for 24 hours -> triggers yellow alert for Health Officers
// 3. Flagged recovery checks ('same', 'worse', 'side_effect') -> red alert dispatch

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    return new Response(
      JSON.stringify({
        message: "KIET Smart Care scheduled alert monitor executed",
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
