import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only act on update events where status changed to Completed
    if (!data || data.status !== "Completed" || !data.email_address) {
      return Response.json({ skipped: true });
    }

    try {
      const emailBody = buildCompletionEmail(data);
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: data.email_address,
        subject: `HR Request Completed: ${data.subject}`,
        body: emailBody,
      });
    } catch (emailErr) {
      console.warn("Completion email failed:", emailErr.message);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildCompletionEmail(data) {
  const rows = [
    ["Subject", data.subject],
    data.branch ? ["Branch", data.branch] : null,
    data.resource_type ? ["Resource Type", data.resource_type] : null,
    data.requested_by ? ["Requested By", data.requested_by] : null,
    data.date_started ? ["Date Started", data.date_started] : null,
    data.date_completed ? ["Date Completed", data.date_completed] : null,
    ["Breach Status", data.breach_status || "Pending"],
    ["Status", "✅ Completed"],
  ].filter(Boolean);

  const tableRows = rows.map(([label, value]) =>
    `<tr>
      <td style="padding:8px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:180px;">${label}</td>
      <td style="padding:8px 12px;color:#1f2937;border:1px solid #e5e7eb;">${value}</td>
    </tr>`
  ).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <div style="background:linear-gradient(135deg,#065f46,#059669);padding:32px 24px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">HR Request Completed</h1>
        <p style="color:#a7f3d0;margin:8px 0 0;">Your request has been processed and completed.</p>
      </div>
      <div style="padding:24px;">
        <p style="color:#374151;margin:0 0 16px;">Hello <strong>${data.requested_by || "Requester"}</strong>,</p>
        <p style="color:#6b7280;margin:0 0 20px;">Great news! Your HR request has been completed. Here is a summary:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          ${tableRows}
        </table>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
          <p style="color:#15803d;font-weight:600;margin:0;">✅ Your request has been completed</p>
          <p style="color:#166534;font-size:13px;margin:6px 0 0;">If you have any concerns, please reach out to the HR team directly.</p>
        </div>
      </div>
      <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated message from HR Hub. Please do not reply to this email.</p>
      </div>
    </div>
  `;
}