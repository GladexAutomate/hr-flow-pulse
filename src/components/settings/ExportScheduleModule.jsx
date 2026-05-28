import { useState } from "react";
import { Download, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const FILES = [
  {
    filename: "pages/AttendanceProposalForm.jsx",
    description: "Public form to create schedule proposals",
    content: `import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generatePeriods } from "@/utils/attendanceUtils";

export default function AttendanceProposalForm() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [atEmployees, setAtEmployees] = useState([]);
  const [form, setForm] = useState({
    leader_email: "", leader_name: "", leader_position: "",
    company_id: "", branch_id: "", department_id: "", team_id: "",
    period_label: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const periods = generatePeriods(2025, 2027);

  useEffect(() => {
    Promise.all([
      base44.entities.Company.list(),
      base44.entities.Team.list(),
      base44.entities.AirtableEmployee.list("full_name", 500),
    ]).then(([c, t, e]) => { setCompanies(c); setTeams(t); setAtEmployees(e); setLoading(false); });
  }, []);

  const activeEmployees = atEmployees.filter(e => {
    const s = (e.status || "").toUpperCase();
    return s !== "RESIGNED" && s !== "TERMINATED";
  });

  const companyEmployees = activeEmployees.filter(e => e.org_company_id === form.company_id);
  const filteredBranches = [...new Set(companyEmployees.map(e => e.branch).filter(Boolean))].sort();
  const branchEmployees = companyEmployees.filter(e => e.branch === form.branch_id);
  const filteredDepts = [...new Set(branchEmployees.map(e => e.department).filter(Boolean))].sort();
  const filteredTeams = teams.filter(t =>
    t.company_id === form.company_id && t.branch_name === form.branch_id && t.dept_name === form.department_id
  );

  useEffect(() => {
    if (form.team_id) {
      const emps = atEmployees.filter(e => {
        const s = (e.status || "").toUpperCase();
        return e.org_team_id === form.team_id && s !== "RESIGNED" && s !== "TERMINATED";
      });
      setSelectedEmployees(emps);
    } else { setSelectedEmployees([]); }
  }, [form.team_id, atEmployees]);

  const setField = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "company_id") { next.branch_id = ""; next.department_id = ""; next.team_id = ""; }
      if (key === "branch_id") { next.department_id = ""; next.team_id = ""; }
      if (key === "department_id") { next.team_id = ""; }
      return next;
    });
  };

  const canProceed = form.leader_email && form.leader_name && form.company_id && form.branch_id && form.department_id && form.team_id && form.period_label && selectedEmployees.length > 0;

  const handleProceed = async () => {
    setSubmitting(true);
    const period = periods.find(p => p.label === form.period_label);
    const company = companies.find(c => c.id === form.company_id);
    const team = teams.find(t => t.id === form.team_id);
    const proposal = await base44.entities.AttendanceProposal.create({
      ...form,
      company_name: company?.name, branch_name: form.branch_id, department_name: form.department_id,
      team_name: team?.name, period_start: period.start, period_end: period.end,
      employees: selectedEmployees.map(e => ({ id: e.id, name: e.full_name, position: e.position || "" })),
      schedule: {}, status: "Draft",
    });
    setSubmitting(false);
    navigate(\`/attendance-scheduler/\${proposal.id}\`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-gray-800">Schedule Proposal</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to create a schedule proposal for your team</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{ key: "leader_name", label: "Your Name", placeholder: "Full name" }, { key: "leader_position", label: "Position", placeholder: "Your position" }].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <input value={form[key]} onChange={e => setField(key, e.target.value)} placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-orange-500">*</span></label>
            <input type="email" value={form.leader_email} onChange={e => setField("leader_email", e.target.value)} placeholder="your@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          </div>
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organization</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DropdownField label="Company" value={form.company_id} onChange={v => setField("company_id", v)} options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Select company" />
              <DropdownField label="Branch" value={form.branch_id} onChange={v => setField("branch_id", v)} options={filteredBranches.map(b => ({ value: b, label: b }))} placeholder="Select branch" disabled={!form.company_id} />
              <DropdownField label="Department" value={form.department_id} onChange={v => setField("department_id", v)} options={filteredDepts.map(d => ({ value: d, label: d }))} placeholder="Select department" disabled={!form.branch_id} />
              <DropdownField label="Team" value={form.team_id} onChange={v => setField("team_id", v)} options={filteredTeams.map(t => ({ value: t.id, label: t.name }))} placeholder="Select team" disabled={!form.department_id} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <DropdownField label="Schedule Period" value={form.period_label} onChange={v => setField("period_label", v)} options={periods.map(p => ({ value: p.label, label: p.label }))} placeholder="Select period" />
          </div>
          {selectedEmployees.length > 0 && (
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employees ({selectedEmployees.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">{emp.full_name || emp.name}</span>
                      {emp.position && <span className="text-xs text-gray-400 ml-2">{emp.position}</span>}
                    </div>
                    <button onClick={() => setSelectedEmployees(s => s.filter(e => e.id !== emp.id))} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button disabled={!canProceed || submitting} onClick={handleProceed}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 text-base">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Schedule Now
          </button>
        </div>
      </div>
    </div>
  );
}

function DropdownField({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl h-auto py-3 text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
`,
  },
  {
    filename: "pages/AttendanceRequests.jsx",
    description: "HR review/approve/reject page",
    content: `// See source: pages/AttendanceRequests in original project\n// Copy the full file content from the original project.`,
  },
  {
    filename: "pages/AttendanceScheduler.jsx",
    description: "Drag-and-drop scheduler grid",
    content: `// See source: pages/AttendanceScheduler in original project\n// Copy the full file content from the original project.`,
  },
  {
    filename: "pages/ScheduleDashboard.jsx",
    description: "View all approved schedules",
    content: `// See source: pages/ScheduleDashboard in original project\n// Copy the full file content from the original project.`,
  },
  {
    filename: "pages/PublicSchedule.jsx",
    description: "Public read-only schedule viewer",
    content: `// See source: pages/PublicSchedule in original project\n// Copy the full file content from the original project.`,
  },
];

const ENTITY_SCHEMAS = [
  {
    filename: "entities/AttendanceProposal.json",
    content: JSON.stringify({
      name: "AttendanceProposal",
      type: "object",
      properties: {
        leader_email: { type: "string" },
        leader_name: { type: "string" },
        leader_position: { type: "string" },
        company_id: { type: "string" },
        company_name: { type: "string" },
        branch_id: { type: "string" },
        branch_name: { type: "string" },
        department_id: { type: "string" },
        department_name: { type: "string" },
        team_id: { type: "string" },
        team_name: { type: "string" },
        period_label: { type: "string" },
        period_start: { type: "string" },
        period_end: { type: "string" },
        employees: { type: "array", items: { type: "object" } },
        schedule: { type: "object" },
        remarks: { type: "string" },
        status: { type: "string", enum: ["Draft", "Pending HR Review", "Approved", "Rejected"], default: "Draft" },
        rejection_note: { type: "string" },
        reviewed_by: { type: "string" },
        reviewed_at: { type: "string" },
      },
      required: ["leader_email", "leader_name", "company_id", "team_id", "period_label"],
    }, null, 2),
  },
  {
    filename: "entities/Company.json",
    content: JSON.stringify({ name: "Company", type: "object", properties: { name: { type: "string" } }, required: ["name"] }, null, 2),
  },
  {
    filename: "entities/Team.json",
    content: JSON.stringify({
      name: "Team", type: "object",
      properties: {
        name: { type: "string" }, company_id: { type: "string" },
        branch_name: { type: "string" }, dept_name: { type: "string" },
        branch_id: { type: "string" }, department_id: { type: "string" },
      },
      required: ["name", "company_id"],
    }, null, 2),
  },
  {
    filename: "entities/AppSettings.json",
    content: JSON.stringify({ name: "AppSettings", type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] }, null, 2),
  },
];

