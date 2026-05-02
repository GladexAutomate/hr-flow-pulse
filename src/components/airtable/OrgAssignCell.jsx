import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * Inline cascading org assignment for a single employee row.
 * Props: emp, companies, allBranches, allDepartments, allTeams, onSaved
 */
export default function OrgAssignCell({ emp, companies, allBranches, allDepartments, allTeams, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [companyId, setCompanyId] = useState(emp.org_company_id || "");
  const [branchId, setBranchId] = useState(emp.org_branch_id || "");
  const [deptId, setDeptId] = useState(emp.org_department_id || "");
  const [teamId, setTeamId] = useState(emp.org_team_id || "");
  const [saving, setSaving] = useState(false);
  const ref = useRef();

  // Click outside to cancel
  useEffect(() => {
    if (!editing) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setEditing(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  const branches = allBranches.filter(b => b.company_id === companyId);
  const departments = allDepartments.filter(d => d.branch_id === branchId);
  const teams = allTeams.filter(t => t.department_id === deptId);

  const companyName = companies.find(c => c.id === companyId)?.name || "";
  const branchName = allBranches.find(b => b.id === branchId)?.name || "";
  const deptName = allDepartments.find(d => d.id === deptId)?.name || "";
  const teamName = allTeams.find(t => t.id === teamId)?.name || "";

  const handleCompany = (id) => { setCompanyId(id); setBranchId(""); setDeptId(""); setTeamId(""); };
  const handleBranch = (id) => { setBranchId(id); setDeptId(""); setTeamId(""); };
  const handleDept = (id) => { setDeptId(id); setTeamId(""); };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.AirtableEmployee.update(emp.id, {
      org_company_id: companyId,
      org_branch_id: branchId,
      org_department_id: deptId,
      org_team_id: teamId,
    });
    setSaving(false);
    setEditing(false);
    onSaved({ ...emp, org_company_id: companyId, org_branch_id: branchId, org_department_id: deptId, org_team_id: teamId });
  };

  if (!editing) {
    const hasAny = companyId || branchId || deptId || teamId;
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

        {/* Branch */}
        <select
          value={branchId}
          onChange={e => handleBranch(e.target.value)}
          disabled={!companyId}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white disabled:opacity-40"
        >
          <option value="">Branch…</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Department */}
        <select
          value={deptId}
          onChange={e => handleDept(e.target.value)}
          disabled={!branchId}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white disabled:opacity-40"
        >
          <option value="">Dept…</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {/* Team */}
        <select
          value={teamId}
          onChange={e => setTeamId(e.target.value)}
          disabled={!deptId}
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
          onClick={() => { setEditing(false); setCompanyId(emp.org_company_id || ""); setBranchId(emp.org_branch_id || ""); setDeptId(emp.org_department_id || ""); setTeamId(emp.org_team_id || ""); }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg p-1.5 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  );
}