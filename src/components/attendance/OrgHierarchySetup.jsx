import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronRight, Building2, GitBranch, LayoutGrid, Users, Pencil } from "lucide-react";

function CreateDialog({ title, onSave, onClose, initialValue = "", saveLabel = "Create" }) {
  const [name, setName] = useState(initialValue);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim())}
          placeholder="Enter name..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => name.trim() && onSave(name.trim())}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, label, color, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 ${color}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function OrgHierarchySetup() {
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [atEmployees, setAtEmployees] = useState([]);

  const [selCompany, setSelCompany] = useState(null);
  const [selBranch, setSelBranch] = useState(null); // branch name string
  const [selDept, setSelDept] = useState(null);     // dept name string
  const [selTeam, setSelTeam] = useState(null);

  const [dialog, setDialog] = useState(null); // 'company' | 'team'
  const [renaming, setRenaming] = useState(null); // { entity, item }
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [c, t, e] = await Promise.all([
      base44.entities.Company.list(),
      base44.entities.Team.list(),
      base44.entities.AirtableEmployee.list("full_name", 500),
    ]);
    setCompanies(c); setTeams(t); setAtEmployees(e);
    setLoading(false);
  };

  // Derive branches & departments from AirtableEmployee data
  // Employees are linked to a company via org_company_id
  const companyEmployees = atEmployees.filter(e => e.org_company_id === selCompany?.id);
  const atBranches = [...new Set(companyEmployees.map(e => e.branch).filter(Boolean))].sort();
  const branchEmployees = companyEmployees.filter(e => e.branch === selBranch);
  const atDepts = [...new Set(branchEmployees.map(e => e.department).filter(Boolean))].sort();

  // Teams are stored with branch_name + dept_name strings
  const filteredTeams = teams.filter(t =>
    t.company_id === selCompany?.id &&
    t.branch_name === selBranch &&
    t.dept_name === selDept
  );

  // Employees assigned to a team via org_team_id
  const filteredEmployees = atEmployees.filter(e => e.org_team_id === selTeam?.id);

  const createCompany = async (name) => {
    await base44.entities.Company.create({ name });
    setDialog(null); loadAll();
  };

  const createTeam = async (name) => {
    await base44.entities.Team.create({
      name,
      company_id: selCompany.id,
      branch_name: selBranch,
      dept_name: selDept,
      // keep these for compatibility with AttendanceProposalForm
      branch_id: selBranch,
      department_id: selDept,
    });
    setDialog(null); loadAll();
  };

  const deleteItem = async (entity, id) => {
    await base44.entities[entity].delete(id);
    loadAll();
  };

  const renameItem = async (newName) => {
    const { entity, item } = renaming;
    await base44.entities[entity].update(item.id, { name: newName });
    setRenaming(null);
    loadAll();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Companies */}
      <Section
        icon={Building2} label="Companies" color="bg-blue-50 text-blue-800"
        action={
          <button onClick={() => setDialog("company")} className="flex items-center gap-1 bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-all">
            <Plus className="w-3 h-3" /> Create
          </button>
        }
      >
        {companies.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No companies yet</p>}
        <div className="space-y-1">
          {companies.map(c => (
            <div key={c.id}
              onClick={() => { setSelCompany(c); setSelBranch(null); setSelDept(null); setSelTeam(null); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${selCompany?.id === c.id ? "bg-blue-100 text-blue-800 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 opacity-60" />{c.name}</span>
              <div className="flex items-center gap-1">
                {selCompany?.id === c.id && <ChevronRight className="w-4 h-4 text-blue-500" />}
                <button onClick={e => { e.stopPropagation(); setRenaming({ entity: "Company", item: c }); }} className="text-gray-300 hover:text-blue-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteItem("Company", c.id); }} className="text-gray-300 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Branches — from Airtable data */}
      <Section
        icon={GitBranch}
        label={selCompany ? `Branches — ${selCompany.name}` : "Branches"}
        color="bg-purple-50 text-purple-800"
      >
        {!selCompany && <p className="text-gray-400 text-sm text-center py-4">Select a company first</p>}
        {selCompany && atBranches.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No branches found in Airtable data for this company</p>
        )}
        <div className="space-y-1">
          {atBranches.map(branchName => (
            <div key={branchName}
              onClick={() => { setSelBranch(branchName); setSelDept(null); setSelTeam(null); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${selBranch === branchName ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 opacity-60" />{branchName}</span>
              {selBranch === branchName && <ChevronRight className="w-4 h-4 text-purple-500" />}
            </div>
          ))}
        </div>
      </Section>

      {/* Departments — from Airtable data */}
      <Section
        icon={LayoutGrid}
        label={selBranch ? `Departments — ${selBranch}` : "Departments"}
        color="bg-green-50 text-green-800"
      >
        {!selBranch && <p className="text-gray-400 text-sm text-center py-4">Select a branch first</p>}
        {selBranch && atDepts.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No departments found in Airtable data for this branch</p>
        )}
        <div className="space-y-1">
          {atDepts.map(deptName => (
            <div key={deptName}
              onClick={() => { setSelDept(deptName); setSelTeam(null); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${selDept === deptName ? "bg-green-100 text-green-800 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5 opacity-60" />{deptName}</span>
              {selDept === deptName && <ChevronRight className="w-4 h-4 text-green-500" />}
            </div>
          ))}
        </div>
      </Section>

      {/* Teams — manually created */}
      <Section
        icon={Users}
        label={selDept ? `Teams — ${selDept}` : "Teams"}
        color="bg-orange-50 text-orange-800"
        action={selDept && (
          <button onClick={() => setDialog("team")} className="flex items-center gap-1 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-all">
            <Plus className="w-3 h-3" /> Create
          </button>
        )}
      >
        {!selDept && <p className="text-gray-400 text-sm text-center py-4">Select a department first</p>}
        {selDept && filteredTeams.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No teams yet</p>}
        <div className="space-y-1">
          {filteredTeams.map(t => (
            <div key={t.id}
              onClick={() => setSelTeam(t)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${selTeam?.id === t.id ? "bg-orange-100 text-orange-800 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 opacity-60" />{t.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); setRenaming({ entity: "Team", item: t }); }} className="text-gray-300 hover:text-orange-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteItem("Team", t.id); }} className="text-gray-300 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Employees panel — sourced from AirtableEmployee */}
      {selTeam && (
        <div className="lg:col-span-2 xl:col-span-4">
          <Section
            icon={Users} label={`Employees — ${selTeam.name}`} color="bg-gray-50 text-gray-800"
            action={
              <a
                href="/airtable-employees"
                className="flex items-center gap-1 bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
              >
                <Plus className="w-3 h-3" /> Assign Employees
              </a>
            }
          >
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                <p>No employees assigned to this team yet.</p>
                <p className="mt-1 text-xs">Go to <a href="/airtable-employees" className="text-orange-500 underline">Airtable Employee List</a> and set the Org Assignment for employees.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">{emp.full_name}</div>
                      {emp.position && <div className="text-xs text-gray-500">{emp.position}</div>}
                      {emp.status && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block ${emp.status?.toUpperCase() === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {emp.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Dialogs */}
      {dialog === "company" && <CreateDialog title="Create Company" onSave={createCompany} onClose={() => setDialog(null)} />}
      {dialog === "team" && <CreateDialog title={`Create Team under ${selDept}`} onSave={createTeam} onClose={() => setDialog(null)} />}

      {renaming && (
        <CreateDialog
          title={`Rename ${renaming.entity}`}
          initialValue={renaming.item.name}
          saveLabel="Rename"
          onSave={renameItem}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}