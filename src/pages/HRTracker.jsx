import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, format } from "date-fns";
import { Search, ExternalLink, Edit3, X, Save, ClipboardList, Eye, Upload, Paperclip, Loader2 } from "lucide-react";

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

const RESOURCE_SLA = { "Rank and File": 15, "Supervisory": 20, "Managerial": 30 };
const BASE_SLA = { "NTE Request": 8, "General Announcement Request": 2, "WFH Request": 2, "Others": 7 };

function getSLA(req) {
  if (req.subject === "Resource Request") return RESOURCE_SLA[req.resource_type] || req.sla_days || 15;
  return BASE_SLA[req.subject] || req.sla_days || 7;
}

function computeBreach(request) {
  if (request.status === "Waived/Cancelled") return "Pending";
  if (request.status !== "Completed" || !request.date_started || !request.date_completed) return "Pending";
  const days = differenceInDays(parseISO(request.date_completed), parseISO(request.date_started));
  const sla = getSLA(request);
  return days <= sla ? "Valid" : "Breached";
}

function DetailsModal({ req, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">Request Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div><span className="font-semibold text-gray-600">Branch:</span> <span className="text-gray-800">{req.branch}</span></div>
          <div><span className="font-semibold text-gray-600">Subject:</span> <span className="text-gray-800">{req.subject}</span></div>
          {req.resource_type && <div><span className="font-semibold text-gray-600">Resource Type:</span> <span className="text-gray-800">{req.resource_type}</span></div>}
          <div><span className="font-semibold text-gray-600">Requested By:</span> <span className="text-gray-800">{req.requested_by}</span></div>
          <div><span className="font-semibold text-gray-600">Email:</span> <span className="text-gray-800">{req.email_address}</span></div>
          <div>
            <span className="font-semibold text-gray-600">Details:</span>
            <p className="mt-1 text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{req.details || "—"}</p>
          </div>
          {req.file_url && (
            <div>
              <span className="font-semibold text-gray-600">Attached File:</span>{" "}
              <a href={req.file_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">View File</a>
            </div>
          )}
          {req.completion_file_url && (
            <div>
              <span className="font-semibold text-gray-600">Proof of Completion:</span>{" "}
              <a href={req.completion_file_url} target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline text-xs">View Proof</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HRTracker() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [viewingReq, setViewingReq] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    const data = await base44.entities.HRRequest.list("-created_date", 200);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (req) => {
    setEditingId(req.id);
    setEditData({ status: req.status, date_started: req.date_started || "", date_completed: req.date_completed || "" });
  };

  const saveEdit = async (req) => {
    const breach_status = computeBreach({ ...req, ...editData });
    await base44.entities.HRRequest.update(req.id, { ...editData, breach_status });
    setEditingId(null);
    fetchData();
  };

  const handleCompletionUpload = async (req, file) => {
    setUploadingId(req.id);
    const res = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.HRRequest.update(req.id, { completion_file_url: res.file_url });
    setUploadingId(null);
    fetchData();
  };

  const branches = ["All", ...new Set(requests.map(r => r.branch))];
  const filtered = requests.filter(r => {
    const matchSearch = r.requested_by?.toLowerCase().includes(search.toLowerCase()) ||
      r.subject?.toLowerCase().includes(search.toLowerCase()) ||
      r.branch?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    const matchBranch = filterBranch === "All" || r.branch === filterBranch;
    return matchSearch && matchStatus && matchBranch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "Pending").length,
    inProgress: requests.filter(r => r.status === "In Progress").length,
    completed: requests.filter(r => r.status === "Completed").length,
    waived: requests.filter(r => r.status === "Waived/Cancelled").length,
    breached: requests.filter(r => r.breach_status === "Breached").length,
    valid: requests.filter(r => r.breach_status === "Valid").length,
  };

  return (
    <div className="space-y-6">
      {viewingReq && <DetailsModal req={viewingReq} onClose={() => setViewingReq(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {[
          { label: "Total", value: stats.total, color: "from-blue-500 to-blue-600" },
          { label: "Pending", value: stats.pending, color: "from-yellow-400 to-yellow-500" },
          { label: "In Progress", value: stats.inProgress, color: "from-blue-400 to-blue-500" },
          { label: "Completed", value: stats.completed, color: "from-green-500 to-green-600" },
          { label: "Waived/Cancelled", value: stats.waived, color: "from-gray-400 to-gray-500" },
          { label: "Valid", value: stats.valid, color: "from-emerald-500 to-emerald-600" },
          { label: "Breached", value: stats.breached, color: "from-red-500 to-red-600" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-xs opacity-80 font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, subject, branch..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
          {["All", "Pending", "In Progress", "Completed", "Waived/Cancelled"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
          {branches.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
                <tr>
                  {["Date Submitted", "Branch", "Subject", "Requested By", "SLA", "Status", "Date Started", "Date Completed", "Breach", "Attachments", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req, i) => {
                  const isEditing = editingId === req.id;
                  const sla = getSLA(req);
                  return (
                    <tr key={req.id} className={`hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {req.created_date ? format(new Date(req.created_date), "MMM d, yyyy") : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{req.branch}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <div>{req.subject}</div>
                        {req.resource_type && <div className="text-xs text-blue-500">{req.resource_type}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{req.requested_by}</div>
                        <div className="text-xs text-gray-400">{req.email_address}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{sla}d</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                            {["Pending", "In Progress", "Completed", "Waived/Cancelled"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-lg border text-xs font-semibold ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input type="date" value={editData.date_started} onChange={e => setEditData({ ...editData, date_started: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs" />
                        ) : (
                          <span className="text-gray-600">{req.date_started || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input type="date" value={editData.date_completed} onChange={e => setEditData({ ...editData, date_completed: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs" />
                        ) : (
                          <span className="text-gray-600">{req.date_completed || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${BREACH_COLORS[req.breach_status || "Pending"]}`}>
                          {req.breach_status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {req.file_url && (
                            <a href={req.file_url} target="_blank" rel="noreferrer"
                              className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs">
                              <ExternalLink className="w-3 h-3" /> Request
                            </a>
                          )}
                          {req.completion_file_url ? (
                            <a href={req.completion_file_url} target="_blank" rel="noreferrer"
                              className="text-emerald-500 hover:text-emerald-700 flex items-center gap-1 text-xs">
                              <Paperclip className="w-3 h-3" /> Proof
                            </a>
                          ) : (
                            <label className="text-orange-400 hover:text-orange-600 flex items-center gap-1 text-xs cursor-pointer">
                              {uploadingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                              {uploadingId === req.id ? "Uploading..." : "Add Proof"}
                              <input type="file" className="hidden"
                                onChange={e => e.target.files[0] && handleCompletionUpload(req, e.target.files[0])} />
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(req)}
                              className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-1.5 transition-all">
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg p-1.5 transition-all">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={() => setViewingReq(req)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg p-1.5 transition-all" title="View Details">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => startEdit(req)}
                              className="bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg p-1.5 transition-all" title="Edit">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}