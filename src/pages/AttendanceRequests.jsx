import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getDatesInRange, getShift, dayOfWeek, generateApprovedAttendanceHtml, generateRejectedAttendanceHtml } from "@/utils/attendanceUtils";
import { CheckCircle, XCircle, Eye, Loader2, Calendar, Send } from "lucide-react";
import AttendanceAnalytics from "@/components/attendance/AttendanceAnalytics";

const STATUS_COLORS = {
  "Pending HR Review": "bg-yellow-100 text-yellow-700",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Draft": "bg-gray-100 text-gray-500",
};

function ReadOnlyGrid({ proposal }) {
  const dates = getDatesInRange(proposal.period_start, proposal.period_end);
  const schedule = proposal.schedule || {};
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-3">
      <table className="border-collapse text-xs">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="px-3 py-2 text-left min-w-[120px] sticky left-0 bg-blue-900 z-10">Employee</th>
            {dates.map(d => (
              <th key={d} className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">
                {d.slice(5)}<br /><span className="text-blue-200 font-normal">{dayOfWeek(d)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(proposal.employees || []).map((emp, i) => (
            <tr key={emp.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap sticky left-0 bg-inherit border-r border-gray-200 z-10">{emp.name}</td>
              {dates.map(d => {
                const cell = (schedule[emp.id] || {})[d] || {};
                const shift = cell.shift ? getShift(cell.shift) : null;
                return (
                  <td key={d} className="px-1 py-1 border border-gray-100 text-center">
                    {shift ? (
                      <div style={{ background: shift.color, color: shift.text }} className="rounded px-1 py-0.5 font-semibold">
                        {cell.shift === "Custom" ? (cell.customLabel || "Custom") : shift.label}
                        {cell.wfh && <div className="text-xs opacity-80">{cell.wfh}</div>}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProposalCard({ proposal, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resending, setResending] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    await onAction("approve", proposal, null);
    setProcessing(false);
    setShowApproveConfirm(false);
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) return;
    setProcessing(true);
    await onAction("reject", proposal, rejectionNote.trim());
    setProcessing(false);
    setShowRejectConfirm(false);
    setShowReject(false);
  };

  const handleResendNotification = async () => {
    setResending(true);
    if (proposal.status === "Approved") {
      await onAction("resend-approved", proposal, null);
    } else if (proposal.status === "Rejected") {
      await onAction("resend-rejected", proposal, null);
    }
    setResending(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-800">{proposal.team_name}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${STATUS_COLORS[proposal.status] || "bg-gray-100 text-gray-500"}`}>
              {proposal.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{proposal.company_name} / {proposal.branch_name} / {proposal.department_name}</p>
          <p className="text-sm text-gray-600 mt-0.5"><Calendar className="w-3.5 h-3.5 inline mr-1" />{proposal.period_label}</p>
          <p className="text-xs text-gray-400 mt-0.5">Leader: {proposal.leader_name} · {proposal.leader_email}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
            <Eye className="w-3.5 h-3.5" />{expanded ? "Hide" : "View"}
          </button>
          {proposal.status === "Pending HR Review" && (
            <>
              <button disabled={processing} onClick={() => setShowApproveConfirm(true)}
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                <CheckCircle className="w-3.5 h-3.5" />Approve
              </button>
              <button disabled={processing} onClick={() => setShowReject(s => !s)}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                <XCircle className="w-3.5 h-3.5" />Reject
              </button>
            </>
          )}
          {(proposal.status === "Approved" || proposal.status === "Rejected") && (
            <button disabled={resending} onClick={handleResendNotification}
              className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Resend Notification
            </button>
          )}
        </div>
      </div>

      {showReject && (
        <div className="px-5 pb-4 space-y-2">
          <textarea value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} rows={2}
            placeholder="Enter rejection reason (required)..."
            className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setShowReject(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button disabled={!rejectionNote.trim() || processing} onClick={() => setShowRejectConfirm(true)}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Confirm Reject
            </button>
          </div>
        </div>
      )}

      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Approve Attendance Proposal?</h3>
            <p className="text-sm text-gray-600 mb-6">This will approve the attendance proposal for <strong>{proposal.team_name}</strong> and notify all stakeholders.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveConfirm(false)} disabled={processing}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Reject Attendance Proposal?</h3>
            <p className="text-sm text-gray-600 mb-6">This will reject the proposal for <strong>{proposal.team_name}</strong> with the provided reason.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectConfirm(false)} disabled={processing}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleReject} disabled={processing}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <ReadOnlyGrid proposal={proposal} />
          <AttendanceAnalytics proposal={proposal} />
          {proposal.remarks && (
            <div className="mt-3 bg-yellow-50 rounded-xl px-4 py-3 text-sm">
              <span className="font-semibold text-yellow-800">Remarks: </span>
              <span className="text-gray-700">{proposal.remarks}</span>
            </div>
          )}
          {proposal.rejection_note && (
            <div className="mt-2 bg-red-50 rounded-xl px-4 py-3 text-sm">
              <span className="font-semibold text-red-800">Rejection Note: </span>
              <span className="text-gray-700">{proposal.rejection_note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttendanceRequests() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AttendanceProposal.list("-created_date", 100);
    setProposals(data.filter(p => p.status !== "Draft"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fireWebhook = async (webhookKey, payload) => {
    const settings = await base44.entities.AppSettings.filter({ key: webhookKey });
    const url = settings?.[0]?.value;
    if (!url) {
      console.warn(`❌ Webhook URL not configured for key: ${webhookKey}`);
      return;
    }
    console.log(`🔄 Sending webhook to ${webhookKey}:`, url);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`✅ Webhook sent successfully (${response.status})`);
    } catch (error) {
      console.error(`❌ Webhook failed: ${error.message}`);
    }
  };

  const handleAction = async (action, proposal, rejectionNote) => {
    if (action === "approve") {
      await base44.entities.AttendanceProposal.update(proposal.id, {
        status: "Approved",
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
      fireWebhook("attendance_approved_webhook", {
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
        employees: proposal.employees || [],
        schedule: proposal.schedule || {},
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
    } else if (action === "reject") {
      await base44.entities.AttendanceProposal.update(proposal.id, {
        status: "Rejected",
        rejection_note: rejectionNote,
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
      fireWebhook("attendance_rejected_webhook", {
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
        employees: proposal.employees || [],
        schedule: proposal.schedule || {},
        rejection_note: rejectionNote,
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
    } else if (action === "resend-approved") {
      fireWebhook("attendance_approved_webhook", {
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
        employees: proposal.employees || [],
        schedule: proposal.schedule || {},
        reviewed_by: proposal.reviewed_by,
        reviewed_at: proposal.reviewed_at,
      });
    } else if (action === "resend-rejected") {
      fireWebhook("attendance_rejected_webhook", {
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
        employees: proposal.employees || [],
        schedule: proposal.schedule || {},
        rejection_note: proposal.rejection_note,
        reviewed_by: proposal.reviewed_by,
        reviewed_at: proposal.reviewed_at,
      });
    }
    load();
  };

  const filtered = filter === "All" ? proposals : proposals.filter(p => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Attendance Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve team attendance proposals</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "Pending HR Review", "Approved", "Rejected"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filter === s ? "bg-blue-800 text-white border-blue-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No attendance requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => <ProposalCard key={p.id} proposal={p} onAction={handleAction} />)}
        </div>
      )}
    </div>
  );
}