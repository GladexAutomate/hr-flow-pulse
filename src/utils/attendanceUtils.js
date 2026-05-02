export function generatePeriods(startYear, endYear) {
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const periods = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const mid = 15;
      periods.push({
        label: `${months[m]} 1 - ${mid}, ${y}`,
        start: `${y}-${String(m+1).padStart(2,'0')}-01`,
        end: `${y}-${String(m+1).padStart(2,'0')}-${mid}`,
      });
      periods.push({
        label: `${months[m]} ${mid+1} - ${lastDay}, ${y}`,
        start: `${y}-${String(m+1).padStart(2,'0')}-${mid+1}`,
        end: `${y}-${String(m+1).padStart(2,'0')}-${lastDay}`,
      });
    }
  }
  return periods;
}

export function getDatesInRange(start, end) {
  const dates = [];
  const cur = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  while (cur <= endD) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export const SHIFT_TYPES = [
  { key: "Opener", label: "Opener", color: "#3b82f6", text: "#fff" },
  { key: "Mid", label: "Mid", color: "#22c55e", text: "#fff" },
  { key: "Closer", label: "Closer", color: "#f97316", text: "#fff" },
  { key: "Night", label: "Night", color: "#6b7280", text: "#fff" },
  { key: "OFF", label: "OFF", color: "#ef4444", text: "#fff" },
  { key: "VL", label: "VL", color: "#ef4444", text: "#fff" },
  { key: "Custom", label: "Custom", color: "#14b8a6", text: "#fff" },
  { key: "NoSched", label: "No Sched", color: "#f3f4f6", text: "#374151" },
];

export function getShift(key) {
  return SHIFT_TYPES.find(s => s.key === key) || SHIFT_TYPES[SHIFT_TYPES.length - 1];
}

export const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function dayOfWeek(dateStr) {
  return DAYS[new Date(dateStr + "T00:00:00").getDay()];
}

export function generateApprovedAttendanceHtml({ proposal, schedule }) {
  const dates = getDatesInRange(proposal.period_start, proposal.period_end);
  const headerCells = dates.map(d => `<th style="padding:8px 6px;border:1px solid #e5e7eb;background:#1e3a5f;color:#fff;font-size:11px;white-space:nowrap;text-align:center">${d.slice(5)}<br/><span style="font-size:10px;opacity:.8">${dayOfWeek(d)}</span></th>`).join("");
  const rows = proposal.employees.map(emp => {
    const cells = dates.map(d => {
      const cell = (schedule[emp.id] || {})[d] || {};
      const shift = getShift(cell.shift);
      const label = cell.shift === "Custom" ? (cell.customLabel || "Custom") : (shift.label || "—");
      const wfh = cell.wfh ? `<br/><span style="font-size:9px;background:#e0f2fe;color:#0284c7;padding:1px 4px;border-radius:4px">${cell.wfh}</span>` : "";
      return `<td style="padding:6px;border:1px solid #e5e7eb;background:${shift.color};color:${shift.text};text-align:center;font-size:11px;min-width:60px">${label}${cell.customTime ? `<br/><span style="font-size:9px">${cell.customTime}</span>` : ""}${wfh}</td>`;
    }).join("");
    return `<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;font-size:12px;white-space:nowrap">${emp.name}${emp.position ? `<br/><span style="font-weight:400;color:#6b7280;font-size:10px">${emp.position}</span>` : ""}</td>${cells}</tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Approved Attendance</title></head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f9fafb">
<div style="max-width:900px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#1e3a5f;color:#fff;padding:24px 32px">
    <h1 style="margin:0;font-size:20px">APPROVED ATTENDANCE PROPOSAL</h1>
    <p style="margin:4px 0 0;opacity:.8;font-size:13px">${proposal.team_name} — ${proposal.period_label}</p>
  </div>
  <div style="padding:20px 32px;background:#f1f5f9;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
    <div><b>Company:</b> ${proposal.company_name}</div>
    <div><b>Branch:</b> ${proposal.branch_name}</div>
    <div><b>Department:</b> ${proposal.department_name}</div>
    <div><b>Team:</b> ${proposal.team_name}</div>
    <div><b>Leader:</b> ${proposal.leader_name}</div>
    <div><b>Period:</b> ${proposal.period_label}</div>
  </div>
  <div style="padding:20px 32px;overflow-x:auto">
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">
      <thead><tr><th style="padding:8px 10px;border:1px solid #e5e7eb;background:#1e3a5f;color:#fff;font-size:12px;text-align:left;min-width:120px">Employee</th>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  ${proposal.remarks ? `<div style="padding:16px 32px;background:#fefce8;border-top:1px solid #fde68a"><b style="font-size:13px">Remarks:</b><p style="margin:4px 0 0;font-size:13px;color:#374151">${proposal.remarks}</p></div>` : ""}
  <div style="padding:12px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:right">Generated on ${new Date().toLocaleString()}</div>
</div></body></html>`;
}

export function generateRejectedAttendanceHtml({ proposal, schedule, rejectionNote }) {
  const dates = getDatesInRange(proposal.period_start, proposal.period_end);
  const headerCells = dates.map(d => `<th style="padding:8px 6px;border:1px solid #e5e7eb;background:#7f1d1d;color:#fff;font-size:11px;white-space:nowrap;text-align:center">${d.slice(5)}<br/><span style="font-size:10px;opacity:.8">${dayOfWeek(d)}</span></th>`).join("");
  const rows = proposal.employees.map(emp => {
    const cells = dates.map(d => {
      const cell = (schedule[emp.id] || {})[d] || {};
      const shift = getShift(cell.shift);
      const label = cell.shift === "Custom" ? (cell.customLabel || "Custom") : (shift.label || "—");
      return `<td style="padding:6px;border:1px solid #e5e7eb;background:${shift.color};color:${shift.text};text-align:center;font-size:11px;min-width:60px">${label}${cell.customTime ? `<br/><span style="font-size:9px">${cell.customTime}</span>` : ""}</td>`;
    }).join("");
    return `<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;font-size:12px;white-space:nowrap">${emp.name}</td>${cells}</tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rejected Attendance</title></head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f9fafb">
<div style="max-width:900px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <div style="background:#7f1d1d;color:#fff;padding:24px 32px">
    <h1 style="margin:0;font-size:20px">REJECTED ATTENDANCE PROPOSAL</h1>
    <p style="margin:4px 0 0;opacity:.8;font-size:13px">${proposal.team_name} — ${proposal.period_label}</p>
  </div>
  <div style="padding:16px 32px;background:#fee2e2;border-bottom:1px solid #fca5a5">
    <b style="font-size:13px;color:#7f1d1d">Rejection Note:</b>
    <p style="margin:4px 0 0;font-size:13px;color:#374151">${rejectionNote}</p>
  </div>
  <div style="padding:20px 32px;overflow-x:auto">
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">
      <thead><tr><th style="padding:8px 10px;border:1px solid #e5e7eb;background:#7f1d1d;color:#fff;font-size:12px;text-align:left;min-width:120px">Employee</th>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  ${proposal.remarks ? `<div style="padding:16px 32px;background:#fefce8;border-top:1px solid #fde68a"><b style="font-size:13px">Remarks:</b><p style="margin:4px 0 0;font-size:13px;color:#374151">${proposal.remarks}</p></div>` : ""}
</div></body></html>`;
}