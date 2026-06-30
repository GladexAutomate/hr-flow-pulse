import { differenceInDays, parseISO } from "date-fns";

export const SLA_SETTINGS_KEY = "sla_settings";

// Factory defaults. Also the fallback when no custom SLA settings are saved and
// for legacy records that never had sla_days stamped. These constants never change
// at runtime — editable overrides are stored in AppSettings under SLA_SETTINGS_KEY
// and only affect NEW requests.
// Keep in sync with base44/functions/{submitHRRequest,generateDailyHRReport,recomputeBreachStatus}.
export const RESOURCE_SLA = { "Rank and File": 15, "Supervisory": 20, "Managerial": 30 };
export const BASE_SLA = {
  "NTE Request": 8,
  "General Announcement Request": 2,
  "WFH Request": 2,
  "COE (Certificate of Employment)": 2,
  "ITR (Income Tax Return)": 7,
  "LAST PAY": 30,
  "ATD (Authority to Deduct)": 7,
  "Others": 7,
};

// Ordered subjects for rendering the SLA settings form.
export const SLA_SUBJECTS = [
  "NTE Request",
  "Resource Request",
  "General Announcement Request",
  "WFH Request",
  "COE (Certificate of Employment)",
  "ITR (Income Tax Return)",
  "LAST PAY",
  "ATD (Authority to Deduct)",
  "Others",
];
export const RESOURCE_TIERS = ["Rank and File", "Supervisory", "Managerial"];

// The default settings object (Resource Request carries a per-tier sub-object).
export function defaultSlaSettings() {
  const s = {};
  for (const subj of SLA_SUBJECTS) {
    s[subj] = subj === "Resource Request" ? { ...RESOURCE_SLA } : BASE_SLA[subj];
  }
  return s;
}

// Parse the stored AppSettings value into a complete settings object, tolerating
// missing keys (merged over defaults) and malformed JSON.
export function parseSlaSettings(raw) {
  const def = defaultSlaSettings();
  if (!raw) return def;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const merged = { ...def, ...parsed };
    merged["Resource Request"] = { ...def["Resource Request"], ...(parsed["Resource Request"] || {}) };
    return merged;
  } catch {
    return def;
  }
}

// SLA (in days) to stamp on a NEW request given the current settings.
export function slaForNewRequest(settings, subject, resourceType) {
  const s = settings || defaultSlaSettings();
  if (subject === "Resource Request") {
    return (s["Resource Request"] && s["Resource Request"][resourceType]) || RESOURCE_SLA[resourceType] || 15;
  }
  return s[subject] || BASE_SLA[subject] || 7;
}

// SLA used for BREACH evaluation of an EXISTING record. Prefers the record's own
// frozen sla_days (stamped at creation) so that changing SLA settings never alters
// existing records' breach status; falls back to factory defaults for legacy rows.
export function getSLA(req) {
  if (req.sla_days) return req.sla_days;
  if (req.subject === "Resource Request") return RESOURCE_SLA[req.resource_type] || 15;
  return BASE_SLA[req.subject] || 7;
}

// Live breach evaluation — always reflects the current state of the record,
// not a snapshot persisted at the last manual save. Use this for all reporting
// so completed-late AND still-open-overdue requests are both counted.
//
// Returns one of: "Waived" | "Valid" | "Breached" | "Pending"
export function computeBreach(request) {
  if (request.status === "Waived/Cancelled") return "Waived";
  // A request that has a completion date is finished — evaluate it on completion
  // timing even if its status was never flipped to "Completed" (the data can be
  // inconsistent: some records carry date_completed while still "In Progress").
  // Without this, such records fall through to the open-aging branch below and
  // get falsely flagged as breached based on created_date.
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