const FUNCTIONS = [
  {
    filename: "functions/sendAttendanceEmail.js",
    description: "Sends emails via Resend API",
  },
  {
    filename: "functions/generateProposalScreenshot.js",
    description: "Generates HTML for email bodies",
  },
  {
    filename: "functions/testWebhook.js",
    description: "Test webhook payloads",
  },
];

const UTILS_CONTENT = `export function generatePeriods(startYear, endYear) {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const periods = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const mid = 15;
      periods.push({ label: \`\${months[m]} 1 - \${mid}, \${y}\`, start: \`\${y}-\${String(m+1).padStart(2,'0')}-01\`, end: \`\${y}-\${String(m+1).padStart(2,'0')}-\${mid}\` });
      periods.push({ label: \`\${months[m]} \${mid+1} - \${lastDay}, \${y}\`, start: \`\${y}-\${String(m+1).padStart(2,'0')}-\${mid+1}\`, end: \`\${y}-\${String(m+1).padStart(2,'0')}-\${lastDay}\` });
    }
  }
  return periods;
}

export function getDatesInRange(start, end) {
  const dates = [];
  const cur = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  while (cur <= endD) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    dates.push(\`\${y}-\${m}-\${d}\`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export const SHIFT_TYPES = [
  { key: "Opener", label: "Opener", color: "#3b82f6", text: "#fff" },
  { key: "Mid", label: "Mid", color: "#22c55e", text: "#fff" },
  { key: "Closer", label: "Closer", color: "#f97316", text: "#fff" },
  { key: "Night", label: "Night", color: "#6b7280", text: "#fff" },
  { key: "OFF", label: "OFF", color: "#ef4444", text: "#fff" },
  { key: "VL", label: "VL", color: "#ef4444", text: "#fff" },
  { key: "Custom", label: "Custom", color: "#14b8a6", text: "#fff" },
  { key: "NoSched", label: "No Sched", color: "#f3f4f6", text: "#374151" },
];

export function getShift(key) {
  return SHIFT_TYPES.find(s => s.key === key) || SHIFT_TYPES[SHIFT_TYPES.length - 1];
}

export const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function dayOfWeek(dateStr) {
  return DAYS[new Date(dateStr + "T00:00:00").getDay()];
}
`;

