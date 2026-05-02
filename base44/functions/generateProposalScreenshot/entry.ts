import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { proposalData } = await req.json();
  if (!proposalData) return Response.json({ error: 'No proposal data' }, { status: 400 });

  const { company_name, branch_name, department_name, team_name, leader_name, period_start, period_end, employees = [], schedule = {} } = proposalData;

  // Helper to get day of week
  const getDayOfWeek = (dateStr) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(dateStr).getDay()];
  };

  // Generate all dates in period
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

  const periodDates = getAllDates(period_start, period_end);

  const getDefaultShift = (idx, dIdx) => {
    const shifts = ['Opener', 'Mid', 'Closer'];
    return shifts[(idx + dIdx) % shifts.length];
  };

  // Build header row HTML
  let headerHtml = '<tr><th style="background-color: #1e3a8a; color: white; padding: 12px 10px; text-align: left; border: 1px solid #1e3a8a; font-weight: 700; font-size: 13px;">Employee</th>';
  periodDates.forEach(date => {
    const datePart = date.slice(5);
    const day = getDayOfWeek(date);
    headerHtml += `<th style="background-color: #1e3a8a; color: white; padding: 10px 6px; text-align: center; border: 1px solid #1e3a8a; font-weight: 700; font-size: 12px;"><strong>${datePart}</strong><br><span style="font-weight: 500; font-size: 10px;">${day}</span></th>`;
  });
  headerHtml += '</tr>';

  // Shift color mapping
  const shiftColors = {
    'Opener': { bg: '#1e40af', color: '#fff' },
    'Mid': { bg: '#dc2626', color: '#fff' },
    'Closer': { bg: '#16a34a', color: '#fff' },
    'OFF': { bg: '#dc2626', color: '#fff' },
    'VL': { bg: '#dc2626', color: '#fff' },
  };

  // Build body rows
  let bodyHtml = '';
  employees.forEach((emp, idx) => {
    const bgColor = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
    bodyHtml += `<tr style="background-color: ${bgColor};"><td style="padding: 12px 10px; border: 1px solid #e5e7eb; font-weight: 600; font-size: 13px; color: #1f2937;">${emp.name}</td>`;
    periodDates.forEach((date, dIdx) => {
      const cell = (schedule[emp.id] || {})[date] || {};
      const shift = cell.shift || getDefaultShift(idx, dIdx);
      const shiftLabel = cell.shift === 'Custom' ? (cell.customLabel || 'Custom') : shift;
      const colors = shiftColors[shift] || { bg: '#6b7280', color: '#fff' };
      bodyHtml += `<td style="padding: 8px 6px; border: 1px solid #e5e7eb; text-align: center; font-size: 11px; font-weight: 600;"><div style="background-color: ${colors.bg}; color: ${colors.color}; padding: 6px 4px; border-radius: 4px; display: inline-block; min-width: 50px;">${shiftLabel}</div></td>`;
    });
    bodyHtml += '</tr>';
  });

  // HTML as inline styled table (email-friendly)
  const tableHtml = `<table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0; font-family: Arial, sans-serif; border: 1px solid #999;">${headerHtml}${bodyHtml}</table>`;

  // Generate full HTML with inline styles for email
  const htmlContent = `<div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">APPROVED ATTENDANCE PROPOSAL</h2>
    <div style="margin-bottom: 15px; line-height: 1.6; font-size: 13px;">
      <p style="margin: 5px 0;"><strong>Company:</strong> ${company_name}</p>
      <p style="margin: 5px 0;"><strong>Branch:</strong> ${branch_name}</p>
      <p style="margin: 5px 0;"><strong>Department:</strong> ${department_name}</p>
      <p style="margin: 5px 0;"><strong>Team:</strong> ${team_name}</p>
      <p style="margin: 5px 0;"><strong>Leader:</strong> ${leader_name}</p>
      <p style="margin: 5px 0;"><strong>Period:</strong> ${period_start} to ${period_end}</p>
    </div>
    ${tableHtml}
    <p style="color: #999; font-size: 11px; margin-top: 15px;">Generated on ${new Date().toISOString()}</p>
  </div>`;

  try {
    return Response.json({
      success: true,
      html: htmlContent,
      message: 'Email HTML generated successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});