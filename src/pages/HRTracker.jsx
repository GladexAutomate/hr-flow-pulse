import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import WelcomeScreen from "../components/WelcomeScreen";
import HRAttachmentsPanel from "../components/HRAttachmentsPanel";
import RecordTimeline from "../components/RecordTimeline";
import MobileRequestCard from "../components/MobileRequestCard";
import PullToRefresh from "../components/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, format } from "date-fns";
import { Search, ExternalLink, Edit3, X, Save, ClipboardList, Eye, Paperclip, ArrowLeft } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
const BASE_SLA = {
  "NTE Request": 8,
  "General Announcement Request": 2,
  "WFH Request": 2,
  "COE (Certificate of Employment)": 2,
  "ITR (Income Tax Return)": 7,
  "LAST PAY": 30,
  "ATD (Authority to Deduct)": 7,
  "Others": 7,
};

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

function hasNOD(req) {
  if (req.subject !== "NTE Request") return true;
  const atts = Array.isArray(req.hr_attachments) ? req.hr_attachments : [];
  return atts.some(a => a.type === "NOD");
}

function DetailsContent({ req, onClose, onUpdated, user }) {
  const [tab, setTab] = useState("details");
  return (
    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
        <div className="flex gap-2">
          {["details", "attachments", "timeline"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-blue-800 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>

      <div className="overflow-y-auto p-4 sm:p-5 flex-1">
        {tab === "details" && (
          <div className="space-y-3 text-sm">
            <div><span className="font-semibold text-gray-600">Branch:</span> <span className="text-gray-800">{req.branch || "—"}</span></div>
            <div><span className="font-semibold text-gray-600">Subject:</span> <span className="text-gray-800">{req.subject}</span></div>
            {req.resource_type && <div><span className="font-semibold text-gray-600">Resource Type:</span> <span className="text-gray-800">{req.resource_type}</span></div>}
            <div><span className="font-semibold text-gray-600">Requested By:</span> <span className="text-gray-800">{req.requested_by}</span></div>
            <div><span className="font-semibold text-gray-600">Email:</span> <span className="text-gray-800">{req.email_address}</span></div>
            {req.department && <div><span className="font-semibold text-gray-600">Department:</span> <span className="text-gray-800">{req.department}</span></div>}
            {req.purpose && <div><span className="font-semibold text-gray-600">Purpose:</span> <span className="text-gray-800">{req.purpose}</span></div>}
            {req.tin && <div><span className="font-semibold text-gray-600">TIN:</span> <span className="text-gray-800">{req.tin}</span></div>}
            {req.address && <div><span className="font-semibold text-gray-600">Address:</span> <span className="text-gray-800">{req.address}</span></div>}
            {req.bday && <div><span className="font-semibold text-gray-600">Birthday:</span> <span className="text-gray-800">{req.bday}</span></div>}
            {req.employment_date && <div><span className="font-semibold text-gray-600">Employment Date:</span> <span className="text-gray-800">{req.employment_date}</span></div>}
            {req.compensation_summary && <div><span className="font-semibold text-gray-600">Compensation Summary:</span> <span className="text-gray-800">{req.compensation_summary}</span></div>}
            {req.amount && <div><span className="font-semibold text-gray-600">Amount:</span> <span className="text-gray-800">{req.amount}</span></div>}
            {req.reason_of_atd && <div><span className="font-semibold text-gray-600">Reason of ATD:</span> <span className="text-gray-800">{req.reason_of_atd}</span></div>}
            {req.details && (
              <div>
                <span className="font-semibold text-gray-600">Details:</span>
                <p className="mt-1 text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{req.details}</p>
              </div>
            )}
            {req.file_url && (
              <div>
                <span className="font-semibold text-gray-600">Form Attachment:</span>{" "}
                <a href={req.file_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">View File</a>
              </div>
            )}
          </div>
        )}
        {tab === "attachments" && (
          <HRAttachmentsPanel req={req} onUpdated={onUpdated} currentUser={user} />
        )}
        {tab === "timeline" && (
          <RecordTimeline timeline={req.timeline} />
        )}
      </div>
    </div>
  );
}

function DetailsModal({ req, onClose, onUpdated, user }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <DetailsContent req={req} onClose={onClose} onUpdated={onUpdated} user={user} />
    </div>
  );
}

function RequestDetailPage({ requests, onUpdated, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const req = requests.find(r => r.id === id);

  if (!req) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <p>Request not found.</p>
      <button onClick={() => navigate("/")} className="mt-3 text-blue-500 text-sm">← Back to Tracker</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-gray-800 text-base truncate">{req.requested_by}</h2>
      </div>
      <div className="p-4">
        <DetailsContent req={req} onClose={() => navigate(-1)} onUpdated={onUpdated} user={user} />
      </div>
    </div>
  );
}

function HRTrackerList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem("hr_welcomed"));
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [viewingReq, setViewingReq] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const data = await base44.entities.HRRequest.list("-created_date", 200);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdated = async () => {
    await fetchData();
    if (viewingReq) {
      const fresh = await base44.entities.HRRequest.filter({ id: viewingReq.id });
      if (fresh?.length) setViewingReq(fresh[0]);
    }
  };

  const startEdit = (req) => {
    setEditingId(req.id);
    setEditData({ status: req.status, date_started: req.date_started || "", date_completed: req.date_completed || "" });
  };

  const saveEdit = async (req) => {
    if (editData.status === "Completed" && req.subject === "NTE Request" && !hasNOD({ ...req, ...editData })) {
      alert("Cannot complete NTE Request without a NOD attachment. Please upload the NOD first.");
      return;
    }
    if (editData.status === "Completed" && req.subject !== "NTE Request") {
      const atts = Array.isArray(req.hr_attachments) ? req.hr_attachments : [];
      const hasProof = atts.some(a => a.type === "Proof of Completion");
      if (!hasProof) {
        alert("Cannot complete this request without a Proof of Completion attachment. Please upload proof first.");
        return;
      }
    }
    // Auto-fill dates when completing
    const today = new Date().toISOString().split("T")[0];
    if (editData.status === "Completed") {
      if (!editData.date_started && !req.date_started) editData.date_started = today;
      if (!editData.date_completed) editData.date_completed = today;
    }
    const breach_status = computeBreach({ ...req, ...editData });
    const newTimeline = [
      ...(Array.isArray(req.timeline) ? req.timeline : []),
      {
        timestamp: new Date().toISOString(),
        action: "Status Updated",
        user: user?.email || "HR Staff",
        details: `Status changed to: ${editData.status}${editData.date_started ? ` | Date Started: ${editData.date_started}` : ""}${editData.date_completed ? ` | Date Completed: ${editData.date_completed}` : ""}`,
      },
    ];
    // Optimistic update
    const optimisticUpdate = { ...editData, breach_status };
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, ...optimisticUpdate } : r));
    setEditingId(null);
    await base44.entities.HRRequest.update(req.id, { ...editData, breach_status, timeline: newTimeline });
    fetchData();
  };

  const viewReq = (req) => {
    // On mobile use sub-route; on desktop use modal
    if (window.innerWidth < 768) {
      navigate(`/request/${req.id}`);
    } else {
      setViewingReq(req);
    }
  };

  const branches = ["All", ...new Set(requests.map(r => r.branch).filter(Boolean))];
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

  if (user?.role === "anonymous") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClipboardList className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Access Restricted</h2>
        <p className="text-gray-500 max-w-md">Your account is pending approval. Please contact an Admin to grant you access to the HR Tracker.</p>
      </div>
    );
  }

  return (
    <>
    {viewingReq && (
      <DetailsModal
        req={viewingReq}
        onClose={() => { setViewingReq(null); fetchData(); }}
        onUpdated={handleUpdated}
        user={user}
      />
    )}
    <div className="space-y-6">
      {showWelcome && (
        <WelcomeScreen user={user} onDismiss={() => { sessionStorage.setItem("hr_welcomed", "1"); setShowWelcome(false); }} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, subject, branch..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 min-w-[120px] bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "Pending", "In Progress", "Completed", "Waived/Cancelled"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="flex-1 min-w-[120px] bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile card list (< md) */}
      <div className="md:hidden">
        <PullToRefresh onRefresh={fetchData}>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No requests found.</p>
              </div>
            ) : filtered.map(req => (
              <MobileRequestCard
                key={req.id}
                req={req}
                sla={getSLA(req)}
                isEditing={editingId === req.id}
                editData={editData}
                setEditData={setEditData}
                onView={() => viewReq(req)}
                onStartEdit={() => startEdit(req)}
                onSaveEdit={() => saveEdit(req)}
                onCancelEdit={() => setEditingId(null)}
                hasNOD={hasNOD}
              />
            ))}
          </div>
        </PullToRefresh>
      </div>

      {/* Desktop table (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  {["Date Submitted", "Branch", "Subject", "Requested By", "SLA", "Status", "Date Started", "Date Completed", "Breach", "Form Attachment", "HR Attachments", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req, i) => {
                  const isEditing = editingId === req.id;
                  const sla = getSLA(req);
                  const hrAtts = Array.isArray(req.hr_attachments) ? req.hr_attachments : [];
                  return (
                    <tr key={req.id} className={`hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {req.created_date ? format(new Date(req.created_date), "MMM d, yyyy") : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{req.branch || "—"}</td>
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
                          <Select value={editData.status} onValueChange={val => setEditData({ ...editData, status: val })}>
                            <SelectTrigger className="border-gray-200 rounded-lg text-xs h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Pending", "In Progress", "Completed", "Waived/Cancelled"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        ) : (
                          <span className="text-gray-300 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => viewReq(req)}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold"
                        >
                          <Paperclip className="w-3 h-3" />
                          {hrAtts.length > 0 ? `${hrAtts.length} file${hrAtts.length > 1 ? "s" : ""}` : "Add"}
                        </button>
                        {req.subject === "NTE Request" && !hasNOD(req) && (
                          <div className="text-xs text-orange-500 mt-0.5">NOD missing</div>
                        )}
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
                            <button onClick={() => viewReq(req)}
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
    </>
  );
}

export default HRTrackerList;