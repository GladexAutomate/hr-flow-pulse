import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { isWithinInterval, parseISO, getMonth, getYear, startOfWeek, endOfWeek, format, eachWeekOfInterval, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { TrendingUp, CheckCircle, AlertTriangle, Clock, XCircle, Calendar } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = { Valid: "#10b981", Breached: "#ef4444", Pending: "#94a3b8" };

const FACETS = [
  { key: "all", label: "All Requests", filter: () => true },
  { key: "nte", label: "NTE Request", filter: r => r.subject === "NTE Request" },
  { key: "resource", label: "Resource Request", filter: r => r.subject === "Resource Request" },
  { key: "announcement", label: "General Announcement", filter: r => r.subject === "General Announcement Request" },
  { key: "wfh", label: "WFH Request", filter: r => r.subject === "WFH Request" },
  { key: "coe", label: "COE", filter: r => r.subject === "COE (Certificate of Employment)" },
  { key: "itr", label: "ITR", filter: r => r.subject === "ITR (Income Tax Return)" },
  { key: "lastpay", label: "Last Pay", filter: r => r.subject === "LAST PAY" },
  { key: "atd", label: "ATD", filter: r => r.subject === "ATD (Authority to Deduct)" },
  { key: "others", label: "Others", filter: r => r.subject === "Others" },
];

const VIEW_MODES = ["Monthly", "Weekly", "Daily", "Custom"];

function getDateRangeData(requests, viewMode, year, startDate, endDate) {
  if (viewMode === "Monthly") {
    return MONTHS.map((month, idx) => {
      const monthReqs = requests.filter(r => {
        const d = new Date(r.created_date);
        return getYear(d) === year && getMonth(d) === idx;
      });
      return {
        label: `${month}`,
        Total: monthReqs.length,
        Valid: monthReqs.filter(r => r.breach_status === "Valid").length,
        Breached: monthReqs.filter(r => r.breach_status === "Breached").length,
        Pending: monthReqs.filter(r => r.breach_status === "Pending").length,
      };
    });
  }

  if ((viewMode === "Custom" || viewMode === "Weekly" || viewMode === "Daily") && startDate && endDate) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (viewMode === "Daily") {
      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const dayReqs = requests.filter(r => {
          const d = new Date(r.created_date);
          return d >= startOfDay(day) && d <= endOfDay(day);
        });
        return {
          label: format(day, "MMM d"),
          Total: dayReqs.length,
          Valid: dayReqs.filter(r => r.breach_status === "Valid").length,
          Breached: dayReqs.filter(r => r.breach_status === "Breached").length,
          Pending: dayReqs.filter(r => r.breach_status === "Pending").length,
        };
      });
    }

    if (viewMode === "Weekly" || viewMode === "Custom") {
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekReqs = requests.filter(r => {
          const d = new Date(r.created_date);
          return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });
        return {
          label: `${format(weekStart, "MMM d")}`,
          Total: weekReqs.length,
          Valid: weekReqs.filter(r => r.breach_status === "Valid").length,
          Breached: weekReqs.filter(r => r.breach_status === "Breached").length,
          Pending: weekReqs.filter(r => r.breach_status === "Pending").length,
        };
      });
    }
  }

  return [];
}

function filterByDateRange(requests, viewMode, year, startDate, endDate) {
  if (viewMode === "Monthly") {
    return requests.filter(r => getYear(new Date(r.created_date)) === year);
  }
  if (startDate && endDate) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return requests.filter(r => {
      const d = new Date(r.created_date);
      return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) });
    });
  }
  return requests;
}

function SummaryCards({ reqs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
      {[
        { label: "Total Requests", value: reqs.length, icon: TrendingUp, color: "from-blue-500 to-blue-700" },
        { label: "Valid (On Time)", value: reqs.filter(r => r.breach_status === "Valid").length, icon: CheckCircle, color: "from-emerald-500 to-emerald-700" },
        { label: "Breached (Late)", value: reqs.filter(r => r.breach_status === "Breached").length, icon: AlertTriangle, color: "from-red-500 to-red-700" },
        { label: "Pending", value: reqs.filter(r => r.breach_status === "Pending").length, icon: Clock, color: "from-yellow-400 to-yellow-600" },
        { label: "Waived/Cancelled", value: reqs.filter(r => r.status === "Waived/Cancelled").length, icon: XCircle, color: "from-gray-400 to-gray-600" },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
          <Icon className="w-5 h-5 mb-2 opacity-80" />
          <div className="text-3xl font-extrabold">{value}</div>
          <div className="text-xs opacity-80 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("Monthly");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return format(d, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    base44.entities.HRRequest.list("-created_date", 1000).then(data => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  const years = [...new Set(requests.map(r => getYear(new Date(r.created_date))))].sort().reverse();
  const activeFacet = FACETS.find(f => f.key === activeTab);
  const facetRequests = requests.filter(activeFacet.filter);
  const filteredRequests = filterByDateRange(facetRequests, viewMode, year, startDate, endDate);
  const chartData = getDateRangeData(facetRequests, viewMode, year, startDate, endDate);

  const totalValid = filteredRequests.filter(r => r.breach_status === "Valid").length;
  const totalBreached = filteredRequests.filter(r => r.breach_status === "Breached").length;
  const totalPending = filteredRequests.filter(r => r.breach_status === "Pending").length;
  const pieData = [
    { name: "Valid", value: totalValid },
    { name: "Breached", value: totalBreached },
    { name: "Pending", value: totalPending },
  ].filter(d => d.value > 0);

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">SLA compliance overview by request type and date range</p>
        </div>
        {viewMode === "Monthly" && (
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
            {(years.length ? years : [new Date().getFullYear()]).map(y => <option key={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-700">View:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {VIEW_MODES.map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                viewMode === m
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
              }`}>
              {m}
            </button>
          ))}
        </div>
        {viewMode !== "Monthly" && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">From:</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-full sm:w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">To:</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-full sm:w-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Facet Tabs */}
      <div className="flex flex-wrap gap-2">
        {FACETS.map(f => (
          <button key={f.key} onClick={() => setActiveTab(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === f.key
                ? "bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <SummaryCards reqs={filteredRequests} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">
            {viewMode === "Monthly" ? "Monthly" : viewMode === "Daily" ? "Daily" : "Weekly"} Breakdown — Valid vs Breached
          </h3>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data for selected range</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={14} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Valid" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Breached" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Overall SLA Status</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={COLORS[entry.name]} />)}
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

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden -mx-3 sm:mx-0">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
            <tr>
              {["Period", "Total", "Valid", "Breached", "Pending", "Compliance Rate"].map(h => (
                <th key={h} className="px-5 py-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {chartData.map((row, i) => {
              const completed = row.Valid + row.Breached;
              const rate = completed > 0 ? Math.round((row.Valid / completed) * 100) : null;
              return (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-5 py-3 font-semibold text-gray-700">{row.label}{viewMode === "Monthly" ? ` ${year}` : ""}</td>
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
                        <span className={`text-xs font-bold ${rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-yellow-600" : "text-red-500"}`}>{rate}%</span>
                      </div>
                    ) : <span className="text-gray-300 text-xs">N/A</span>}
                  </td>
                </tr>
              );
            })}
            {chartData.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No data for selected range</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}