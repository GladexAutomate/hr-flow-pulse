import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { to, subject, body } = await req.json();
  if (!to || !subject || !body) {
    return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
  }

  try {
    // Use Resend to send email to external addresses
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HR System <noreply@hrtracker.app>',
        to: to,
        subject: subject,
        html: body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.message || 'Failed to send email' }, { status: response.status });
    }

    const result = await response.json();
    return Response.json({ success: true, messageId: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});