import { useState } from "react";
import { Link } from "react-router-dom";
import OrgHierarchySetup from "../components/attendance/OrgHierarchySetup";
import { ClipboardCheck, Settings, ChevronRight } from "lucide-react";

export default function EmployeeAttendance() {
  const [tab, setTab] = useState("setup");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Employee Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Manage org hierarchy and schedule proposals</p>
        </div>
        <Link
          to="/attendance-proposal"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md"
        >
          <ClipboardCheck className="w-4 h-4" />
          Create Attendance Proposal
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("setup")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            tab === "setup" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings className="w-4 h-4" />
          Organization Setup
        </button>
      </div>

      {tab === "setup" && <OrgHierarchySetup />}
    </div>
  );
}