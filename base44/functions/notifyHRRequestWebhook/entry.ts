import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entity_id, event_type } = await req.json();

    // Fetch the HR request record
    const record = await base44.asServiceRole.entities.HRRequest.filter({ id: entity_id });
    const hr = record[0];
    if (!hr) return Response.json({ error: 'Record not found' }, { status: 404 });

    // Fetch webhook URL from AppSettings
    const settings = await base44.asServiceRole.entities.AppSettings.filter({ key: 'hr_request_webhook' });
    const webhookUrl = settings[0]?.value;
    if (!webhookUrl) return Response.json({ error: 'No webhook URL configured' }, { status: 400 });

    // Format date submitted
    const dateSubmitted = hr.created_date
      ? new Date(hr.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';

    // Build attachments HTML
    const attachmentsHtml = (hr.hr_attachments && hr.hr_attachments.length > 0)
      ? hr.hr_attachments.map((a, i) =>
          `<tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#374151;">
              Attachment ${i + 1}
            </td>
            <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">
              <a href="${a.url}" style="color:#f97316;text-decoration:none;">View File</a>
            </td>
          </tr>`
        ).join('')
      : `<tr><td colspan="2" style="padding:6px 12px;font-size:13px;color:#9ca3af;">No attachments</td></tr>`;

    // Status color
    const statusColors = {
      'Pending': '#f59e0b',
      'In Progress': '#3b82f6',
      'Completed': '#10b981',
      'Waived/Cancelled': '#6b7280',
    };
    const statusColor = statusColors[hr.status] || '#6b7280';

    // Build professional HTML email body
    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a6e 0%,#1d4ed8 100%);padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">HR Hub · Flow Pulse</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;">HR Request Update</h1>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background:${statusColor};color:#ffffff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">${hr.status || 'Pending'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">
                Dear <strong>${hr.requested_by || 'Requestor'}</strong>,
              </p>
              <p style="margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                ${event_type === 'create'
                  ? 'Your HR request has been successfully submitted. Our People and Culture team will review it and get back to you shortly.'
                  : `Your HR request status has been updated to <strong style="color:${statusColor};">${hr.status}</strong>. Please see the details below.`
                }
              </p>
            </td>
          </tr>

          <!-- Details Table -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;font-weight:600;width:40%;">Field</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Details</th>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Date Submitted</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111827;">${dateSubmitted}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Branch</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111827;">${hr.branch || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Subject</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111827;">${hr.subject || '—'}</td>
                </tr>
                <tr style="background:#fafafa;">
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;font-weight:600;">Status</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
                    <span style="display:inline-block;background:${statusColor}20;color:${statusColor};font-size:12px;font-weight:700;padding:2px 10px;border-radius:10px;">${hr.status || '—'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Attachments</td>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${attachmentsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
                This is an automated notification from <strong style="color:#374151;">HR Hub · Flow Pulse</strong>.<br>
                Please do not reply to this message. For inquiries, contact your HR team directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Build payload
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