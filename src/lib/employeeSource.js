// Employee roster source.
//
// Previously the AT Employees page read from base44's AirtableEmployee entity
// (populated by the fetchAirtableEmployees function). It now reads directly from
// Supabase — the `airtableemployeerecord` table, which mirrors the Airtable HR
// roster. The key below is a Supabase *publishable* (anon) key, which is safe to
// ship in client code; override via env vars if the project/keys change.
const SUPABASE_URL = import.meta.env.VITE_EMPLOYEE_SUPABASE_URL || "https://wuymgnqpkgxxxghvgcbq.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_EMPLOYEE_SUPABASE_KEY || "sb_publishable_R5jGhsaREPJ427X1bRnpog_Iz7odR95";
const TABLE = "airtableemployeerecord";

// Flatten one Supabase row into the shape the table renders.
// Fields can live either at data.* or inside the nested data.fields.* Airtable blob,
// so we fall back across both.
function mapRow(row) {
  const d = row.data || {};
  const f = d.fields || {};
  const fullName =
    d.full_name ||
    f["Full Name"] ||
    [f["First Name"], f["Last Name"]].filter(Boolean).join(" ").trim();

  return {
    id: row.id || d.id,
    full_name: fullName || "",
    branch: d.branch || f["Branch"] || "",
    department: d.department || f["Department"] || "",
    position: f["Job Title"] || d.department_role || "",
    status: (f["Status"] || d.status || "").toUpperCase(),
    employee_code: d.employee_code || f["Employee Code ID"] || "",
  };
}

export async function fetchEmployeesFromSupabase() {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=id,data&limit=2000`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
  }
  const rows = await res.json();
  return rows
    .map(mapRow)
    .filter((e) => e.full_name) // skip placeholder rows with no name
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}