const README_CONTENT = `# Schedule Request Module — Setup Guide

## Files to Copy
### Pages
- pages/AttendanceProposalForm.jsx  → route: /attendance-proposal (PUBLIC)
- pages/AttendanceScheduler.jsx     → route: /attendance-scheduler/:id (PUBLIC)
- pages/AttendanceRequests.jsx      → route: /attendance-requests (AUTH)
- pages/ScheduleDashboard.jsx       → route: /schedule-dashboard (AUTH)
- pages/PublicSchedule.jsx          → route: /schedule/:branch/:department (PUBLIC)

### Components
- components/attendance/AttendanceAnalytics.jsx
- components/attendance/OrgHierarchySetup.jsx

### Utils
- utils/attendanceUtils.js (included in this export)

### Backend Functions (copy from original project dashboard)
- functions/sendAttendanceEmail
- functions/generateProposalScreenshot
- functions/testWebhook

## Entities to Create
- AttendanceProposal (schema included)
- Company (schema included)
- Team (schema included)
- AppSettings (schema included)
- AirtableEmployee (if using Airtable sync)

## App.jsx Routes to Add
<Route path="/attendance-proposal" element={<AttendanceProposalForm />} />
<Route path="/attendance-scheduler/:id" element={<AttendanceScheduler />} />
<Route path="/schedule/:branch/:department" element={<PublicSchedule />} />
<Route element={<Layout />}>
  <Route path="/attendance-requests" element={<AttendanceRequests />} />
  <Route path="/schedule-dashboard" element={<ScheduleDashboard />} />
</Route>

## Secrets Required
- RESEND_API_KEY — for sending approval/rejection emails

## AppSettings Records to Create
| key                           | value                    |
|-------------------------------|--------------------------|
| attendance_approved_webhook   | your Make/Zapier URL     |
| attendance_rejected_webhook   | your Make/Zapier URL     |
`;

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/\//g, "__");
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAll() {
  const allFiles = [
    { filename: "utils__attendanceUtils.js", content: UTILS_CONTENT },
    { filename: "README__SETUP_GUIDE.md", content: README_CONTENT },
    ...ENTITY_SCHEMAS.map(f => ({ filename: f.filename.replace(/\//g, "__"), content: f.content })),
    ...FILES.map(f => ({ filename: f.filename.replace(/\//g, "__"), content: f.content })),
  ];

  allFiles.forEach((file, i) => {
    setTimeout(() => downloadFile(file.filename, file.content), i * 100);
  });
}

export default function ExportScheduleModule() {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadAll = () => {
    downloadAll();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-blue-600" />
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Export Schedule Module</p>
      </div>
      <p className="text-sm text-gray-500">
        Download all files needed to set up the Schedule Request module in another Base44 project.
        Includes entity schemas, utils, pages, and a setup guide.
      </p>

      <div className="grid grid-cols-1 gap-2">
        {[
          { label: "📄 README & Setup Guide", filename: "README__SETUP_GUIDE.md", content: README_CONTENT },
          { label: "🔧 utils/attendanceUtils.js", filename: "utils__attendanceUtils.js", content: UTILS_CONTENT },
          ...ENTITY_SCHEMAS.map(f => ({ label: `🗄️ ${f.filename}`, filename: f.filename.replace(/\//g, "__"), content: f.content })),
          ...FILES.map(f => ({ label: `📋 ${f.filename} — ${f.description}`, filename: f.filename.replace(/\//g, "__"), content: f.content })),
        ].map(file => (
          <div key={file.filename} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
            <span className="text-xs text-gray-700 font-medium">{file.label}</span>
            <button
              onClick={() => downloadFile(file.filename, file.content)}
              className="text-blue-600 hover:text-blue-800 transition-all ml-2 flex-shrink-0"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Button className="w-full flex items-center gap-2" onClick={handleDownloadAll}>
        {downloaded ? <CheckCircle className="w-4 h-4 text-green-300" /> : <Download className="w-4 h-4" />}
        {downloaded ? "Downloaded! Check your downloads folder" : "Download All Files"}
      </Button>

      <p className="text-xs text-gray-400">
        💡 After downloading, also manually copy <strong>pages/AttendanceRequests</strong>, <strong>pages/AttendanceScheduler</strong>, <strong>pages/ScheduleDashboard</strong>, <strong>pages/PublicSchedule</strong>, and the <strong>components/attendance/</strong> folder from this project's dashboard → Code tab.
      </p>
    </div>
  );
}