import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_ID = "appNRjLCu4uxT395V";
const TABLE_ID = "tblAOjFrCv9R6fFKq";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("AIRTABLE_API_KEY");

    // Get a sample record with all fields
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("pageSize", "2");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Airtable error: ${err}` }, { status: res.status });
    }

    const data = await res.json();

    // Collect ALL field names across all records
    const allFields = new Set();
    (data.records || []).forEach(r => {
      Object.keys(r.fields).forEach(k => allFields.add(k));
    });

    // Show full raw records
    const records = (data.records || []).map(r => ({
      id: r.id,
      fields: r.fields,
    }));

    return Response.json({
      total_fields: allFields.size,
      all_field_names: Array.from(allFields).sort(),
      sample_records: records,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});