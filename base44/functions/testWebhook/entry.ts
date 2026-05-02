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
    ? `<p>Hello ${leaderName},</p><p>Your attendance proposal for <strong>${companyName} / ${branchName} / ${deptName} / ${teamName}</strong> covering <strong>${periodStart}–${periodEnd}</strong> has been rejected by HR.</p><p><strong style="color: #d32f2f;">Reason:</strong> Test rejection: Please review the schedule and resubmit.</p><hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;"><p style="color: #666; font-size: 12px;">Please contact HR for further clarification.</p><p>Regards,<br><strong>${companyName} HR</strong></p>`
    : `<p>Hello ${leaderName},</p><p>Your attendance proposal for <strong>${companyName} / ${branchName} / ${deptName} / ${teamName}</strong> covering <strong>${periodStart}–${periodEnd}</strong> has been <strong style="color: #4caf50;">approved</strong> by HR.</p><p>Please find the approved attendance schedule details below.</p><hr style="border: none; border-top: 2px solid #333; margin: 20px 0;"><h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">APPROVED ATTENDANCE PROPOSAL</h2><div style="margin-bottom: 20px; line-height: 1.8;"><p><strong>Company:</strong> ${companyName}</p><p><strong>Branch:</strong> ${branchName}</p><p><strong>Department:</strong> ${deptName}</p><p><strong>Team:</strong> ${teamName}</p><p><strong>Leader:</strong> ${leaderName}</p><p><strong>Period:</strong> ${periodStart} to ${periodEnd}</p></div><table border="1" cellpadding="12" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-family: Arial, sans-serif;"><thead><tr style="background-color: #2d3e50; color: white; font-weight: bold;"><th style="text-align: left; padding: 12px; border: 1px solid #ddd;">Employee</th><th style="text-align: center; padding: 12px; border: 1px solid #ddd;">2025-05-16<br><span style="font-weight: normal; font-size: 12px;">Fri</span></th><th style="text-align: center; padding: 12px; border: 1px solid #ddd;">2025-05-17<br><span style="font-weight: normal; font-size: 12px;">Sat</span></th><th style="text-align: center; padding: 12px; border: 1px solid #ddd;">2025-05-18<br><span style="font-weight: normal; font-size: 12px;">Sun</span></th></tr></thead><tbody><tr style="background-color: #f9f9f9;"><td style="padding: 12px; border: 1px solid #ddd;">John Doe (Team Lead)</td><td style="padding: 12px; border: 1px solid #ddd; text-align: center;">Opener</td><td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #e67e22;">Mid</td><td style="padding: 12px; border: 1px solid #ddd; text-align: center;">Closer</td></tr><tr style="background-color: #ffffff;"><td style="padding: 12px; border: 1px solid #ddd;">Jane Smith (Supervisor)</td><td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #e67e22;">Mid</td><td style="padding: 12px; border: 1px solid #ddd; text-align: center;">Closer</td><td style="padding: 12px; border: 1px solid #ddd; text-align: center;">Opener</td></tr></tbody></table><p style="color: #666; font-size: 12px; margin-top: 20px;">Generated on ${new Date().toISOString()}</p><hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;"><p>Regards,<br><strong>${companyName} HR</strong></p>`;

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