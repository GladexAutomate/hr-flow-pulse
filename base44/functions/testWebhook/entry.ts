import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, key } = await req.json();
  if (!url) return Response.json({ error: 'No URL provided' }, { status: 400 });

  const isRejection = key === 'attendance_rejected_webhook';
  const periodStart = '2025-05-16';
  const periodEnd = '2025-05-31';
  const teamName = 'Sample Team';
  const leaderName = 'Juan dela Cruz';
  const companyName = 'Gladex Main';
  const branchName = 'Main Branch';
  const deptName = 'Operations';
  
  // Sample schedule data for HTML generation
  const sampleProposal = {
    team_name: teamName,
    leader_name: leaderName,
    company_name: companyName,
    branch_name: branchName,
    department_name: deptName,
    period_label: 'May 16–31, 2025',
    period_start: periodStart,
    period_end: periodEnd,
    employees: [
      { id: '1', name: 'John Doe', position: 'Team Lead' },
      { id: '2', name: 'Jane Smith', position: 'Supervisor' },
    ],
  };
  
  const sampleSchedule = {
    '1': {
      '2025-05-16': { shift: 'Opener', wfh: 'Onsite' },
      '2025-05-17': { shift: 'Mid', wfh: 'Onsite' },
      '2025-05-18': { shift: 'Closer', wfh: 'Onsite' },
    },
    '2': {
      '2025-05-16': { shift: 'Mid', wfh: 'Onsite' },
      '2025-05-17': { shift: 'Closer', wfh: 'Onsite' },
      '2025-05-18': { shift: 'Opener', wfh: 'Onsite' },
    },
  };

  const emailSubject = isRejection
    ? `Attendance Proposal Rejected — ${teamName} (${periodStart}–${periodEnd})`
    : `Attendance Approved — ${teamName} (${periodStart}–${periodEnd})`;

  const emailBody = isRejection
    ? `Hello ${leaderName},\n\nYour attendance proposal for ${companyName} / ${branchName} / ${deptName} / ${teamName} covering ${periodStart}–${periodEnd} has been rejected by HR.\n\nReason: Test rejection: Please review the schedule and resubmit.\n\nRegards,\n${companyName} HR`
    : `Hello ${leaderName},\n\nYour attendance proposal for ${companyName} / ${branchName} / ${deptName} / ${teamName} covering ${periodStart}–${periodEnd} has been approved by HR.\n\nPlease find the approved attendance schedule details below.\n\nRegards,\n${companyName} HR`;

  // Build simple HTML table for schedule
  const htmlSchedule = `
    <h2>APPROVED ATTENDANCE PROPOSAL</h2>
    <p><strong>Company:</strong> ${companyName}</p>
    <p><strong>Branch:</strong> ${branchName}</p>
    <p><strong>Department:</strong> ${deptName}</p>
    <p><strong>Team:</strong> ${teamName}</p>
    <p><strong>Leader:</strong> ${leaderName}</p>
    <p><strong>Period:</strong> ${periodStart} to ${periodEnd}</p>
    <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
      <tr style="background-color: #f0f0f0;">
        <th>Employee</th>
        <th>2025-05-16</th>
        <th>2025-05-17</th>
        <th>2025-05-18</th>
      </tr>
      <tr>
        <td>John Doe (Team Lead)</td>
        <td>Opener</td>
        <td>Mid</td>
        <td>Closer</td>
      </tr>
      <tr>
        <td>Jane Smith (Supervisor)</td>
        <td>Mid</td>
        <td>Closer</td>
        <td>Opener</td>
      </tr>
    </table>
    <p style="color: #666; font-size: 12px; margin-top: 20px;">Generated on ${new Date().toISOString()}</p>
  `;

  const payload = {
    event: isRejection ? 'attendance_rejected' : 'attendance_approved',
    proposal_id: 'test-proposal-001',
    team_name: teamName,
    leader_name: leaderName,
    leader_email: 'juan@example.com',
    company_name: companyName,
    branch_name: branchName,
    department_name: deptName,
    period_label: 'May 16–31, 2025',
    period_start: periodStart,
    period_end: periodEnd,
    email_subject: emailSubject,
    email_body: emailBody,
    approved_attendance_html: isRejection ? null : htmlSchedule,
    rejection_note: isRejection ? 'Test rejection: Please review the schedule and resubmit.' : null,
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