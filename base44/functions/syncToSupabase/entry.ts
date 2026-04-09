import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY");

async function supabaseRequest(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  return res;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;
    const eventType = event?.type;
    const entityId = event?.entity_id;

    if (!entityId) {
      return Response.json({ error: "No entity_id in payload" }, { status: 400 });
    }

    if (eventType === "delete") {
      // Delete from Supabase
      await supabaseRequest(`/hr_requests?base44_id=eq.${entityId}`, "DELETE");
      return Response.json({ success: true, action: "deleted", id: entityId });
    }

    // For create/update — upsert the record
    const record = data || payload.data;
    if (!record) {
      return Response.json({ error: "No data in payload" }, { status: 400 });
    }

    const row = {
      base44_id: record.id || entityId,
      branch: record.branch || null,
      subject: record.subject || null,
      resource_type: record.resource_type || null,
      details: record.details || null,
      requested_by: record.requested_by || null,
      email_address: record.email_address || null,
      department: record.department || null,
      purpose: record.purpose || null,
      tin: record.tin || null,
      address: record.address || null,
      bday: record.bday || null,
      employment_date: record.employment_date || null,
      compensation_summary: record.compensation_summary || null,
      amount: record.amount || null,
      reason_of_atd: record.reason_of_atd || null,
      file_url: record.file_url || null,
      completion_file_url: record.completion_file_url || null,
      status: record.status || "Pending",
      date_started: record.date_started || null,
      date_completed: record.date_completed || null,
      sla_days: record.sla_days || null,
      breach_status: record.breach_status || "Pending",
      hr_attachments: record.hr_attachments ? JSON.stringify(record.hr_attachments) : null,
      timeline: record.timeline ? JSON.stringify(record.timeline) : null,
      created_date: record.created_date || null,
      updated_date: record.updated_date || null,
      created_by: record.created_by || null,
      synced_at: new Date().toISOString(),
    };

    await supabaseRequest("/hr_requests", "POST", [row]);

    return Response.json({ success: true, action: eventType, id: entityId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});