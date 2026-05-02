import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BASE_ID = "appNRjLCu4uxT395V";
const TABLE_ID = "tblAOjFrCv9R6fFKq";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("AIRTABLE_API_KEY");
    let allRecords = [];
    let offset = null;

    // Fetch all records from Airtable
    do {
      const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: `Airtable error: ${err}` }, { status: res.status });
      }

      const data = await res.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);

    // Map to our schema
    const incoming = allRecords.map(r => {
      const f = r.fields;
      const firstName = (f["First Name"] || "").trim();
      const lastName = (f["Last Name"] || "").trim();
      return {
        airtable_id: r.id,
        full_name: [firstName, lastName].filter(Boolean).join(" "),
        branch: Array.isArray(f["Branch"]) ? f["Branch"].join(", ") : (f["Branch"] || ""),
        department: f["Department1"] || f["Department"] || "",
        position: f["Position"] || "",
        status: f["Status"] || "",
      };
    });

    // Fetch existing records to detect new vs updates
    const existing = await base44.asServiceRole.entities.AirtableEmployee.list("created_date", 500);
    const existingMap = {};
    for (const e of existing) {
      existingMap[e.airtable_id] = e;
    }

    const toCreate = incoming.filter(emp => !existingMap[emp.airtable_id]);
    const toUpdate = incoming.filter(emp => existingMap[emp.airtable_id]);

    // Bulk create all new records at once (no delay needed)
    if (toCreate.length > 0) {
      // Split into chunks of 50
      for (let i = 0; i < toCreate.length; i += 50) {
        await base44.asServiceRole.entities.AirtableEmployee.bulkCreate(toCreate.slice(i, i + 50));
      }
    }

    // Only update records whose data actually changed
    const changed = toUpdate.filter(emp => {
      const ex = existingMap[emp.airtable_id];
      return ex.full_name !== emp.full_name ||
        ex.branch !== emp.branch ||
        ex.department !== emp.department ||
        ex.position !== emp.position ||
        ex.status !== emp.status;
    });

    // Update changed records in parallel batches of 10
    for (let i = 0; i < changed.length; i += 10) {
      const batch = changed.slice(i, i + 10);
      await Promise.all(batch.map(emp =>
        base44.asServiceRole.entities.AirtableEmployee.update(existingMap[emp.airtable_id].id, {
          full_name: emp.full_name,
          branch: emp.branch,
          department: emp.department,
          position: emp.position,
          status: emp.status,
        })
      ));
    }

    return Response.json({
      total: incoming.length,
      created: toCreate.length,
      updated: changed.length,
      unchanged: toUpdate.length - changed.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});