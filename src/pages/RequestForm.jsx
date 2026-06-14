import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Upload, Loader2, ClipboardList } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const BRANCHES = ["Gladex Main", "POTB", "Robinsons Manila", "SM Manila", "Klikk"];

const SUBJECTS = [
  "NTE Request",
  "Resource Request",
  "General Announcement Request",
  "WFH Request",
  "COE (Certificate of Employment)",
  "ITR (Income Tax Return)",
  "LAST PAY",
  "ATD (Authority to Deduct)",
  "Others",
];

const RESOURCE_TYPES = ["Rank and File", "Supervisory", "Managerial"];
const RESOURCE_SLA = { "Rank and File": 15, "Supervisory": 20, "Managerial": 30 };
const SLA_MAP = {
  "NTE Request": 8,
  "General Announcement Request": 2,
  "WFH Request": 2,
  "COE (Certificate of Employment)": 2,
  "ITR (Income Tax Return)": 7,
  "LAST PAY": 30,
  "ATD (Authority to Deduct)": 7,
  "Others": 7,
};

function getSLA(subject, resourceType) {
  if (subject === "Resource Request") return RESOURCE_SLA[resourceType] || 15;
  return SLA_MAP[subject] || 7;
}

function InputField({ label, name, value, onChange, required, type = "text", placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder || label}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, required, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      <Select value={value} onValueChange={val => onChange({ target: { name, value: val } })} required={required}>
        <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 h-auto text-gray-700">
          <SelectValue placeholder={`Select ${label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value || o} value={o.value || o}>{o.label || o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function RequestForm() {
  const [subject, setSubject] = useState("");
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
    setForm({});
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let file_base64 = null;
      let file_name = null;
      if (file) {
        file_base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        file_name = file.name;
      }
      const sla_days = getSLA(subject, form.resource_type);
      await base44.functions.invoke('submitHRRequest', {
        subject,
        ...form,
        file_base64,
        file_name,
        status: "Pending",
        sla_days,
        breach_status: "Pending",
        timeline: [{
          timestamp: new Date().toISOString(),
          action: "Request Submitted",
          user: form.email_address || "Requester",
          details: `Subject: ${subject}`,
        }],
      });
      setSubmitted(true);
    } catch (err) {
      setError("Submission failed: " + (err?.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const showBranch = !["ATD (Authority to Deduct)"].includes(subject);
  const showFile = ["NTE Request", "Resource Request", "General Announcement Request", "WFH Request", "COE (Certificate of Employment)", "Others"].includes(subject);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Request Submitted!</h2>
          <p className="text-gray-500 mb-4">Your HR request has been received. The HR team will process it shortly.</p>
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-4 mb-8 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Subject</span>
              <span className="text-gray-800 font-semibold">{subject}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Date Submitted</span>
              <span className="text-gray-800 font-semibold">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setSubject(""); setForm({}); setFile(null); }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-start sm:items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-md mb-4 sm:mb-6">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            <span className="font-bold text-blue-800 text-base sm:text-lg">HR Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">People and Culture Request Form</h1>
          <p className="text-gray-500 text-sm sm:text-base">Fill out the form below and our People and Culture team will get back to you.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 space-y-4 sm:space-y-6">

          {/* Subject — always visible first */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-orange-500">*</span>
            </label>
            <Select value={subject} onValueChange={val => handleSubjectChange({ target: { value: val } })}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 h-auto text-gray-700">
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fields based on subject */}
          {subject && (
            <>
              {/* Branch */}
              {showBranch && (
                <SelectField label="Branch" name="branch" value={form.branch || ""} onChange={handleChange} required options={BRANCHES} />
              )}

              {/* NTE Request */}
              {subject === "NTE Request" && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Details of Request <span className="text-orange-500">*</span></label>
                    <textarea name="details" value={form.details || ""} onChange={handleChange} required rows={4}
                      placeholder="Describe your request in detail..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
                  </div>
                </>
              )}

              {/* Resource Request */}
              {subject === "Resource Request" && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                  <SelectField label="Resource Type" name="resource_type" value={form.resource_type || ""} onChange={handleChange} required
                    options={RESOURCE_TYPES.map(r => ({ value: r, label: `${r} (${RESOURCE_SLA[r]} days SLA)` }))} />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Details of Request <span className="text-orange-500">*</span></label>
                    <textarea name="details" value={form.details || ""} onChange={handleChange} required rows={4}
                      placeholder="Describe your request in detail..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
                  </div>
                </>
              )}

              {/* General Announcement / WFH / Others */}
              {["General Announcement Request", "WFH Request", "Others"].includes(subject) && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Details of Request <span className="text-orange-500">*</span></label>
                    <textarea name="details" value={form.details || ""} onChange={handleChange} required rows={4}
                      placeholder="Describe your request in detail..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
                  </div>
                </>
              )}

              {/* COE */}
              {subject === "COE (Certificate of Employment)" && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="Purpose of Request" name="purpose" value={form.purpose || ""} onChange={handleChange} required placeholder="e.g. For visa application" />
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                </>
              )}

              {/* ITR */}
              {subject === "ITR (Income Tax Return)" && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="TIN" name="tin" value={form.tin || ""} onChange={handleChange} required placeholder="000-000-000" />
                  <InputField label="Address" name="address" value={form.address || ""} onChange={handleChange} required placeholder="Your complete address" />
                  <InputField label="Birthday" name="bday" value={form.bday || ""} onChange={handleChange} required type="date" />
                  <InputField label="Employment Date" name="employment_date" value={form.employment_date || ""} onChange={handleChange} required type="date" />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Summary of Compensation <span className="text-orange-500">*</span></label>
                    <textarea name="compensation_summary" value={form.compensation_summary || ""} onChange={handleChange} required rows={3}
                      placeholder="e.g. Basic salary, allowances, bonuses..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
                  </div>
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                </>
              )}

              {/* LAST PAY */}
              {subject === "LAST PAY" && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="Department" name="department" value={form.department || ""} onChange={handleChange} required placeholder="Your department" />
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                </>
              )}

              {/* ATD */}
              {subject === "ATD (Authority to Deduct)" && (
                <>
                  <InputField label="Name" name="requested_by" value={form.requested_by || ""} onChange={handleChange} required placeholder="Your full name" />
                  <InputField label="Department" name="department" value={form.department || ""} onChange={handleChange} required placeholder="Your department" />
                  <InputField label="Amount" name="amount" value={form.amount || ""} onChange={handleChange} required placeholder="e.g. 500.00" />
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reason of ATD <span className="text-orange-500">*</span></label>
                    <textarea name="reason_of_atd" value={form.reason_of_atd || ""} onChange={handleChange} required rows={3}
                      placeholder="Explain the reason for the authority to deduct..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
                  </div>
                  <InputField label="Email Address" name="email_address" value={form.email_address || ""} onChange={handleChange} required type="email" placeholder="your@email.com" />
                </>
              )}

              {/* File Upload — only for applicable subjects */}
              {showFile && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attach File <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:border-orange-400 transition-all bg-gray-50">
                    <Upload className="w-5 h-5 text-orange-400" />
                    <span className="text-gray-500 text-sm">{file ? file.name : "Click to upload a file"}</span>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : "Submit Request"}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mt-3">
                  {error}
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}