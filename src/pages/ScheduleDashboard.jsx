import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getDatesInRange, dayOfWeek, getShift } from "@/utils/attendanceUtils";
import { Calendar, Filter } from "lucide-react";

function ReadOnlyScheduleGrid({ proposal }) {
  const dates = getDatesInRange(proposal.period_start, proposal.period_end);
  const schedule = proposal.schedule || {};

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="border-collapse text-xs w-full">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="px-3 py-2 text-left min-w-[120px] sticky left-0 bg-blue-900 z-10">Employee</th>
            {dates.map(d => (
              <th key={d} className="px-2 py-2 text-center whitespace-nowrap min-w-[60px]">
                {d.slice(5)}<br /><span className="text-blue-200 font-normal text-xs">{dayOfWeek(d)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(proposal.employees || []).map((emp, i) => (
            <tr key={emp.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap sticky left-0 bg-inherit border-r border-gray-200 z-10 text-xs">{emp.name}</td>
              {dates.map(d => {
                const cell = (schedule[emp.id] || {})[d] || {};
                const shift = cell.shift ? getShift(cell.shift) : null;
                return (
                  <td key={d} className="px-1 py-1 border border-gray-100 text-center">
                    {shift ? (
                      <div style={{ background: shift.color, color: shift.text }} className="rounded px-1 py-0.5 font-semibold text-white text-xs">
                        {cell.shift === "Custom" ? (cell.customLabel || "Custom") : shift.label}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ScheduleDashboard() {
  const [proposals, setProposals] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await base44.entities.AttendanceProposal.filter({
        status: "Approved"
      }, "-updated_date", 500);

      setProposals(data);

      // Extract unique branches and departments
      const branchSet = new Set();
      const deptSet = new Set();
      data.forEach(p => {
        if (p.branch_name) branchSet.add(p.branch_name);
        if (p.department_name) deptSet.add(p.department_name);
      });
      setBranches(Array.from(branchSet).sort());
      setDepartments(Array.from(deptSet).sort());
      setLoading(false);
    };
    load();
  }, []);

  const filtered = proposals.filter(p => {
    const monthMatch = p.period_start?.startsWith(selectedMonth);
    const branchMatch = selectedBranch === "All" || p.branch_name === selectedBranch;
    const deptMatch = selectedDept === "All" || p.department_name === selectedDept;
    return monthMatch && branchMatch && deptMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Schedule Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">View all approved attendance schedules across departments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Month */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Department</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
                setSelectedBranch("All");
                setSelectedDept("All");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Schedules */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No schedules found with the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(proposal => (
            <div key={proposal.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{proposal.team_name}</h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {proposal.company_name} • {proposal.branch_name} • {proposal.department_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">{proposal.period_label}</p>
                    <p className="text-blue-100 text-xs mt-0.5">Leader: {proposal.leader_name}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ReadOnlyScheduleGrid proposal={proposal} />
                {proposal.remarks && (
                  <div className="mt-4 bg-yellow-50 rounded-xl px-4 py-3 text-sm border border-yellow-200">
                    <span className="font-semibold text-yellow-800">Remarks: </span>
                    <span className="text-gray-700">{proposal.remarks}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}