import { useState, useEffect } from "react";
import { fetchEmployeesFromSupabase } from "@/lib/employeeSource";
import { RefreshCw, Search, Users } from "lucide-react";

const STATUS_COLORS = {
  "ACTIVE": "bg-green-100 text-green-700",
  "RESIGNED": "bg-red-100 text-red-600",
  "INACTIVE": "bg-gray-100 text-gray-500",
};

export default function AirtableEmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    setError(null);
    try {
      const data = await fetchEmployeesFromSupabase();
      setEmployees(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchEmployees();
      setLoading(false);
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (
      e.full_name?.toLowerCase().includes(q) ||
      e.branch?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q) ||
      e.status?.toLowerCase().includes(q) ||
      e.employee_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Airtable Employee List</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} employees from Supabase</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          Failed to load employees: {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, branch, department, position..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{employees.length === 0 ? "No employee records found in Supabase." : "No results found."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">Full Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">AT Branch</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">AT Department</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">Job Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">Employee Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((emp, i) => (
                  <tr key={emp.id} className={`hover:bg-orange-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{emp.full_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.branch || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.department || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{emp.position || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[emp.status?.toUpperCase()] || "bg-gray-100 text-gray-500"}`}>
                        {emp.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{emp.employee_code || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
