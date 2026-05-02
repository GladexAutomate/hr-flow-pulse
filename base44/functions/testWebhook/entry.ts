import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, key } = await req.json();
  if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: key,
      test: true,
      proposal_id: 'test-001',
      team_name: 'Sample Team',
      leader_name: 'Juan dela Cruz',
      leader_email: 'juan@example.com',
      company_name: 'Sample Company',
      branch_name: 'Main Branch',
      department_name: 'Operations',
      period_label: 'May 16–31, 2025',
      period_start: '2025-05-16',
      period_end: '2025-05-31',
      message: 'This is a test webhook fired from HR Tracker Settings.',
    }),
  });

  return Response.json({ status: response.status, ok: response.ok });
});