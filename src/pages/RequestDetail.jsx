import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import HRAttachmentsPanel from "../components/HRAttachmentsPanel";
import RecordTimeline from "../components/RecordTimeline";
import { ArrowLeft } from "lucide-react";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    base44.entities.HRRequest.filter({ id }).then(data => {
      if (data?.length) setReq(data[0]);
      setLoading(false);
    });
  }, [id]);

  const handleUpdated = async () => {
    const fresh = await base44.entities.HRRequest.filter({ id });
    if (fresh?.length) setReq(fresh[0]);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  if (!req) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <p>Request not found.</p>
      <button onClick={() => navigate(-1)} className="mt-3 text-blue-500 text-sm">← Back</button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-base truncate">{req.requested_by}</h2>
          <p className="text-xs text-gray-400 truncate">{req.subject}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-4 mb-4">
        {["details", "attachments", "timeline"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? "bg-blue-800 text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {tab === "details" && (
          <div className="space-y-3 text-sm bg-white rounded-2xl border border-gray-100 p-4">
            <div><span className="font-semibold text-gray-600">Branch:</span> <span className="text-gray-800">{req.branch || "—"}</span></div>
            <div><span className="font-semibold text-gray-600">Subject:</span> <span className="text-gray-800">{req.subject}</span></div>
            {req.resource_type && <div><span className="font-semibold text-gray-600">Resource Type:</span> <span className="text-gray-800">{req.resource_type}</span></div>}
            <div><span className="font-semibold text-gray-600">Requested By:</span> <span className="text-gray-800">{req.requested_by}</span></div>
            <div><span className="font-semibold text-gray-600">Email:</span> <span className="text-gray-800">{req.email_address}</span></div>
            {req.subject === "NTE Request" && <div><span className="font-semibold text-gray-600">NTE To:</span> <span className="text-gray-800">{req.nte_to || "—"}</span></div>}
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
          <HRAttachmentsPanel req={req} onUpdated={handleUpdated} currentUser={user} />
        )}
        {tab === "timeline" && (
          <RecordTimeline timeline={req.timeline} />
        )}
      </div>
    </div>
  );
}