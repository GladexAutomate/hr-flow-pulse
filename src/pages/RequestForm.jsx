import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Upload, Loader2, ClipboardList } from "lucide-react";

const BRANCHES = ["Gladex Main", "POTB", "Robinsons Manila", "SM Manila", "Klikk"];
const SUBJECTS = ["NTE Request", "Resource Request", "General Announcement Request", "WFH Request", "Others"];
const RESOURCE_TYPES = ["Rank and File", "Supervisory", "Managerial"];

const RESOURCE_SLA = {
  "Rank and File": 15,
  "Supervisory": 20,
  "Managerial": 30,
};

const BASE_SLA = {
  "NTE Request": 8,
  "General Announcement Request": 2,
  "WFH Request": 2,
  "Others": 7,
};

function getSLA(subject, resourceType) {
  if (subject === "Resource Request") return RESOURCE_SLA[resourceType] || 15;
  return BASE_SLA[subject] || 7;
}

export default function RequestForm() {
  const [form, setForm] = useState({
    branch: "", subject: "", resource_type: "", details: "", requested_by: "", email_address: "",
  });
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let file_url = "";
    if (file) {
      setUploadingFile(true);
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
      setUploadingFile(false);
    }
    const sla_days = getSLA(form.subject, form.resource_type);
    await base44.entities.HRRequest.create({
      ...form,
      file_url,
      status: "Pending",
      sla_days,
      breach_status: "Pending",
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Request Submitted!</h2>
          <p className="text-gray-500 mb-8">Your HR request has been received. The HR team will process it shortly.</p>
          <button
            onClick={() => { setSubmitted(false); setForm({ branch: "", subject: "", resource_type: "", details: "", requested_by: "", email_address: "" }); setFile(null); }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-md mb-6">
            <ClipboardList className="w-6 h-6 text-orange-500" />
            <span className="font-bold text-blue-800 text-lg">HR Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">HR Request Form</h1>
          <p className="text-gray-500">Fill out the form below and our HR team will get back to you.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Branch */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Branch <span className="text-orange-500">*</span></label>
            <select name="branch" value={form.branch} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50">
              <option value="">Select branch...</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject <span className="text-orange-500">*</span></label>
            <select name="subject" value={form.subject} onChange={e => { handleChange(e); setForm(f => ({ ...f, resource_type: "" })); }} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50">
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Resource Type — only for Resource Request */}
          {form.subject === "Resource Request" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Resource Type <span className="text-orange-500">*</span></label>
              <select name="resource_type" value={form.resource_type} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50">
                <option value="">Select resource type...</option>
                {RESOURCE_TYPES.map(r => (
                  <option key={r} value={r}>{r} ({RESOURCE_SLA[r]} days SLA)</option>
                ))}
              </select>
            </div>
          )}

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Details of Request <span className="text-orange-500">*</span></label>
            <textarea name="details" value={form.details} onChange={handleChange} required rows={4}
              placeholder="Describe your request in detail..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
          </div>

          {/* Requested By */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Requested By <span className="text-orange-500">*</span></label>
            <input type="text" name="requested_by" value={form.requested_by} onChange={handleChange} required
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-orange-500">*</span></label>
            <input type="email" name="email_address" value={form.email_address} onChange={handleChange} required
              placeholder="your@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Attach File <span className="text-gray-400 font-normal">(optional)</span></label>
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:border-orange-400 transition-all bg-gray-50">
              <Upload className="w-5 h-5 text-orange-400" />
              <span className="text-gray-500 text-sm">{file ? file.name : "Click to upload a file"}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 text-lg">
            {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />{uploadingFile ? "Uploading file..." : "Submitting..."}</>) : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}