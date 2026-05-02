import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ClipboardList, BarChart2, Users, Settings, CalendarDays, ClipboardCheck } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Tracker", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart2 },
  { to: "/attendance", label: "Attendance", icon: CalendarDays },
  { to: "/attendance-requests", label: "Attn. Requests", icon: ClipboardCheck },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar min-h-screen px-4 py-6 gap-2">
      <div className="flex items-center gap-3 px-2 mb-8">
        <img
          src="https://media.base44.com/images/public/69d6172befce3a4a3f9ed78a/177b2a6a8_GladexLogonobackground.png"
          alt="Logo"
          className="w-9 h-9 object-contain"
        />
        <div>
          <div className="text-sidebar-foreground font-extrabold text-sm leading-tight">HR Hub</div>
          <div className="text-sidebar-foreground/50 text-xs">Flow Pulse</div>
        </div>
      </div>
      {NAV_LINKS.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}

function BottomTabs() {
  const location = useLocation();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_LINKS.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
              active ? "text-orange-500" : "text-gray-400"
            }`}
            style={{ minHeight: 56 }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 56px)",
        }}
      >
        <div className="p-4 md:p-6 md:pb-6" style={{ paddingBottom: undefined }}>
          <Outlet />
        </div>
      </main>
      <BottomTabs />
    </div>
  );
}