import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { differenceInDays, parseISO } from 'npm:date-fns@3.6.0';

// Single source of truth for SLA day-counts.
// Keep this in sync with src/lib/sla.js (BASE_SLA / RESOURCE_SLA) and
// base44/functions/generateDailyHRReport/entry.ts.
const RESOURCE_SLA = { "Rank and File": 15, "Supervisory": 20, "Managerial": 30 };
const BASE_SLA = {
  "NTE Request": 8,
  "General Announcement Request": 2,
  "WFH Request": 2,
  "COE (Certificate of Employment)": 2,
  "ITR (Income Tax Return)": 7,
  "LAST PAY": 30,
  "ATD (Authority to Deduct)": 7,
  "Others": 7,
};

function getSLA(req) {
  if (req.subject === "Resource Request") return RESOURCE_SLA[req.resource_type] || req.sla_days || 15;
  return BASE_SLA[req.subject] || req.sla_days || 7;
}

// Mirrors computeBreach() in src/lib/sla.js exactly.
function computeBreach(request) {
  if (request.status === "Waived/Cancelled") return "Waived";
  // A request with a completion date is finished — evaluate completion timing even
  // if its status was never flipped to "Completed". Mirrors src/lib/sla.js.
  if (request.status === "Completed" || request.date_completed) {
    if (!request.date_started || !request.date_completed) return "Pending";
    const days = differenceInDays(parseISO(request.date_completed), parseISO(request.date_started));
    const sla = getSLA(request);
    return days <= sla ? "Valid" : "Breached";
  }
  // Still pending/in-progress — breached the moment it ages past its SLA window.
  if (request.created_date) {
    const daysSinceCreated = differenceInDays(new Date(), new Date(request.created_date));
    const sla = getSLA(request);
    if (daysSinceCreated > sla) return "Breached";
  }
  return "Pending";
}

// Nightly job: re-derive breach_status for every request so the stored field
// stays accurate as open requests age past their SLA. Without this, breach_status
// is only written on manual save and goes stale — which is what made the Reports
// dashboard under-count breaches versus the live Daily HR Tracker Report.
//
// Wire this to a daily cron trigger in the base44 dashboard. It is idempotent:
// it only writes records whose computed status differs from what is stored.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const all = await base44.asServiceRole.entities.HRRequest.list("-created_date", 5000);

    let updated = 0;
    const changes = [];
    for (const r of all) {
      // The breach_status enum only stores Valid/Breached/Pending. Waived/Cancelled
      // requests are excluded from SLA reporting, so leave their field untouched.
      if (r.status === "Waived/Cancelled") continue;

      const next = computeBreach(r);
      if (next !== r.breach_status) {
        await base44.asServiceRole.entities.HRRequest.update(r.id, { breach_status: next });
        updated++;
        if (changes.length < 200) changes.push({ id: r.id, subject: r.subject, from: r.breach_status || null, to: next });
      }
    }

    return Response.json({
      success: true,
      scanned: all.length,
      updated,
      changes,
      ran_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
