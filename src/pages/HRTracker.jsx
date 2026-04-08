import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, format } from "date-fns";
import { Search, ExternalLink, Edit3, X, Save, ClipboardList } from "lucide-react";

const STATUS_COLORS = {
  "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  "Completed": "bg-green-100 text-green-700 border-green-200",
};

const BREACH_COLORS = {
  "Valid": "bg-emerald-100 text-emerald-700",
  "Breached": "bg-red-100 text-red-700",
  "Pending": "bg-gray-100 text-gray-500",
};

function computeBreach(request) {
  if (request.status !== "Completed" || !request.date_started || !request.date_completed) return "Pending";
  const days = differenceInDays(parseISO(request.date_completed), parseISO(request.date_started));
  return days <= request.sla_days ? "Valid" : "Breached";
}

export default function HRTracker() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

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
    const breach_status = editData.status === "Completed"
      ? computeBreach({ ...req, ...editData })
      : "Pending";
    await base44.entities.HRRequest.update(req.id, { ...editData, breach_status });
    setEditingId(null);
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
    breached: requests.filter(r => r.breach_status === "Breached").length,
    valid: requests.filter(r => r.breach_status === "Valid").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total", value: stats.total, color: "from-blue-500 to-blue-600" },
          { label: "Pending", value: stats.pending, color: "from-yellow-400 to-yellow-500" },
          { label: "In Progress", value: stats.inProgress, color: "from-blue-400 to-blue-500" },
          { label: "Completed", value: stats.completed, color: "from-green-500 to-green-600" },
          { label: "Valid", value: stats.valid, color: "from-emerald-500 to-emerald-600" },
          { label: "Breached", value: stats.breached, color: "from-red-500 to-red-600" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-md`}>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm opacity-80 font-medium mt-1">{s.label}</div>
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
          {["All", "Pending", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}
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
                  {["Date Submitted", "Branch", "Subject", "Requested By", "SLA", "Status", "Date Started", "Date Completed", "Breach", "File", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req, i) => {
                  const isEditing = editingId === req.id;
                  return (
                    <tr key={req.id} className={`hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {req.created_date ? format(new Date(req.created_date), "MMM d, yyyy") : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{req.branch}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{req.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{req.requested_by}</div>
                        <div className="text-xs text-gray-400">{req.email_address}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.sla_days}d</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs">
                            {["Pending", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}
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
                        {req.file_url ? (
                          <a href={req.file_url} target="_blank" rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        ) : <span className="text-gray-300">—</span>}
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
                          <button onClick={() => startEdit(req)}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg p-1.5 transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
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