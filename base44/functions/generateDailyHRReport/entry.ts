import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SLA_MAP = {
  "NTE Request": 8,
  "Resource Request": 15,
  "General Announcement Request": 3,
  "WFH Request": 2,
  "COE (Certificate of Employment)": 5,
  "ITR (Income Tax Return)": 7,
  "LAST PAY": 30,
  "ATD (Authority to Deduct)": 5,
  "Others": 7,
};

function getSLA(req) {
  return req.sla_days || SLA_MAP[req.subject] || 7;
}

function getDaysElapsed(dateStr) {
  const submitted = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
}

function buildReportHtml(grouped, reportDate, totalCount) {
  const subjectColors = {
    "NTE Request": "#ef4444",
    "Resource Request": "#3b82f6",
    "General Announcement Request": "#8b5cf6",
    "WFH Request": "#06b6d4",
    "COE (Certificate of Employment)": "#10b981",
    "ITR (Income Tax Return)": "#f59e0b",
    "LAST PAY": "#f97316",
    "ATD (Authority to Deduct)": "#ec4899",
    "Others": "#6b7280",
  };

  let categorySections = "";

  for (const [subject, requests] of Object.entries(grouped)) {
    const color = subjectColors[subject] || "#6b7280";
    const sortedRequests = [...requests].sort((a, b) => {
      const aElapsed = getDaysElapsed(a.created_date);
      const bElapsed = getDaysElapsed(b.created_date);
      const aSLA = getSLA(a);
      const bSLA = getSLA(b);
      const aRemainingPct = (aSLA - aElapsed) / aSLA;
      const bRemainingPct = (bSLA - bElapsed) / bSLA;
      return aRemainingPct - bRemainingPct; // most urgent first
    });

    let rows = "";
    sortedRequests.forEach((req, i) => {
      const sla = getSLA(req);
      const elapsed = getDaysElapsed(req.created_date);
      const remaining = sla - elapsed;
      const pct = Math.min(100, Math.round((elapsed / sla) * 100));
      const isBreached = remaining < 0;
      const isUrgent = remaining >= 0 && remaining <= 2;

      let urgencyBadge = "";
      let urgencyColor = "#10b981";
      let urgencyBg = "#d1fae5";
      let urgencyText = `${remaining}d left`;

      if (isBreached) {
        urgencyColor = "#dc2626";
        urgencyBg = "#fee2e2";
        urgencyText = `${Math.abs(remaining)}d overdue`;
        urgencyBadge = `<span style="background:#dc2626;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;margin-left:6px;letter-spacing:0.5px;">BREACHED</span>`;
      } else if (isUrgent) {
        urgencyColor = "#d97706";
        urgencyBg = "#fef3c7";
        urgencyText = `${remaining}d left`;
        urgencyBadge = `<span style="background:#f59e0b;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;margin-left:6px;letter-spacing:0.5px;">URGENT</span>`;
      }

      const barColor = isBreached ? "#dc2626" : isUrgent ? "#f59e0b" : "#10b981";

      const dateSubmitted = req.created_date
        ? new Date(req.created_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "—";

      const statusColors = {
        "Pending": { bg: "#fef9c3", color: "#92400e" },
        "In Progress": { bg: "#dbeafe", color: "#1e40af" },
      };
      const sc = statusColors[req.status] || { bg: "#f3f4f6", color: "#374151" };

      const rowBg = i % 2 === 0 ? "#ffffff" : "#f8fafc";

      rows += `
        <tr style="background:${rowBg};">
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#374151;vertical-align:middle;">
            <div style="font-weight:600;color:#111827;">${req.requested_by || "—"}</div>
            <div style="color:#9ca3af;font-size:11px;margin-top:2px;">${req.email_address || ""}</div>
            ${req.branch ? `<div style="color:#6b7280;font-size:11px;">${req.branch}</div>` : ""}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#374151;white-space:nowrap;vertical-align:middle;">${dateSubmitted}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;vertical-align:middle;white-space:nowrap;">
            <span style="background:${sc.bg};color:${sc.color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:8px;">${req.status}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#374151;text-align:center;vertical-align:middle;white-space:nowrap;">
            <span style="font-weight:700;color:#1e40af;">${sla}d</span>
            <div style="font-size:10px;color:#9ca3af;margin-top:1px;">${elapsed}d elapsed</div>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="flex:1;background:#e5e7eb;border-radius:99px;height:6px;min-width:60px;">
                <div style="background:${barColor};height:6px;border-radius:99px;width:${pct}%;max-width:100%;"></div>
              </div>
              <span style="background:${urgencyBg};color:${urgencyColor};font-size:11px;font-weight:700;padding:3px 10px;border-radius:8px;white-space:nowrap;">${urgencyText}</span>
              ${urgencyBadge}
            </div>
          </td>
        </tr>`;
    });

    const breachedCount = sortedRequests.filter(r => getDaysElapsed(r.created_date) > getSLA(r)).length;
    const urgentCount = sortedRequests.filter(r => {
      const rem = getSLA(r) - getDaysElapsed(r.created_date);
      return rem >= 0 && rem <= 2;
    }).length;

    categorySections += `
      <div style="margin-bottom:32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:2px;">
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:${color}18;border-left:4px solid ${color};border-radius:4px 8px 8px 4px;margin-bottom:8px;">
                <span style="font-size:15px;font-weight:800;color:${color};">${subject}</span>
                <span style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px;margin-left:4px;">${requests.length} request${requests.length !== 1 ? "s" : ""}</span>
                ${breachedCount > 0 ? `<span style="background:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px;">⚠ ${breachedCount} breached</span>` : ""}
                ${urgentCount > 0 ? `<span style="background:#fef3c7;color:#d97706;font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px;">⏰ ${urgentCount} urgent</span>` : ""}
              </div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Employee</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">Date Submitted</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Status</th>
              <th style="padding:10px 14px;text-align:center;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;">SLA</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">SLA Progress</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  const allRequests = Object.values(grouped).flat();
  const totalBreached = allRequests.filter(r => getDaysElapsed(r.created_date) > getSLA(r)).length;
  const totalUrgent = allRequests.filter(r => { const rem = getSLA(r) - getDaysElapsed(r.created_date); return rem >= 0 && rem <= 2; }).length;
  const totalPending = allRequests.filter(r => r.status === "Pending").length;
  const totalInProgress = allRequests.filter(r => r.status === "In Progress").length;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Daily HR Report</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="700" cellpadding="0" cellspacing="0" style="max-width:700px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e3a6e 0%,#1d4ed8 100%);padding:32px 36px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Gladex · HR Hub</p>
                <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;">Daily HR Tracker Report</h1>
                <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.65);">Generated on ${reportDate} · Open &amp; Pending Requests Only</p>
              </td>
              <td align="right" valign="middle">
                <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:14px 20px;text-align:center;">
                  <div style="font-size:36px;font-weight:900;color:#fff;line-height:1;">${totalCount}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px;font-weight:600;">OPEN REQUESTS</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Orange bar -->
      <tr><td style="background:#f97316;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

      <!-- Summary Stats -->
      <tr>
        <td style="padding:24px 36px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="25%" style="padding:0 6px 0 0;">
                <div style="background:#eff6ff;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:900;color:#1d4ed8;">${totalPending}</div>
                  <div style="font-size:11px;color:#3b82f6;font-weight:700;margin-top:3px;">PENDING</div>
                </div>
              </td>
              <td width="25%" style="padding:0 6px;">
                <div style="background:#f0fdf4;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:900;color:#16a34a;">${totalInProgress}</div>
                  <div style="font-size:11px;color:#22c55e;font-weight:700;margin-top:3px;">IN PROGRESS</div>
                </div>
              </td>
              <td width="25%" style="padding:0 6px;">
                <div style="background:#fefce8;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:900;color:#b45309;">${totalUrgent}</div>
                  <div style="font-size:11px;color:#f59e0b;font-weight:700;margin-top:3px;">URGENT (≤2d)</div>
                </div>
              </td>
              <td width="25%" style="padding:0 0 0 6px;">
                <div style="background:#fef2f2;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-size:24px;font-weight:900;color:#dc2626;">${totalBreached}</div>
                  <div style="font-size:11px;color:#ef4444;font-weight:700;margin-top:3px;">BREACHED</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Divider -->
      <tr>
        <td style="padding:24px 36px 16px;">
          <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Requests by Category</p>
        </td>
      </tr>

      <!-- Categories -->
      <tr>
        <td style="padding:0 36px 24px;">
          ${categorySections}
        </td>
      </tr>

      <!-- Legend -->
      <tr>
        <td style="padding:0 36px 28px;">
          <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;">
            <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Legend</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:20px;font-size:12px;color:#374151;white-space:nowrap;">🟢 <strong>On Track</strong> — more than 2 days remaining</td>
                <td style="padding-right:20px;font-size:12px;color:#374151;white-space:nowrap;">🟡 <strong>Urgent</strong> — 0–2 days remaining</td>
                <td style="font-size:12px;color:#374151;white-space:nowrap;">🔴 <strong>Breached</strong> — SLA exceeded</td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#1e3a6e;padding:20px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:700;">Gladex Tours · HR Hub</p>
                <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.45);">People &amp; Culture Department · Flow Pulse System</p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Automated Daily Report<br>Do not reply directly</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Load all open (non-completed) requests
    const allRequests = await base44.asServiceRole.entities.HRRequest.list("-created_date", 2000);
    const openRequests = allRequests.filter(r =>
      r.status === "Pending" || r.status === "In Progress"
    );

    // Group by subject
    const grouped = {};
    for (const req of openRequests) {
      const key = req.subject || "Others";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(req);
    }

    // Sort groups by most breached/urgent first
    const sortedGrouped = {};
    Object.entries(grouped)
      .sort(([, a], [, b]) => {
        const urgencyScore = (reqs) => reqs.filter(r => getDaysElapsed(r.created_date) > getSLA(r)).length * 100 +
          reqs.filter(r => { const rem = getSLA(r) - getDaysElapsed(r.created_date); return rem >= 0 && rem <= 2; }).length;
        return urgencyScore(b) - urgencyScore(a);
      })
      .forEach(([k, v]) => { sortedGrouped[k] = v; });

    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    const htmlBody = buildReportHtml(sortedGrouped, reportDate, openRequests.length);

    // Get recipient settings
    const recipientSetting = await base44.asServiceRole.entities.AppSettings.filter({ key: "daily_report_recipients" });
    const recipientsRaw = recipientSetting[0]?.value || "";
    const recipients = recipientsRaw.split(",").map(e => e.trim()).filter(Boolean);

    if (recipients.length === 0) {
      return Response.json({ error: "No recipients configured. Please add emails in Settings." }, { status: 400 });
    }

    const subject = `📊 Daily HR Tracker Report — ${openRequests.length} Open Requests · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const results = [];
    for (const email of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body: htmlBody,
      });
      results.push({ email, sent: true });
    }

    return Response.json({
      success: true,
      recipients: results,
      total_open: openRequests.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});