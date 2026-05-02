import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * Inline cascading org assignment for a single employee row.
 * Branches and departments are derived from Airtable employee data (strings).
 * Props: emp, companies, allTeams, atEmployees, onSaved
 */
export default function OrgAssignCell({ emp, companies, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [companyId, setCompanyId] = useState(emp.org_company_id || "");
  const [saving, setSaving] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!editing) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setEditing(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing]);

  const companyName = companies.find(c => c.id === companyId)?.name || "";

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.AirtableEmployee.update(emp.id, { org_company_id: companyId });
    setSaving(false);
    setEditing(false);
    onSaved({ ...emp, org_company_id: companyId });
  };

  if (!editing) {
    return (
      <td className="px-3 py-2 whitespace-nowrap" colSpan={4}>
        <button
          onClick={() => setEditing(true)}
          className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border transition-all ${
            companyId
              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500"
          }`}
        >
          {companyId ? <span>{companyName}</span> : <span>Assign company…</span>}
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </button>
      </td>
    );
  }

  return (
    <td className="px-3 py-2" colSpan={4} ref={ref}>
      <div className="flex items-center gap-2">
        <select
          value={companyId}
          onChange={e => setCompanyId(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          <option value="">Company…</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-lg p-1.5 transition-all">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { setEditing(false); setCompanyId(emp.org_company_id || ""); }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg p-1.5 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  );
}