import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { getDatesInRange, dayOfWeek, getShift } from "@/utils/attendanceUtils";

export default function WebhookPayloadDebugger() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await base44.entities.AttendanceProposal.list("-created_date", 100);
      setProposals(data.filter(p => p.status !== "Draft"));
      setLoading(false);
    };
    load();
  }, []);

  const generateApprovedEmailBody = (proposal) => {
    const dates = getDatesInRange(proposal.period_start, proposal.period_end);
    const employees = proposal.employees || [];
    const schedule = proposal.schedule || {};
    
    const dateHeaderHtml = dates.map(d => `
      <th style="padding: 8px; border: 1px solid #ddd; font-size: 11px; background-color: #f5f5f5; text-align: center; min-width: 50px;">
        ${d.slice(5)}<br/><span style="font-weight: normal; color: #666;">${dayOfWeek(d)}</span>
      </th>
    `).join('');

    const employeeRowsHtml = employees.map((emp, i) => {
      const cellsHtml = dates.map(d => {
        const cell = (schedule[emp.id] || {})[d] || {};
        const shift = cell.shift ? getShift(cell.shift) : null;
        return `
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 11px; background-color: ${shift ? shift.color : '#fff'}; color: ${shift ? shift.text : '#999'};">
            ${shift ? (cell.shift === "Custom" ? (cell.customLabel || "Custom") : shift.label) : "—"}
            ${cell.wfh ? `<div style="font-size: 9px;">${cell.wfh}</div>` : ''}
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9;">${emp.name}</td>
          ${cellsHtml}
        </tr>
      `;
    }).join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #27ae60;">Attendance Proposal Approved</h2>
          <p>The attendance proposal for <strong>${proposal.team_name}</strong> has been approved.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <h3 style="color: #333; margin-bottom: 10px;">Proposal Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Team:</td><td style="padding: 8px;">${proposal.team_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Company:</td><td style="padding: 8px;">${proposal.company_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Branch:</td><td style="padding: 8px;">${proposal.branch_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Department:</td><td style="padding: 8px;">${proposal.department_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Period:</td><td style="padding: 8px;">${proposal.period_label}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Leader:</td><td style="padding: 8px;">${proposal.leader_name} (${proposal.leader_email})</td></tr>
          </table>

          <h3 style="color: #333; margin-bottom: 10px;">Attendance Schedule</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #003d82; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left; min-width: 120px;">Employee</th>
                ${dateHeaderHtml}
              </tr>
            </thead>
            <tbody>
              ${employeeRowsHtml}
            </tbody>
          </table>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </body>
      </html>
    `;
  };

  const generateRejectedEmailBody = (proposal) => {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #e74c3c;">Attendance Proposal Rejected</h2>
          <p>The attendance proposal for <strong>${proposal.team_name}</strong> has been rejected.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <h3 style="color: #333; margin-bottom: 10px;">Proposal Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Team:</td><td style="padding: 8px;">${proposal.team_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Company:</td><td style="padding: 8px;">${proposal.company_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Branch:</td><td style="padding: 8px;">${proposal.branch_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Department:</td><td style="padding: 8px;">${proposal.department_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Period:</td><td style="padding: 8px;">${proposal.period_label}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; background-color: #f5f5f5;">Leader:</td><td style="padding: 8px;">${proposal.leader_name} (${proposal.leader_email})</td></tr>
          </table>

          <div style="background-color: #fdeaea; border-left: 4px solid #e74c3c; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #e74c3c;">Rejection Reason:</p>
            <p style="margin: 8px 0 0 0; color: #c0392b;">${proposal.rejection_note || ""}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
        </body>
      </html>
    `;
  };

  const generateApprovedPayload = (proposal) => {
    return {
      event: "attendance_approved",
      proposal_id: proposal.id,
      team_name: proposal.team_name,
      leader_name: proposal.leader_name,
      leader_email: proposal.leader_email,
      company_name: proposal.company_name,
      branch_name: proposal.branch_name,
      department_name: proposal.department_name,
      period_label: proposal.period_label,
      period_start: proposal.period_start,
      period_end: proposal.period_end,
      email_subject: `Attendance Approved — ${proposal.team_name} (${proposal.period_start}–${proposal.period_end})`,
      email_body: generateApprovedEmailBody(proposal),
    };
  };

  const generateRejectedPayload = (proposal) => {
    return {
      event: "attendance_rejected",
      proposal_id: proposal.id,
      team_name: proposal.team_name,
      leader_name: proposal.leader_name,
      leader_email: proposal.leader_email,
      company_name: proposal.company_name,
      branch_name: proposal.branch_name,
      department_name: proposal.department_name,
      period_label: proposal.period_label,
      period_start: proposal.period_start,
      period_end: proposal.period_end,
      email_subject: `Attendance Rejected — ${proposal.team_name} (${proposal.period_start}–${proposal.period_end})`,
      rejection_note: proposal.rejection_note || "N/A",
      email_body: generateRejectedEmailBody(proposal),
    };
  };

  const handleProposalSelect = (proposal) => {
    setSelectedProposal(proposal);
    const generatedPayload = proposal.status === "Approved" 
      ? generateApprovedPayload(proposal) 
      : generateRejectedPayload(proposal);
    setPayload(generatedPayload);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    toast.success("Payload copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Webhook Payload Debugger</h1>
        <p className="text-gray-500 text-sm mt-1">View the exact format being sent to webhooks for testing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposals List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Proposal</p>
            </div>
            {loading ? (
              <div className="p-4 flex justify-center">
                <div className="w-6 h-6 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : proposals.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No proposals found</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {proposals.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProposalSelect(p)}
                    className={`w-full text-left px-4 py-3 transition-all ${
                      selectedProposal?.id === p.id
                        ? "bg-orange-50 border-l-4 border-orange-500"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    <p className="font-semibold text-gray-800 text-sm">{p.team_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.company_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        p.status === "Approved" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {p.status}
                      </span>
                      <span className="text-xs text-gray-400">{p.period_label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payload Display */}
        <div className="lg:col-span-2">
          {selectedProposal && payload ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-500" />
                  Webhook Payload
                </h2>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs font-mono leading-relaxed break-words">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-semibold text-blue-900 mb-1">Event Type:</p>
                <p className="text-blue-700 font-mono text-xs">{payload.event}</p>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs space-y-1">
                <p className="font-semibold text-gray-700">Quick Info:</p>
                <p className="text-gray-600">Proposal ID: <span className="font-mono text-gray-800">{payload.proposal_id}</span></p>
                <p className="text-gray-600">Team: <span className="font-mono text-gray-800">{payload.team_name}</span></p>
                <p className="text-gray-600">Period: <span className="font-mono text-gray-800">{payload.period_start} to {payload.period_end}</span></p>
                <p className="text-gray-600">Size: <span className="font-mono text-gray-800">{JSON.stringify(payload).length} bytes</span></p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
              <Eye className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-semibold">Select a proposal to view webhook payload</p>
              <p className="text-gray-400 text-sm mt-1">The exact JSON format will be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}