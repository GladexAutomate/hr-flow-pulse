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

  // Helper function to get day of week
  const getDayOfWeek = (dateStr) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(dateStr).getDay()];
  };

  // Generate all dates in the period
  const getAllDates = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const periodDates = getAllDates(periodStart, periodEnd);
  
  // Build dynamic table header with all dates
  let tableHeaderHtml = '<tr style="background-color: #2c3e50; color: white; font-weight: bold;"><th style="text-align: left; padding: 12px 10px; border: 1px solid #999; font-size: 13px; min-width: 160px;">Employee</th>';
  periodDates.forEach(date => {
    const datePart = date.slice(5);
    const day = getDayOfWeek(date);
    tableHeaderHtml += `<th style="text-align: center; padding: 10px 8px; border: 1px solid #999; font-size: 12px; min-width: 70px;"><strong>${datePart}</strong><br><span style="font-weight: normal; font-size: 10px;">${day}</span></th>`;
  });
  tableHeaderHtml += '</tr>';

  // Build sample employee rows
  const employees = [
    { name: 'John Doe (Team Lead)' },
    { name: 'Jane Smith (Supervisor)' }
  ];
  
  let tableBodyHtml = '';
  employees.forEach((emp, idx) => {
    const bgColor = idx % 2 === 0 ? '#f8f8f8' : '#ffffff';
    tableBodyHtml += `<tr style="background-color: ${bgColor};"><td style="padding: 12px 10px; border: 1px solid #ddd; font-weight: 600; font-size: 13px;">${emp.name}</td>`;
    
    periodDates.forEach((date, dateIdx) => {
      const shifts = ['Opener', 'Mid', 'Closer'];
      const shift = shifts[(idx + dateIdx) % shifts.length];
      const shiftColor = shift === 'Mid' ? '#ff9800' : '#333';
      const fontWeight = shift === 'Mid' ? '600' : '400';
      tableBodyHtml += `<td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center; font-size: 12px; color: ${shiftColor}; font-weight: ${fontWeight};">${shift}</td>`;
    });
    tableBodyHtml += '</tr>';
  });

  const tableHtml = `<table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0; font-family: Arial, sans-serif; border: 1px solid #999;">${tableHeaderHtml}${tableBodyHtml}</table>`;

  const emailBody = isRejection
    ? `<p>Hello ${leaderName},</p><p>Your attendance proposal for <strong>${companyName} / ${branchName} / ${deptName} / ${teamName}</strong> covering <strong>${periodStart}–${periodEnd}</strong> has been rejected by HR.</p><p><strong style="color: #d32f2f;">Reason:</strong> Test rejection: Please review the schedule and resubmit.</p><hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;"><p style="color: #666; font-size: 12px;">Please contact HR for further clarification.</p><p>Regards,<br><strong>${companyName} HR</strong></p>`
    : `<p>Hello ${leaderName},</p><p>Your attendance proposal for <strong>${companyName} / ${branchName} / ${deptName} / ${teamName}</strong> covering <strong>${periodStart}–${periodEnd}</strong> has been <strong style="color: #4caf50;">approved</strong> by HR.</p><p>Please find the approved attendance schedule details below.</p><hr style="border: none; border-top: 2px solid #333; margin: 20px 0;"><h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">APPROVED ATTENDANCE PROPOSAL</h2><div style="margin-bottom: 15px; line-height: 1.6; font-size: 13px;"><p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p><p style="margin: 5px 0;"><strong>Branch:</strong> ${branchName}</p><p style="margin: 5px 0;"><strong>Department:</strong> ${deptName}</p><p style="margin: 5px 0;"><strong>Team:</strong> ${teamName}</p><p style="margin: 5px 0;"><strong>Leader:</strong> ${leaderName}</p><p style="margin: 5px 0;"><strong>Period:</strong> ${periodStart} to ${periodEnd}</p></div>${tableHtml}<p style="color: #999; font-size: 11px; margin-top: 15px;">Generated on ${new Date().toISOString()}</p><hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;"><p style="margin-bottom: 5px;">Regards,</p><p style="margin: 0;"><strong>${companyName} HR</strong></p>`;

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