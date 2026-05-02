import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generatePeriods } from "@/utils/attendanceUtils";

export default function AttendanceProposalForm() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

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
      base44.entities.Branch.list(),
      base44.entities.Department.list(),
      base44.entities.Team.list(),
      base44.entities.TeamEmployee.list(),
    ]).then(([c, b, d, t, e]) => {
      setCompanies(c); setBranches(b); setDepartments(d); setTeams(t); setAllEmployees(e);
      setLoading(false);
    });
  }, []);

  // Auto-load employees when team changes
  useEffect(() => {
    if (form.team_id) {
      const emps = allEmployees.filter(e => e.team_id === form.team_id);
      setSelectedEmployees(emps);
    } else {
      setSelectedEmployees([]);
    }
  }, [form.team_id, allEmployees]);

  const setField = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      // cascade resets
      if (key === "company_id") { next.branch_id = ""; next.department_id = ""; next.team_id = ""; }
      if (key === "branch_id") { next.department_id = ""; next.team_id = ""; }
      if (key === "department_id") { next.team_id = ""; }
      return next;
    });
  };

  const filteredBranches = branches.filter(b => b.company_id === form.company_id);
  const filteredDepts = departments.filter(d => d.branch_id === form.branch_id);
  const filteredTeams = teams.filter(t => t.department_id === form.department_id);

  const canProceed =
    form.leader_email && form.leader_name &&
    form.company_id && form.branch_id && form.department_id && form.team_id &&
    form.period_label && selectedEmployees.length > 0;

  const handleProceed = async () => {
    setSubmitting(true);
    const period = periods.find(p => p.label === form.period_label);
    const company = companies.find(c => c.id === form.company_id);
    const branch = branches.find(b => b.id === form.branch_id);
    const dept = departments.find(d => d.id === form.department_id);
    const team = teams.find(t => t.id === form.team_id);

    const proposal = await base44.entities.AttendanceProposal.create({
      ...form,
      company_name: company?.name,
      branch_name: branch?.name,
      department_name: dept?.name,
      team_name: team?.name,
      period_start: period.start,
      period_end: period.end,
      employees: selectedEmployees.map(e => ({ id: e.id, name: e.name, position: e.position || "" })),
      schedule: {},
      status: "Draft",
    });
    setSubmitting(false);
    navigate(`/attendance-scheduler/${proposal.id}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-gray-800">Attendance Proposal</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to create an attendance proposal for your team</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-5">
          {/* Leader Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "leader_name", label: "Your Name", placeholder: "Full name" },
              { key: "leader_position", label: "Position", placeholder: "Your position" },
            ].map(({ key, label, placeholder }) => (
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

          {/* Org Hierarchy */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organization</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DropdownField label="Company" value={form.company_id} onChange={v => setField("company_id", v)}
                options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Select company" />
              <DropdownField label="Branch" value={form.branch_id} onChange={v => setField("branch_id", v)}
                options={filteredBranches.map(b => ({ value: b.id, label: b.name }))} placeholder="Select branch" disabled={!form.company_id} />
              <DropdownField label="Department" value={form.department_id} onChange={v => setField("department_id", v)}
                options={filteredDepts.map(d => ({ value: d.id, label: d.name }))} placeholder="Select department" disabled={!form.branch_id} />
              <DropdownField label="Team" value={form.team_id} onChange={v => setField("team_id", v)}
                options={filteredTeams.map(t => ({ value: t.id, label: t.name }))} placeholder="Select team" disabled={!form.department_id} />
            </div>
          </div>

          {/* Period */}
          <div className="border-t border-gray-100 pt-5">
            <DropdownField label="Attendance Period" value={form.period_label} onChange={v => setField("period_label", v)}
              options={periods.map(p => ({ value: p.label, label: p.label }))} placeholder="Select period" />
          </div>

          {/* Employees */}
          {selectedEmployees.length > 0 && (
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employees ({selectedEmployees.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">{emp.name}</span>
                      {emp.position && <span className="text-xs text-gray-400 ml-2">{emp.position}</span>}
                    </div>
                    <button onClick={() => setSelectedEmployees(s => s.filter(e => e.id !== emp.id))}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            disabled={!canProceed || submitting}
            onClick={handleProceed}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 text-base"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Proceed to Attendance Creation
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
        <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl h-auto py-3 text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}