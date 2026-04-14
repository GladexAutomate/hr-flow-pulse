import { Link, useLocation, Outlet } from "react-router-dom";
import { ClipboardList, BarChart3, LayoutDashboard, LogOut, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NAV_ITEMS = [
  { path: "/", label: "Tracker", icon: LayoutDashboard },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/users", label: "Users", icon: Users },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-xl tracking-tight">HR Hub</span>
              <span className="ml-2 text-blue-300 text-sm font-medium">Task Tracker</span>
            </div>
            <span className="font-extrabold text-base tracking-tight sm:hidden">HR Hub</span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                  location.pathname === path
                    ? "bg-orange-500 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline">{label}</span>
              </Link>
            ))}
            <a
              href="/request-form"
              target="_blank"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
            >
              <ClipboardList className="w-4 h-4 text-orange-400" />
              <span className="hidden md:inline">Request Form</span>
            </a>
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-blue-200 hover:bg-blue-700 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}