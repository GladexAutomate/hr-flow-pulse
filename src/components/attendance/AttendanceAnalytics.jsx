import { getDatesInRange, dayOfWeek } from "@/utils/attendanceUtils";
import { AlertTriangle, Users, DollarSign, TrendingUp, CalendarOff } from "lucide-react";

const DAILY_WAGE = 695;
const OFF_SHIFTS = ["OFF", "VL"];

export default function AttendanceAnalytics({ proposal }) {
  const dates = getDatesInRange(proposal.period_start, proposal.period_end);
  const employees = proposal.employees || [];
  const schedule = proposal.schedule || {};
  const totalEmployees = employees.length;

  // Per-day stats
  const dayStats = dates.map(d => {
    const statuses = employees.map(emp => {
      const cell = (schedule[emp.id] || {})[d] || {};
      return cell.shift || null;
    });
    const onDuty = statuses.filter(s => s && !OFF_SHIFTS.includes(s)).length;
    const offCount = statuses.filter(s => OFF_SHIFTS.includes(s)).length;
    const wfhCount = employees.filter(emp => {
      const cell = (schedule[emp.id] || {})[d] || {};
      return cell.wfh === "WFH";
    }).length;
    const noAssignment = statuses.filter(s => !s).length;
    return { date: d, onDuty, offCount, wfhCount, noAssignment, dailyCost: onDuty * DAILY_WAGE };
  });

  // Days with no one off
  const daysNoOneOff = dayStats.filter(d => d.offCount === 0 && d.onDuty > 0);

  // Summary totals
  const totalOnDutyDays = dayStats.reduce((a, d) => a + d.onDuty, 0);
  const totalOffDays = dayStats.reduce((a, d) => a + d.offCount, 0);
  const totalWfhDays = dayStats.reduce((a, d) => a + d.wfhCount, 0);
  const totalCost = dayStats.reduce((a, d) => a + d.dailyCost, 0);
  const avgOnDuty = dates.length > 0 ? (totalOnDutyDays / dates.length).toFixed(1) : 0;

  // Min/max manpower days
  const sortedByDuty = [...dayStats].sort((a, b) => a.onDuty - b.onDuty);
  const minDay = sortedByDuty[0];
  const maxDay = sortedByDuty[sortedByDuty.length - 1];

  return (
    <div className="mt-4 space-y-4">
      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Manpower Analytics</h4>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-4 h-4 text-blue-500" />} label="Avg Daily Manpower" value={`${avgOnDuty} / ${totalEmployees}`} sub="employees on duty" color="blue" />
        <StatCard icon={<DollarSign className="w-4 h-4 text-green-500" />} label="Total Period Cost" value={`₱${totalCost.toLocaleString()}`} sub={`@ ₱${DAILY_WAGE}/day`} color="green" />
        <StatCard icon={<CalendarOff className="w-4 h-4 text-orange-500" />} label="Total OFF/VL Days" value={totalOffDays} sub={`${totalWfhDays} WFH days`} color="orange" />
        <StatCard icon={<AlertTriangle className="w-4 h-4 text-red-500" />} label="No Day-Off Days" value={daysNoOneOff.length} sub="days where no one is off" color="red" />
      </div>

      {/* Daily Manpower Table */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Daily Breakdown
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Day</th>
                <th className="px-3 py-2 text-center">On Duty</th>
                <th className="px-3 py-2 text-center">OFF / VL</th>
                <th className="px-3 py-2 text-center">WFH</th>
                <th className="px-3 py-2 text-center">Daily Cost</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {dayStats.map((d, i) => {
                const noOneOff = d.offCount === 0 && d.onDuty > 0;
                const lowManpower = d.onDuty < Math.ceil(totalEmployees / 2);
                return (
                  <tr key={d.date} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="px-3 py-2 font-medium text-gray-700">{d.date.slice(5)}</td>
                    <td className="px-3 py-2 text-gray-500">{dayOfWeek(d.date)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-bold text-blue-700">{d.onDuty}</span>
                      <span className="text-gray-400"> / {totalEmployees}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-semibold ${d.offCount === 0 ? "text-red-500" : "text-gray-600"}`}>{d.offCount}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{d.wfhCount}</td>
                    <td className="px-3 py-2 text-center font-semibold text-green-700">₱{d.dailyCost.toLocaleString()}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {noOneOff && <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded">No Day-Off</span>}
                        {lowManpower && <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-1.5 py-0.5 rounded">Low Manpower</span>}
                        {!noOneOff && !lowManpower && <span className="bg-green-100 text-green-600 text-xs font-semibold px-1.5 py-0.5 rounded">OK</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      {daysNoOneOff.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {daysNoOneOff.length} day(s) with no employee on OFF/VL:
          </p>
          <p className="text-xs text-red-600">
            {daysNoOneOff.map(d => `${d.date.slice(5)} (${dayOfWeek(d.date)})`).join(", ")}
          </p>
        </div>
      )}

      {/* Min/Max highlights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-orange-700">Lowest Manpower Day</p>
          <p className="text-lg font-extrabold text-orange-600">{minDay?.onDuty} on duty</p>
          <p className="text-xs text-orange-500">{minDay?.date.slice(5)} ({dayOfWeek(minDay?.date)}) · ₱{minDay?.dailyCost.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-blue-700">Highest Manpower Day</p>
          <p className="text-lg font-extrabold text-blue-600">{maxDay?.onDuty} on duty</p>
          <p className="text-xs text-blue-500">{maxDay?.date.slice(5)} ({dayOfWeek(maxDay?.date)}) · ₱{maxDay?.dailyCost.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    orange: "bg-orange-50 border-orange-200",
    red: "bg-red-50 border-red-200",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs font-semibold text-gray-600">{label}</span></div>
      <p className="text-xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}