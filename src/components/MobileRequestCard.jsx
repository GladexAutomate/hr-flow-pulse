import { format } from "date-fns";
import { Eye, Edit3, Save, X, Paperclip, ExternalLink } from "lucide-react";

const STATUS_COLORS = {
  "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  "Completed": "bg-green-100 text-green-700 border-green-200",
  "Waived/Cancelled": "bg-gray-100 text-gray-500 border-gray-200",
};

const BREACH_COLORS = {
  "Valid": "bg-emerald-100 text-emerald-700",
  "Breached": "bg-red-100 text-red-700",
  "Pending": "bg-gray-100 text-gray-500",
};

export default function MobileRequestCard({
  req, sla, isEditing, editData, setEditData, onView, onStartEdit, onSaveEdit, onCancelEdit, hasNOD
}) {
  const hrAtts = Array.isArray(req.hr_attachments) ? req.hr_attachments : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-sm truncate">{req.requested_by}</div>
          <div className="text-xs text-gray-400 truncate">{req.email_address}</div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button onClick={onSaveEdit} className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-1.5">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={onCancelEdit} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg p-1.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onView} className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg p-1.5">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button onClick={onStartEdit} className="bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg p-1.5">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subject + branch */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">{req.subject}</span>
        {req.branch && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{req.branch}</span>}
        {req.resource_type && <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">{req.resource_type}</span>}
      </div>

      {/* Status row */}
      <div className="flex flex-wrap gap-2 items-center">
        {isEditing ? (
          <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs flex-1">
            {["Pending", "In Progress", "Completed", "Waived/Cancelled"].map(s => <option key={s}>{s}</option>)}
          </select>
        ) : (
          <span className={`px-2 py-1 rounded-lg border text-xs font-semibold ${STATUS_COLORS[req.status]}`}>{req.status}</span>
        )}
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${BREACH_COLORS[req.breach_status || "Pending"]}`}>
          {req.breach_status || "Pending"}
        </span>
        <span className="text-xs text-gray-400">SLA: {sla}d</span>
      </div>

      {/* Dates row */}
      {isEditing ? (
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-500 mb-1">Date Started</label>
            <input type="date" value={editData.date_started} onChange={e => setEditData({ ...editData, date_started: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs" />
          </div>
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-500 mb-1">Date Completed</label>
            <input type="date" value={editData.date_completed} onChange={e => setEditData({ ...editData, date_completed: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs" />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Submitted: {req.created_date ? format(new Date(req.created_date), "MMM d, yyyy") : "—"}</span>
          {req.date_started && <span>Started: {req.date_started}</span>}
          {req.date_completed && <span>Completed: {req.date_completed}</span>}
        </div>
      )}

      {/* Attachments */}
      <div className="flex gap-3 items-center text-xs">
        <button onClick={onView} className="flex items-center gap-1 text-purple-600 font-semibold">
          <Paperclip className="w-3 h-3" />
          {hrAtts.length > 0 ? `${hrAtts.length} file${hrAtts.length > 1 ? "s" : ""}` : "Add Attachment"}
        </button>
        {req.file_url && (
          <a href={req.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500">
            <ExternalLink className="w-3 h-3" /> Form File
          </a>
        )}
        {req.subject === "NTE Request" && !hasNOD(req) && (
          <span className="text-orange-500">NOD missing</span>
        )}
      </div>
    </div>
  );
}