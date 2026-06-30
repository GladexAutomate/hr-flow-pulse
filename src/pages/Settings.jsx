import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { LogOut, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import WebhookSettings from "@/components/settings/WebhookSettings";
import DailyReportSettings from "@/components/settings/DailyReportSettings";
import SlaSettings from "@/components/settings/SlaSettings";

const HR_FORM_URL = `${window.location.origin}/request-form`;

export default function Settings() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyFormLink = () => {
    navigator.clipboard.writeText(HR_FORM_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Profile</p>
        <div className="font-semibold text-gray-800">{user?.full_name || "—"}</div>
        <div className="text-sm text-gray-500">{user?.email}</div>
        <div className="text-xs text-gray-400 capitalize">Role: {user?.role}</div>
      </div>

      {/* HR Form Link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">HR Request Form Link</p>
        <p className="text-sm text-gray-500">Share this link so employees can submit HR requests.</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
          <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate flex-1">{HR_FORM_URL}</span>
        </div>
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={copyFormLink}>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Session</p>
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      {/* SLA Settings */}
      <SlaSettings />

      {/* Webhook Settings */}
      <WebhookSettings />

      {/* Daily Report Settings */}
      <DailyReportSettings />
    </div>
  );
}