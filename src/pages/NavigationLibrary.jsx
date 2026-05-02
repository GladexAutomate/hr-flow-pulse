import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, CheckCircle2, ExternalLink, FileText, Calendar, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function NavigationLibrary() {
  const [branches, setBranches] = useState([]);
  const [branchDepts, setBranchDepts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const proposals = await base44.entities.AttendanceProposal.filter({
        status: "Approved"
      }, "-updated_date", 500);

      // Group departments by branch
      const branchMap = {};
      proposals.forEach(p => {
        if (p.branch_name && p.department_name) {
          if (!branchMap[p.branch_name]) {
            branchMap[p.branch_name] = new Set();
          }
          branchMap[p.branch_name].add(p.department_name);
        }
      });

      // Convert Sets to sorted arrays
      const deptMap = {};
      Object.keys(branchMap).forEach(branch => {
        deptMap[branch] = Array.from(branchMap[branch]).sort();
      });

      setBranches(Object.keys(branchMap).sort());
      setBranchDepts(deptMap);
      setLoading(false);
    };
    load();
  }, []);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const requestFormUrl = `${getBaseUrl()}/request-form`;
  const attendanceProposalUrl = `${getBaseUrl()}/attendance-proposal`;

  const links = [
    {
      id: "request-form",
      title: "HR Request Form",
      description: "Employee form for submitting HR requests (COE, ITR, WFH, etc.)",
      url: requestFormUrl,
      category: "Forms",
      icon: FileText,
      color: "blue"
    },
    {
      id: "attendance-proposal",
      title: "Attendance Proposal Submission",
      description: "Team leaders submit attendance proposals for approval",
      url: attendanceProposalUrl,
      category: "Forms",
      icon: FileText,
      color: "blue"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Link Library</h1>
        <p className="text-gray-600 text-sm mt-2">All shareable URLs and navigation links for easy access and distribution</p>
      </div>

      {/* Forms Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Public Forms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map(link => {
            const Icon = link.icon;
            const colorMap = {
              blue: "border-blue-200 bg-blue-50",
              green: "border-green-200 bg-green-50",
              purple: "border-purple-200 bg-purple-50"
            };
            return (
              <div key={link.id} className={`rounded-xl border p-5 ${colorMap[link.color]}`}>
                <div className="flex items-start gap-3 mb-3">
                  <Icon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{link.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{link.description}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 font-mono text-xs text-gray-700 break-all mb-3 border border-gray-200">
                  {link.url}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(link.url, link.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all text-sm"
                  >
                    {copiedId === link.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy
                      </>
                    )}
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Links Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Department Schedule Links
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No approved schedules yet. Create an attendance proposal to generate schedule links.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {branches.map(branch => (
              <div key={branch} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3">
                  <p className="font-bold text-white">{branch}</p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(branchDepts[branch] || []).map(dept => {
                      const scheduleUrl = `${getBaseUrl()}/schedule/${encodeURIComponent(branch)}/${encodeURIComponent(dept)}`;
                      return (
                        <ScheduleLinkCard
                          key={`${branch}-${dept}`}
                          branch={branch}
                          department={dept}
                          url={scheduleUrl}
                          onCopy={(url, id) => copyToClipboard(url, id)}
                          isCopied={copiedId === `${branch}-${dept}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alternative: Static schedule links */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" /> Quick Generate Schedule Link
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-4">Use this tool to generate schedule URLs for specific branch and department combinations:</p>
          <ScheduleLinkGenerator onCopy={(url, id) => copyToClipboard(url, id)} copiedId={copiedId} />
        </div>
      </div>
    </div>
  );
}

function ScheduleLinkCard({ branch, department, url, onCopy, isCopied }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-semibold text-gray-700 mb-2">{department}</p>
      <div className="bg-white rounded px-2 py-1.5 font-mono text-xs text-gray-600 break-all mb-2 border border-gray-200">
        {url}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(url, `${branch}-${department}`)}
          className="flex-1 flex items-center justify-center gap-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-1.5 px-2 rounded text-xs transition-all"
        >
          {isCopied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1.5 px-2 rounded text-xs transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </a>
      </div>
    </div>
  );
}

function ScheduleLinkGenerator({ onCopy, copiedId }) {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const load = async () => {
      const proposals = await base44.entities.AttendanceProposal.filter({
        status: "Approved"
      }, "-updated_date", 500);

      const branchSet = new Set();
      proposals.forEach(p => {
        if (p.branch_name) branchSet.add(p.branch_name);
      });
      setBranches(Array.from(branchSet).sort());
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedBranch) {
        setDepartments([]);
        return;
      }
      const proposals = await base44.entities.AttendanceProposal.filter({
        status: "Approved",
        branch_name: selectedBranch
      });
      const deptSet = new Set();
      proposals.forEach(p => {
        if (p.department_name) deptSet.add(p.department_name);
      });
      setDepartments(Array.from(deptSet).sort());
    };
    load();
  }, [selectedBranch]);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const generatedUrl = selectedBranch && selectedDept
    ? `${getBaseUrl()}/schedule/${encodeURIComponent(selectedBranch)}/${encodeURIComponent(selectedDept)}`
    : "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Branch</label>
          <select
            value={selectedBranch}
            onChange={e => {
              setSelectedBranch(e.target.value);
              setSelectedDept("");
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select Branch</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            disabled={!selectedBranch}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {generatedUrl && (
        <div className="space-y-2">
          <div className="bg-orange-50 rounded-lg border border-orange-200 px-3 py-2">
            <p className="font-mono text-xs text-gray-700 break-all">{generatedUrl}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onCopy(generatedUrl, "generator")}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all text-sm"
            >
              {copiedId === "generator" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}