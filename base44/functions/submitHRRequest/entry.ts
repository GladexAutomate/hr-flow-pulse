import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// SLA defaults — mirror src/lib/sla.js. Editable overrides live in AppSettings
// under the "sla_settings" key and are applied here, at creation time only.
const DEFAULT_RESOURCE_SLA = { "Rank and File": 15, "Supervisory": 20, "Managerial": 30 };
const DEFAULT_BASE_SLA = {
  "NTE Request": 8,
  "General Announcement Request": 2,
  "WFH Request": 2,
  "COE (Certificate of Employment)": 2,
  "ITR (Income Tax Return)": 7,
  "LAST PAY": 30,
  "ATD (Authority to Deduct)": 7,
  "Others": 7,
};

function slaForNewRequest(settings, subject, resourceType) {
  const s = settings || {};
  if (subject === "Resource Request") {
    const tiers = s["Resource Request"] || {};
    return tiers[resourceType] || DEFAULT_RESOURCE_SLA[resourceType] || 15;
  }
  return s[subject] || DEFAULT_BASE_SLA[subject] || 7;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { file_base64, file_name, ...data } = await req.json();

    // Stamp the SLA from the configured settings so each record freezes the SLA
    // that applied when it was created. Later edits to SLA settings won't change
    // existing records' breach evaluation.
    let slaSettings = null;
    try {
      const rows = await base44.asServiceRole.entities.AppSettings.filter({ key: "sla_settings" });
      if (rows[0]?.value) slaSettings = JSON.parse(rows[0].value);
    } catch (_) { /* fall back to defaults */ }
    data.sla_days = slaForNewRequest(slaSettings, data.subject, data.resource_type);

    // Upload file using service role if provided
    if (file_base64 && file_name) {
      const binaryStr = atob(file_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const file = new File([bytes], file_name);
      const res = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      data.file_url = res.file_url;
    }

    const record = await base44.asServiceRole.entities.HRRequest.create(data);

    // Send confirmation email — best effort, don't fail the submission if email fails
    try {
      const emailBody = buildSubmissionEmail(data);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: data.email_address,
        subject: `HR Request Received: ${data.subject}`,
        body: emailBody,
      });
    } catch (emailErr) {
      console.warn("Email notification failed:", emailErr.message);
    }

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildSubmissionEmail(data) {
  const rows = [
    ["Subject", data.subject],
    data.branch ? ["Branch", data.branch] : null,
    data.resource_type ? ["Resource Type", data.resource_type] : null,
    data.requested_by ? ["Requested By", data.requested_by] : null,
    data.department ? ["Department", data.department] : null,
    data.purpose ? ["Purpose", data.purpose] : null,
    data.tin ? ["TIN", data.tin] : null,
    data.address ? ["Address", data.address] : null,
    data.bday ? ["Birthday", data.bday] : null,
    data.employment_date ? ["Employment Date", data.employment_date] : null,
    data.compensation_summary ? ["Compensation Summary", data.compensation_summary] : null,
    data.amount ? ["Amount", data.amount] : null,
    data.reason_of_atd ? ["Reason of ATD", data.reason_of_atd] : null,
    data.details ? ["Details", data.details] : null,
    ["SLA (Days)", data.sla_days],
    ["Status", "✅ Request sent to HR successfully"],
  ].filter(Boolean);

  const tableRows = rows.map(([label, value]) =>
    `<tr>
      <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:180px;">${label}</td>
      <td style="padding:8px 12px;color:#1f2937;border:1px solid #e5e7eb;">${value}</td>
    </tr>`
  ).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">HR Request Confirmation</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;">Your request has been successfully submitted.</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#374151;margin:0 0 16px;">Hello <strong>${data.requested_by || "Requester"}</strong>,</p>
        <p style="color:#6b7280;margin:0 0 20px;">We have received your HR request. Below is a summary of your submission:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${tableRows}
        </table>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#15803d;font-weight:600;margin:0;">✅ Request sent to HR successfully</p>
          <p style="color:#166534;font-size:13px;margin:6px 0 0;">Our HR team will process your request and get back to you within the SLA period.</p>
        </div>
      </div>
      <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated message from HR Hub. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}