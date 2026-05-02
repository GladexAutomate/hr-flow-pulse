import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * Inline cascading org assignment for a single employee row.
 * Branches and departments are derived from Airtable employee data (strings).
 * Props: emp, companies, allTeams, atEmployees, onSaved
 */
export default function OrgAssignCell({ emp, companies, allTeams, atEmployees, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [companyId, setCompanyId] = useState(emp.org_company_id || "");
  const [branchName, setBranchName] = useState(emp.org_branch_id || "");
  const [deptName, setDeptName] = useState(emp.org_department_id || "");
  const [teamId, setTeamId] = useState(emp.org_team_id || "");
  const [saving, setSaving] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!editing) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setEditing(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  // Derive branches and departments from AT employee data
  const companyEmployees = atEmployees.filter(e => e.org_company_id === companyId);
  const branches = [...new Set(companyEmployees.map(e => e.branch).filter(Boolean))].sort();
  const branchEmployees = companyEmployees.filter(e => e.branch === branchName);
  const departments = [...new Set(branchEmployees.map(e => e.department).filter(Boolean))].sort();
  const teams = allTeams.filter(t =>
    t.company_id === companyId &&
    t.branch_name === branchName &&
    t.dept_name === deptName
  );

  const companyName = companies.find(c => c.id === companyId)?.name || "";
  const teamName = allTeams.find(t => t.id === teamId)?.name || "";

  const handleCompany = (id) => { setCompanyId(id); setBranchName(""); setDeptName(""); setTeamId(""); };
  const handleBranch = (name) => { setBranchName(name); setDeptName(""); setTeamId(""); };
  const handleDept = (name) => { setDeptName(name); setTeamId(""); };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.AirtableEmployee.update(emp.id, {
      org_company_id: companyId,
      org_branch_id: branchName,
      org_department_id: deptName,
      org_team_id: teamId,
    });
    setSaving(false);
    setEditing(false);
    onSaved({ ...emp, org_company_id: companyId, org_branch_id: branchName, org_department_id: deptName, org_team_id: teamId });
  };

  if (!editing) {
    const hasAny = companyId || branchName || deptName || teamId;
    return (
      <td className="px-3 py-2 whitespace-nowrap" colSpan={4}>
        <button
          onClick={() => setEditing(true)}
          className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border transition-all ${
            hasAny
              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500"
          }`}
        >
          {hasAny ? (
            <span className="max-w-[280px] truncate">
              {[companyName, branchName, deptName, teamName].filter(Boolean).join(" › ")}
            </span>
          ) : (
            <span>Assign org…</span>
          )}
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </button>
      </td>
    );
  }

  return (
    <td className="px-3 py-2" colSpan={4} ref={ref}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Company */}
        <select
          value={companyId}
          onChange={e => handleCompany(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">Company…</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Branch — from AT data */}
        <select
          value={branchName}
          onChange={e => handleBranch(e.target.value)}
          disabled={!companyId}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white disabled:opacity-40"
        >
          <option value="">Branch…</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Department — from AT data */}
        <select
          value={deptName}
          onChange={e => handleDept(e.target.value)}
          disabled={!branchName}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white disabled:opacity-40"
        >
          <option value="">Dept…</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Team */}
        <select
          value={teamId}
          onChange={e => setTeamId(e.target.value)}
          disabled={!deptName}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white disabled:opacity-40"
        >
          <option value="">Team…</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-lg p-1.5 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setCompanyId(emp.org_company_id || "");
            setBranchName(emp.org_branch_id || "");
            setDeptName(emp.org_department_id || "");
            setTeamId(emp.org_team_id || "");
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg p-1.5 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  );
}