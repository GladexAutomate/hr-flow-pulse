import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Company IDs
const COMPANY_MAP = {
  GLADEX: "69f57ba77930e0b447d69440",   // Gladex Travel and Tours Corp.
  POTB:   "69f57bb27930e0b447d6944b",   // Pinoy Online Travel Biz
  KLIKK:  "69f58bf8c940d838687a62a2",   // Klikk Travel Express
};

function getCompanyId(branch) {
  if (!branch) return COMPANY_MAP.GLADEX;
  const b = branch.toUpperCase();
  if (b === "POTB") return COMPANY_MAP.POTB;
  if (b === "KLIKK") return COMPANY_MAP.KLIKK;
  return COMPANY_MAP.GLADEX; // everything else = Gladex
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all employees in pages
    let employees = [];
    let page = 0;
    const pageSize = 100;
    while (true) {
      const batch = await base44.asServiceRole.entities.AirtableEmployee.list("created_date", pageSize, page * pageSize);
      employees = employees.concat(batch);
      if (batch.length < pageSize) break;
      page++;
    }

    let updated = 0;
    let skipped = 0;

    // Process in batches of 5 with a small delay to avoid rate limits
    for (let i = 0; i < employees.length; i += 3) {
      const batch = employees.slice(i, i + 3);
      await Promise.all(batch.map(emp => {
        const correctCompanyId = getCompanyId(emp.branch);
        if (emp.org_company_id === correctCompanyId) {
          skipped++;
          return Promise.resolve();
        }
        updated++;
        return base44.asServiceRole.entities.AirtableEmployee.update(emp.id, {
          org_company_id: correctCompanyId,
        });
      }));
      // pause between batches to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    return Response.json({ total: employees.length, updated, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});