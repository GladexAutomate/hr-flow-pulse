import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Trash2, AlertTriangle, LogOut, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

const HR_FORM_URL = `${window.location.origin}/request-form`;

export default function Settings() {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyFormLink = () => {
    navigator.clipboard.writeText(HR_FORM_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.User.delete(user.id);
    base44.auth.logout("/request-form");
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

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 space-y-3">
        <p className="text-xs text-red-500 uppercase font-semibold tracking-wide">Danger Zone</p>
        <p className="text-sm text-gray-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <Button variant="destructive" className="w-full flex items-center gap-2" onClick={() => setShowConfirm(true)}>
          <Trash2 className="w-4 h-4" /> Delete My Account
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete Account?</h3>
                <p className="text-sm text-gray-500">This is permanent and cannot be reversed.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}