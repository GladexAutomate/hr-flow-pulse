import { Link, useLocation, Outlet } from "react-router-dom";
import { ClipboardList, BarChart3, LayoutDashboard, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV_ITEMS = [
  { path: "/", label: "Tracker", icon: LayoutDashboard },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight">HR Hub</span>
              <span className="ml-2 text-blue-300 text-sm font-medium">Task Tracker</span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  location.pathname === path
                    ? "bg-orange-500 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <a
              href="/request-form"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 ml-2"
            >
              <ClipboardList className="w-4 h-4 text-orange-400" />
              Request Form Link
            </a>
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-blue-200 hover:bg-blue-700 hover:text-white transition-all ml-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}