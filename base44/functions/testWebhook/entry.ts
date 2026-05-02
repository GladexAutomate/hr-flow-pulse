import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, key } = await req.json();
  if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

  const isRejection = key === 'attendance_rejected_webhook';
  const payload = isRejection
    ? {
        event: 'attendance_rejected',
        proposal_id: 'test-proposal-001',
        team_name: 'Sample Team',
        leader_name: 'Juan dela Cruz',
        leader_email: 'juan@example.com',
        company_name: 'Gladex Main',
        branch_name: 'Main Branch',
        department_name: 'Operations',
        period_label: 'May 16–31, 2025',
        period_start: '2025-05-16',
        period_end: '2025-05-31',
        rejection_note: 'Test rejection: Please review the schedule and resubmit.',
        reviewed_by: 'hr@company.com',
        reviewed_at: new Date().toISOString(),
      }
    : {
        event: 'attendance_approved',
        proposal_id: 'test-proposal-001',
        team_name: 'Sample Team',
        leader_name: 'Juan dela Cruz',
        leader_email: 'juan@example.com',
        company_name: 'Gladex Main',
        branch_name: 'Main Branch',
        department_name: 'Operations',
        period_label: 'May 16–31, 2025',
        period_start: '2025-05-16',
        period_end: '2025-05-31',
        reviewed_by: 'hr@company.com',
        reviewed_at: new Date().toISOString(),
      };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return Response.json({ status: response.status, ok: response.ok });
});