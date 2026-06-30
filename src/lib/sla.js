import { differenceInDays, parseISO } from "date-fns";

// Single source of truth for SLA day-counts.
// Keep this in sync with base44/functions/generateDailyHRReport/entry.ts (SLA_MAP).
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

export function getSLA(req) {
  if (req.subject === "Resource Request") return RESOURCE_SLA[req.resource_type] || req.sla_days || 15;
  return BASE_SLA[req.subject] || req.sla_days || 7;
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
  // Still pending/in-progress — breached the moment it ages past its SLA window,
  // even if no one has re-saved the record since.
  if (request.created_date) {
    const daysSinceCreated = differenceInDays(new Date(), new Date(request.created_date));
    const sla = getSLA(request);
    if (daysSinceCreated > sla) return "Breached";
  }
  return "Pending";
}
