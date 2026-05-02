import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDatesInRange, dayOfWeek, getShift } from "@/utils/attendanceUtils";
import { Calendar, AlertCircle } from "lucide-react";

function ReadOnlyScheduleGrid({ proposal }) {
  const dates = getDatesInRange(proposal.period_start, proposal.period_end);
  const schedule = proposal.schedule || {};

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="border-collapse text-xs w-full">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="px-3 py-2 text-left min-w-[140px] sticky left-0 bg-blue-900 z-10">Employee</th>
            {dates.map(d => (
              <th key={d} className="px-2 py-2 text-center whitespace-nowrap min-w-[70px]">
                {d.slice(5)}<br /><span className="text-blue-200 font-normal">{dayOfWeek(d)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(proposal.employees || []).map((emp, i) => (
            <tr key={emp.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap sticky left-0 bg-inherit border-r border-gray-200 z-10">{emp.name}</td>
              {dates.map(d => {
                const cell = (schedule[emp.id] || {})[d] || {};
                const shift = cell.shift ? getShift(cell.shift) : null;
                return (
                  <td key={d} className="px-1 py-1 border border-gray-100 text-center">
                    {shift ? (
                      <div style={{ background: shift.color, color: shift.text }} className="rounded px-1 py-0.5 font-semibold text-white">
                        {cell.shift === "Custom" ? (cell.customLabel || "Custom") : shift.label}
                        {cell.wfh && <div className="text-xs opacity-80">{cell.wfh}</div>}
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

export default function PublicSchedule() {
  const { branch, department } = useParams();
  const [proposals, setProposals] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await base44.entities.AttendanceProposal.filter({
        status: "Approved",
        branch_name: decodeURIComponent(branch),
        department_name: decodeURIComponent(department)
      }, "-updated_date", 100);

      setProposals(data);

      // Extract unique months from proposals
      const months = new Set();
      data.forEach(p => {
        const month = p.period_start?.slice(0, 7);
        if (month) months.add(month);
      });
      setAvailableMonths(Array.from(months).sort().reverse());
      setLoading(false);
    };
    load();
  }, [branch, department]);

  const filtered = proposals.filter(p => p.period_start?.startsWith(selectedMonth));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
         <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
           <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
             Schedule Dashboard
           </h1>

          {/* Month Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-semibold text-gray-700">Select Month:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.map(month => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(year, parseInt(monthNum) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                return <option key={month} value={month}>{monthName}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No schedules found for this month.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map(proposal => (
              <div key={proposal.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">{proposal.team_name}</h2>
                  <p className="text-blue-100 text-sm mt-1">{proposal.period_label}</p>
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
    </div>
  );
}