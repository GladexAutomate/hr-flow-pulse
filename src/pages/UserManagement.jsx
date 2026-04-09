import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Trash2, Mail, Shield, User, Loader2, RefreshCw } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const data = await base44.entities.User.list();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setSuccessMsg("");
    await base44.users.inviteUser(inviteEmail, inviteRole);
    setSuccessMsg(`Invitation sent to ${inviteEmail}!`);
    setInviteEmail("");
    setInviteRole("user");
    setInviting(false);
    fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (!confirm("Remove this user from the app?")) return;
    await base44.entities.User.delete(userId);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Invite and manage HR staff access</p>
      </div>

      {/* Invite Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-orange-500" />
          Invite New User
        </h2>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
              placeholder="user@company.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="user">HR Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-orange-100 text-sm"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {successMsg && (
          <div className="mt-3 text-sm text-emerald-600 font-semibold bg-emerald-50 px-4 py-2 rounded-xl">
            ✓ {successMsg}
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Current Users ({users.length})</h2>
          <button onClick={fetchUsers} className="text-gray-400 hover:text-gray-600 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
              <tr>
                {["Name", "Email", "Role", "Joined", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user, i) => (
                <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                        {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium text-gray-800">{user.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role || "anonymous"}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border focus:outline-none ${
                        user.role === "admin"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : user.role === "anonymous"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      <option value="anonymous">Anonymous</option>
                      <option value="user">HR Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {user.created_date ? new Date(user.created_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}