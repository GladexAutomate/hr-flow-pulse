import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_ID = "appNRjLCu4uxT395V";
const TABLE_ID = "tblAOjFrCv9R6fFKq";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("AIRTABLE_API_KEY");

    // Fetch 3 sample records to see all available field names
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("pageSize", "3");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Airtable error: ${err}` }, { status: res.status });
    }

    const data = await res.json();

    // Collect all unique field names across all sample records
    const allFieldNames = new Set();
    (data.records || []).forEach(r => {
      Object.keys(r.fields).forEach(k => allFieldNames.add(k));
    });

    // Return sample records with all raw fields + the collected field list
    const samples = (data.records || []).map(r => ({
      id: r.id,
      fields: r.fields,
    }));

    return Response.json({
      all_field_names: Array.from(allFieldNames).sort(),
      sample_records: samples,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});