import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildEmailHtml({ requestedBy, dateSubmitted, branch, subject, status, emailAddress, department, details, attachments, eventType }) {
  const statusColors = {
    'Pending': '#f59e0b',
    'In Progress': '#3b82f6',
    'Completed': '#10b981',
    'Waived/Cancelled': '#6b7280',
  };
  const statusColor = statusColors[status] || '#6b7280';

  const attachmentsHtml = attachments && attachments.length > 0
    ? attachments.map((a, i) =>
        `<tr>
          <td style="padding:8px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;">Attachment ${i + 1}</td>
          <td style="padding:8px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;">
            <a href="${a.url}" style="color:#f97316;font-weight:600;text-decoration:none;">📎 View File</a>
          </td>
        </tr>`
      ).join('')
    : `<tr><td colspan="2" style="padding:8px 16px;font-size:13px;color:#9ca3af;font-style:italic;">No attachments</td></tr>`;

  const introText = eventType === 'create'
    ? `Your HR request has been <strong>successfully submitted</strong>. Our People &amp; Culture team will review it shortly.`
    : status === 'Completed'
    ? `Great news! Your HR request has been <strong style="color:#10b981;">completed</strong>. Please find the details below. If you have any questions or need further assistance, feel free to reach out to the HR team.`
    : `Your HR request status has been updated to <strong style="color:${statusColor};">${status}</strong>. Our team is actively working on it — we'll keep you posted on any further updates.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>HR Request Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10);">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a6e 0%,#1d4ed8 100%);padding:32px 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Gladex · HR Hub</p>
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">HR Request Notification</h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;background:${statusColor};color:#ffffff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;white-space:nowrap;">${status}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Orange Accent Bar -->
          <tr>
            <td style="background:#f97316;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 36px 0;">
              <p style="margin:0;font-size:16px;color:#111827;font-weight:600;">Hello, ${requestedBy || 'Team Member'},</p>
              <p style="margin:10px 0 0;font-size:14px;color:#4b5563;line-height:1.7;">${introText}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 36px 0;">
              <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Request Details</p>
            </td>
          </tr>

          <!-- Details Card -->
          <tr>
            <td style="padding:16px 36px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 16px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:38%;">Field</td>
                  <td style="padding:10px 16px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Value</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Date Submitted</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">${dateSubmitted}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Branch</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">${branch || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Department</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">${department || '—'}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Subject / Request Type</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;font-weight:600;">${subject || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Email Address</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#111827;">${emailAddress || '—'}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Status</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;">
                    <span style="display:inline-block;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:700;padding:3px 12px;border-radius:10px;">${status || '—'}</span>
                  </td>
                </tr>
                ${details ? `<tr>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Details / Notes</td>
                  <td style="padding:10px 16px;border-top:1px solid #f0f0f0;font-size:13px;color:#374151;line-height:1.6;">${details}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Attachments -->
          <tr>
            <td style="padding:24px 36px 0;">
              <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Attachments</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                ${attachmentsHtml}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 36px 24px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                For questions or follow-ups, please reply to this email or contact the HR team directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1e3a6e;padding:20px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:700;">Gladex Tours · HR Hub</p>
                    <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.45);">People & Culture Department · Flow Pulse System</p>
                  </td>
                  <td align="right">
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">Automated Notification<br>Do not reply directly</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entity_id, event_type } = await req.json();

    const record = await base44.asServiceRole.entities.HRRequest.filter({ id: entity_id });
    const hr = record[0];
    if (!hr) return Response.json({ error: `Invalid id value: ${entity_id} -> Object not found` }, { status: 404 });

    const settings = await base44.asServiceRole.entities.AppSettings.filter({ key: 'hr_request_webhook' });
    const webhookUrl = settings[0]?.value;
    if (!webhookUrl) return Response.json({ error: 'No webhook URL configured' }, { status: 400 });

    const dateSubmitted = hr.created_date
      ? new Date(hr.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    const emailBody = buildEmailHtml({
      requestedBy: hr.requested_by,
      dateSubmitted,
      branch: hr.branch,
      subject: hr.subject,
      status: hr.status || 'Pending',
      emailAddress: hr.email_address,
      department: hr.department,
      details: hr.details,
      attachments: hr.hr_attachments || [],
      eventType: event_type,
    });

    const payload = {
      event: event_type === 'create' ? 'hr_request_created' : 'hr_request_status_changed',
      date_submitted: hr.created_date || null,
      date_submitted_formatted: dateSubmitted,
      branch: hr.branch || null,
      subject: hr.subject || null,
      status: hr.status || null,
      requested_by: hr.requested_by || null,
      email_address: hr.email_address || null,
      hr_attachments: hr.hr_attachments || [],
      email_body: emailBody,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return Response.json({ success: true, webhook_status: response.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});