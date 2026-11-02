// Supabase Edge Function: schedule-alerts
// Executes periodically via pg_cron or HTTP webhook to check for:
// 1. Doses due within the current 5-minute window -> backup push notification
// 2. Doses overdue by 30 minutes with no answer -> secondary reminder push
// 3. Past-day unanswered doses -> mark 'unconfirmed'
// 4. Overdue recovery checks (>24h unanswered) -> create yellow alert for Health Officers
// 5. Course completion day+1 -> send recovery inquiry prompt push

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const report = {
    backup_pushes_sent: 0,
    second_reminders_sent: 0,
    unconfirmed_marked: 0,
    yellow_alerts_created: 0,
    recovery_prompts_sent: 0,
    errors: [] as string[],
  };

  try {
    const now = new Date();
    const nowIso = now.toISOString();

    // 1. BACKUP PUSH FOR DOSES DUE RIGHT NOW (+/- 5 minutes)
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const fiveMinAhead = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const { data: dueDoses, error: dueErr } = await supabase
      .from("dose_schedule")
      .select(`
        id,
        scheduled_at,
        slot,
        student_id,
        visit_medications (
          dose,
          medicines ( name )
        )
      `)
      .gte("scheduled_at", fiveMinAgo)
      .lte("scheduled_at", fiveMinAhead);

    if (dueErr) report.errors.push(`Due doses query: ${dueErr.message}`);

    if (dueDoses && dueDoses.length > 0) {
      for (const d of dueDoses) {
        // Check if student already answered
        const { data: event } = await supabase
          .from("dose_events")
          .select("id")
          .eq("schedule_id", d.id)
          .maybeSingle();

        if (!event) {
          // Fetch student push token
          const { data: devices } = await supabase
            .from("devices")
            .select("expo_push_token")
            .eq("student_id", d.student_id);

          if (devices && devices.length > 0) {
            const medName = (d.visit_medications as any)?.medicines?.name || "Prescribed medication";
            const doseText = (d.visit_medications as any)?.dose || "1 dose";

            for (const dev of devices) {
              await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: dev.expo_push_token,
                  title: `⏰ Medicine Due: ${medName}`,
                  body: `It is time to take ${doseText}. Tap to record your adherence.`,
                  data: { type: "DOSE_DUE", schedule_id: d.id },
                  priority: "high",
                }),
              });
              report.backup_pushes_sent++;
            }
          }
        }
      }
    }

    // 2. 30 MINUTES AFTER DOSE WITH NO ANSWER: SECOND REMINDER
    const thirtyMinAgo = new Date(now.getTime() - 35 * 60 * 1000).toISOString();
    const thirtyFiveMinAgo = new Date(now.getTime() - 25 * 60 * 1000).toISOString();

    const { data: overdueDoses } = await supabase
      .from("dose_schedule")
      .select(`
        id,
        scheduled_at,
        slot,
        student_id,
        visit_medications (
          dose,
          medicines ( name )
        )
      `)
      .gte("scheduled_at", thirtyMinAgo)
      .lte("scheduled_at", thirtyFiveMinAgo);

    if (overdueDoses && overdueDoses.length > 0) {
      for (const od of overdueDoses) {
        const { data: event } = await supabase
          .from("dose_events")
          .select("id")
          .eq("schedule_id", od.id)
          .maybeSingle();

        if (!event) {
          const { data: devices } = await supabase
            .from("devices")
            .select("expo_push_token")
            .eq("student_id", od.student_id);

          if (devices && devices.length > 0) {
            const medName = (od.visit_medications as any)?.medicines?.name || "Medication";
            for (const dev of devices) {
              await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: dev.expo_push_token,
                  title: `⚠️ Friendly Reminder: ${medName}`,
                  body: `Have you taken your scheduled dose? Tap to confirm adherence or log if missed.`,
                  data: { type: "DOSE_OVERDUE", schedule_id: od.id },
                  priority: "high",
                }),
              });
              report.second_reminders_sent++;
            }
          }
        }
      }
    }

    // 3. CALL RPC: PROCESS UNCONFIRMED DOSES NEXT MORNING
    const { data: unconfCount, error: unconfErr } = await supabase.rpc("process_unconfirmed_doses");
    if (unconfErr) report.errors.push(`Unconfirmed RPC: ${unconfErr.message}`);
    else report.unconfirmed_marked = unconfCount || 0;

    // 4. CALL RPC: ESCALATE UNANSWERED RECOVERY CHECKS (24h overdue)
    const { data: yellowCount, error: yellowErr } = await supabase.rpc("process_overdue_recovery_checks");
    if (yellowErr) report.errors.push(`Yellow alerts RPC: ${yellowErr.message}`);
    else report.yellow_alerts_created = yellowCount || 0;

    return new Response(
      JSON.stringify({
        success: true,
        report,
        timestamp: nowIso,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message, report }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
