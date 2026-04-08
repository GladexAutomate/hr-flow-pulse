import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = { Valid: "#10b981", Breached: "#ef4444", Pending: "#94a3b8" };

export default function Reports() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    base44.entities.HRRequest.list("-created_date", 500).then(data => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  const years = [...new Set(requests.map(r => getYear(new Date(r.created_date))))].sort().reverse();

  const monthlyData = MONTHS.map((month, idx) => {
    const monthReqs = requests.filter(r => {
      const d = new Date(r.created_date);
      return getMonth(d) === idx && getYear(d) === year;
    });
    return {
      month,
      Total: monthReqs.length,
      Valid: monthReqs.filter(r => r.breach_status === "Valid").length,
      Breached: monthReqs.filter(r => r.breach_status === "Breached").length,
      Pending: monthReqs.filter(r => r.breach_status === "Pending").length,
    };
  });

  const yearReqs = requests.filter(r => getYear(new Date(r.created_date)) === year);
  const totalValid = yearReqs.filter(r => r.breach_status === "Valid").length;
  const totalBreached = yearReqs.filter(r => r.breach_status === "Breached").length;
  const totalPending = yearReqs.filter(r => r.breach_status === "Pending").length;

  const pieData = [
    { name: "Valid", value: totalValid },
    { name: "Breached", value: totalBreached },
    { name: "Pending", value: totalPending },
  ].filter(d => d.value > 0);

  // By subject
  const subjectData = [...new Set(requests.map(r => r.subject))].map(subject => {
    const s = yearReqs.filter(r => r.subject === subject);
    return {
      subject: subject.replace(" Request", ""),
      Valid: s.filter(r => r.breach_status === "Valid").length,
      Breached: s.filter(r => r.breach_status === "Breached").length,
      Total: s.length,
    };
  });

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Monthly SLA compliance overview</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          {(years.length ? years : [new Date().getFullYear()]).map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: yearReqs.length, icon: TrendingUp, color: "from-blue-500 to-blue-700", iconBg: "bg-blue-400" },
          { label: "Valid (On Time)", value: totalValid, icon: CheckCircle, color: "from-emerald-500 to-emerald-700", iconBg: "bg-emerald-400" },
          { label: "Breached (Late)", value: totalBreached, icon: AlertTriangle, color: "from-red-500 to-red-700", iconBg: "bg-red-400" },
          { label: "Pending", value: totalPending, icon: Clock, color: "from-yellow-400 to-yellow-600", iconBg: "bg-yellow-300" },
        ].map(({ label, value, icon: Icon, color, iconBg }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3 bg-opacity-50`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-extrabold">{value}</div>
            <div className="text-sm opacity-80 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Monthly Breakdown — Valid vs Breached</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barSize={16} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Valid" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Breached" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Overall SLA Status</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[d.name] }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* By Subject */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">SLA Compliance by Request Type</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={subjectData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Valid" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Breached" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Monthly Summary Table</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
            <tr>
              {["Month", "Total", "Valid", "Breached", "Pending", "Compliance Rate"].map(h => (
                <th key={h} className="px-5 py-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {monthlyData.map((row, i) => {
              const completed = row.Valid + row.Breached;
              const rate = completed > 0 ? Math.round((row.Valid / completed) * 100) : null;
              return (
                <tr key={row.month} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-5 py-3 font-semibold text-gray-700">{row.month} {year}</td>
                  <td className="px-5 py-3 text-gray-600">{row.Total}</td>
                  <td className="px-5 py-3"><span className="text-emerald-600 font-semibold">{row.Valid}</span></td>
                  <td className="px-5 py-3"><span className="text-red-500 font-semibold">{row.Breached}</span></td>
                  <td className="px-5 py-3 text-gray-400">{row.Pending}</td>
                  <td className="px-5 py-3">
                    {rate !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                          {rate}%
                        </span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">N/A</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}