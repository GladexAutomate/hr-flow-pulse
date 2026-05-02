import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { chromium } from 'npm:playwright@1.40.0';

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

  // Build header row HTML
  let headerHtml = '<tr><th>Employee</th>';
  periodDates.forEach(date => {
    const datePart = date.slice(5);
    const day = getDayOfWeek(date);
    headerHtml += `<th><div class="date">${datePart}</div><div class="day">${day}</div></th>`;
  });
  headerHtml += '</tr>';

  // Build body rows
  let bodyHtml = '';
  employees.forEach((emp, idx) => {
    bodyHtml += `<tr><td>${emp.name}</td>`;
    periodDates.forEach((date, dIdx) => {
      const cell = (schedule[emp.id] || {})[date] || {};
      const shift = cell.shift || getDefaultShift(idx, dIdx);
      const shiftLabel = cell.shift === 'Custom' ? (cell.customLabel || 'Custom') : shift;
      const bgColor = shift === 'Mid' ? '#ff9800' : (shift === 'Opener' ? '#2c3e50' : '#17a2b8');
      bodyHtml += `<td style="background-color: ${bgColor}; color: white;">${shiftLabel}</td>`;
    });
    bodyHtml += '</tr>';
  });

  const getDefaultShift = (idx, dIdx) => {
    const shifts = ['Opener', 'Mid', 'Closer'];
    return shifts[(idx + dIdx) % shifts.length];
  };

  // HTML page for screenshot
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: white; padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #2c3e50; }
    .info { margin-bottom: 25px; line-height: 1.8; font-size: 14px; color: #333; }
    .info p { margin-bottom: 8px; }
    .info strong { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    thead tr { background-color: #2c3e50; color: white; }
    th { padding: 14px 10px; text-align: center; font-weight: 600; border: 1px solid #2c3e50; }
    th:first-child { text-align: left; }
    .date { font-weight: 700; font-size: 13px; }
    .day { font-weight: 400; font-size: 11px; margin-top: 3px; opacity: 0.9; }
    td { padding: 12px 10px; text-align: center; border: 1px solid #ddd; font-weight: 500; }
    td:first-child { text-align: left; font-weight: 600; color: #333; background-color: #f5f5f5; }
    tbody tr:nth-child(odd) td:first-child { background-color: #f5f5f5; }
    tbody tr:nth-child(even) td:first-child { background-color: white; }
    .footer { margin-top: 20px; font-size: 11px; color: #999; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <h1>APPROVED ATTENDANCE PROPOSAL</h1>
    <div class="info">
      <p><strong>Company:</strong> ${company_name}</p>
      <p><strong>Branch:</strong> ${branch_name}</p>
      <p><strong>Department:</strong> ${department_name}</p>
      <p><strong>Team:</strong> ${team_name}</p>
      <p><strong>Leader:</strong> ${leader_name}</p>
      <p><strong>Period:</strong> ${period_start} to ${period_end}</p>
    </div>
    <table>
      <thead>${headerHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table>
    <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
  </div>
</body>
</html>`;

  try {
    // Launch browser
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Set content and wait for load
    await page.setContent(html, { waitUntil: 'networkidle' });
    
    // Take screenshot
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });
    
    await browser.close();

    // Convert to base64
    const base64 = screenshot.toString('base64');

    return Response.json({
      success: true,
      base64: `data:image/png;base64,${base64}`,
      message: 'Screenshot generated successfully'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});