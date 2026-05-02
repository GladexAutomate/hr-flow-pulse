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

function EditEmployeeDialog({ emp, onSave, onClose }) {
  const [form, setForm] = useState({ name: emp.name, email: emp.email || "", position: emp.position || "" });
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
      <h3 className="font-bold text-gray-800 text-lg">Edit Employee</h3>
      {["name", "email", "position"].map(field => (
        <input key={field} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ))}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
        <button disabled={!form.name.trim()} onClick={() => onSave(form)}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold">
          Save
        </button>
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
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selCompany, setSelCompany] = useState(null);
  const [selBranch, setSelBranch] = useState(null);
  const [selDept, setSelDept] = useState(null);
  const [selTeam, setSelTeam] = useState(null);

  const [dialog, setDialog] = useState(null); // 'company'|'branch'|'dept'|'team'|'employee'
  const [renaming, setRenaming] = useState(null); // { entity, item }
  const [loading, setLoading] = useState(true);

  // Employee dialog state
  const [empForm, setEmpForm] = useState({ name: "", email: "", position: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [c, b, d, t, e] = await Promise.all([
      base44.entities.Company.list(),
      base44.entities.Branch.list(),
      base44.entities.Department.list(),
      base44.entities.Team.list(),
      base44.entities.TeamEmployee.list(),
    ]);
    setCompanies(c); setBranches(b); setDepartments(d); setTeams(t); setEmployees(e);
    setLoading(false);
  };

  const createCompany = async (name) => {
    await base44.entities.Company.create({ name });
    setDialog(null); loadAll();
  };

  const createBranch = async (name) => {
    await base44.entities.Branch.create({ name, company_id: selCompany.id });
    setDialog(null); loadAll();
  };

  const createDept = async (name) => {
    await base44.entities.Department.create({ name, branch_id: selBranch.id, company_id: selCompany.id });
    setDialog(null); loadAll();
  };

  const createTeam = async (name) => {
    await base44.entities.Team.create({ name, department_id: selDept.id, branch_id: selBranch.id, company_id: selCompany.id });
    setDialog(null); loadAll();
  };

  const createEmployee = async () => {
    if (!empForm.name.trim()) return;
    await base44.entities.TeamEmployee.create({
      ...empForm,
      team_id: selTeam.id,
      department_id: selDept.id,
      branch_id: selBranch.id,
      company_id: selCompany.id,
    });
    setEmpForm({ name: "", email: "", position: "" });
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

  const filteredBranches = branches.filter(b => b.company_id === selCompany?.id);
  const filteredDepts = departments.filter(d => d.branch_id === selBranch?.id);
  const filteredTeams = teams.filter(t => t.department_id === selDept?.id);
  const filteredEmployees = employees.filter(e => e.team_id === selTeam?.id);

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

      {/* Branches */}
      <Section
        icon={GitBranch} label={selCompany ? `Branches — ${selCompany.name}` : "Branches"} color="bg-purple-50 text-purple-800"
        action={selCompany && (
          <button onClick={() => setDialog("branch")} className="flex items-center gap-1 bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-800 transition-all">
            <Plus className="w-3 h-3" /> Create
          </button>
        )}
      >
        {!selCompany && <p className="text-gray-400 text-sm text-center py-4">Select a company first</p>}
        {selCompany && filteredBranches.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No branches yet</p>}
        <div className="space-y-1">
          {filteredBranches.map(b => (
            <div key={b.id}
              onClick={() => { setSelBranch(b); setSelDept(null); setSelTeam(null); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${selBranch?.id === b.id ? "bg-purple-100 text-purple-800 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="flex items-center gap-2"><GitBranch className="w-3.5 h-3.5 opacity-60" />{b.name}</span>
              <div className="flex items-center gap-1">
                {selBranch?.id === b.id && <ChevronRight className="w-4 h-4 text-purple-500" />}
                <button onClick={e => { e.stopPropagation(); setRenaming({ entity: "Branch", item: b }); }} className="text-gray-300 hover:text-purple-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteItem("Branch", b.id); }} className="text-gray-300 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Departments */}
      <Section
        icon={LayoutGrid} label={selBranch ? `Departments — ${selBranch.name}` : "Departments"} color="bg-green-50 text-green-800"
        action={selBranch && (
          <button onClick={() => setDialog("dept")} className="flex items-center gap-1 bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-800 transition-all">
            <Plus className="w-3 h-3" /> Create
          </button>
        )}
      >
        {!selBranch && <p className="text-gray-400 text-sm text-center py-4">Select a branch first</p>}
        {selBranch && filteredDepts.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No departments yet</p>}
        <div className="space-y-1">
          {filteredDepts.map(d => (
            <div key={d.id}
              onClick={() => { setSelDept(d); setSelTeam(null); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${selDept?.id === d.id ? "bg-green-100 text-green-800 font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
            >
              <span className="flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5 opacity-60" />{d.name}</span>
              <div className="flex items-center gap-1">
                {selDept?.id === d.id && <ChevronRight className="w-4 h-4 text-green-500" />}
                <button onClick={e => { e.stopPropagation(); setRenaming({ entity: "Department", item: d }); }} className="text-gray-300 hover:text-green-400 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); deleteItem("Department", d.id); }} className="text-gray-300 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Teams */}
      <Section
        icon={Users} label={selDept ? `Teams — ${selDept.name}` : "Teams"} color="bg-orange-50 text-orange-800"
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

      {/* Employees panel */}
      {selTeam && (
        <div className="lg:col-span-2 xl:col-span-4">
          <Section
            icon={Users} label={`Employees — ${selTeam.name}`} color="bg-gray-50 text-gray-800"
            action={
              <button onClick={() => setDialog("employee")} className="flex items-center gap-1 bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                <Plus className="w-3 h-3" /> Add Employee
              </button>
            }
          >
            {filteredEmployees.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No employees in this team yet</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{emp.name}</div>
                    {emp.position && <div className="text-xs text-gray-500">{emp.position}</div>}
                    {emp.email && <div className="text-xs text-blue-400">{emp.email}</div>}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => setRenaming({ entity: "TeamEmployee", item: emp })} className="text-gray-300 hover:text-gray-500 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteItem("TeamEmployee", emp.id)} className="text-gray-300 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Dialogs */}
      {dialog === "company" && <CreateDialog title="Create Company" onSave={createCompany} onClose={() => setDialog(null)} />}
      {dialog === "branch" && <CreateDialog title={`Create Branch under ${selCompany?.name}`} onSave={createBranch} onClose={() => setDialog(null)} />}
      {dialog === "dept" && <CreateDialog title={`Create Department under ${selBranch?.name}`} onSave={createDept} onClose={() => setDialog(null)} />}
      {dialog === "team" && <CreateDialog title={`Create Team under ${selDept?.name}`} onSave={createTeam} onClose={() => setDialog(null)} />}

      {renaming && renaming.entity !== "TeamEmployee" && (
        <CreateDialog
          title={`Rename ${renaming.entity}`}
          initialValue={renaming.item.name}
          saveLabel="Rename"
          onSave={renameItem}
          onClose={() => setRenaming(null)}
        />
      )}
      {renaming && renaming.entity === "TeamEmployee" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRenaming(null)}>
          <EditEmployeeDialog emp={renaming.item} onSave={async (data) => { await base44.entities.TeamEmployee.update(renaming.item.id, data); setRenaming(null); loadAll(); }} onClose={() => setRenaming(null)} />
        </div>
      )}

      {dialog === "employee" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDialog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 text-lg">Add Employee to {selTeam?.name}</h3>
            {["name", "email", "position"].map(field => (
              <input key={field} value={empForm[field]} onChange={e => setEmpForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            ))}
            <div className="flex gap-2">
              <button onClick={() => setDialog(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button disabled={!empForm.name.trim()} onClick={createEmployee}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}