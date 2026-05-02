import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getDatesInRange, getShift, dayOfWeek, generateApprovedAttendanceHtml, generateRejectedAttendanceHtml } from "@/utils/attendanceUtils";
import { CheckCircle, XCircle, Eye, Loader2, Calendar } from "lucide-react";

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
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    await onAction("approve", proposal, null);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) return;
    setProcessing(true);
    await onAction("reject", proposal, rejectionNote.trim());
    setProcessing(false);
    setShowReject(false);
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
              <button disabled={processing} onClick={handleApprove}
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                <CheckCircle className="w-3.5 h-3.5" />Approve
              </button>
              <button disabled={processing} onClick={() => setShowReject(s => !s)}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                <XCircle className="w-3.5 h-3.5" />Reject
              </button>
            </>
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
            <button disabled={!rejectionNote.trim() || processing} onClick={handleReject}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Confirm Reject
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <ReadOnlyGrid proposal={proposal} />
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

  const handleAction = async (action, proposal, rejectionNote) => {
    if (action === "approve") {
      const approvedHtml = generateApprovedAttendanceHtml({ proposal, schedule: proposal.schedule || {} });
      await base44.entities.AttendanceProposal.update(proposal.id, {
        status: "Approved",
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
      // Send approval email
      await base44.integrations.Core.SendEmail({
        to: proposal.leader_email,
        subject: `Attendance Approved — ${proposal.team_name} (${proposal.period_start}–${proposal.period_end})`,
        body: `Hello ${proposal.leader_name},\n\nYour attendance proposal for ${proposal.company_name} / ${proposal.branch_name} / ${proposal.department_name} / ${proposal.team_name} covering ${proposal.period_start}–${proposal.period_end} has been approved by HR.\n\nPlease find the approved attendance proposal below for download and review.\n\nRegards,\n${proposal.company_name} HR\n\n` + approvedHtml,
      });
    } else {
      const rejectedHtml = generateRejectedAttendanceHtml({ proposal, schedule: proposal.schedule || {}, rejectionNote });
      await base44.entities.AttendanceProposal.update(proposal.id, {
        status: "Rejected",
        rejection_note: rejectionNote,
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
      await base44.integrations.Core.SendEmail({
        to: proposal.leader_email,
        subject: `Attendance Proposal Rejected — ${proposal.team_name} (${proposal.period_start}–${proposal.period_end})`,
        body: `Hello ${proposal.leader_name},\n\nYour attendance proposal for ${proposal.company_name} / ${proposal.branch_name} / ${proposal.department_name} / ${proposal.team_name} covering ${proposal.period_start}–${proposal.period_end} has been rejected by HR.\n\nReason: ${rejectionNote}\n\nRegards,\n${proposal.company_name} HR\n\n` + rejectedHtml,
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