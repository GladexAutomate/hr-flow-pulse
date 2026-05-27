import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_ID = "appNRjLCu4uxT395V";
const TABLE_ID = "tblAOjFrCv9R6fFKq";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("AIRTABLE_API_KEY");

    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("pageSize", "5");
    url.searchParams.set("filterByFormula", `SEARCH("AGONIA", UPPER({Full Name}))`);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Airtable error: ${err}` }, { status: res.status });
    }

    const data = await res.json();

    const samples = (data.records || []).map(r => ({
      id: r.id,
      full_name: r.fields["Full Name"],
      first_name: r.fields["First Name"],
      last_name: r.fields["Last Name"],
      job_title: r.fields["Job Title"],
      department_role: r.fields["Department Role"],
      work_location: r.fields["Work Location"],
      department: r.fields["Department"],
      status: r.fields["Status"],
    }));

    return Response.json({ sample_records: samples });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});