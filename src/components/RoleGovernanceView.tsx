import { useEffect, useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { AuditLogEntry, UserAccount, UserRole } from '../types/kawsay';
import { ROLE_LABELS } from '../utils/validation';
import { apiFetch } from '../utils/authToken';
import { UserAvatar } from './UserAvatar';

export function RoleGovernanceView() {
  const { user } = useAppContext();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadAll() {
    const [uRes, lRes] = await Promise.all([
      apiFetch('/api/admin/users', { credentials: 'include' }),
      apiFetch('/api/admin/audit-logs', { credentials: 'include' }),
    ]);
    if (uRes.ok) {
      const uData = await uRes.json();
      setUsers(uData.users || []);
    }
    if (lRes.ok) {
      const lData = await lRes.json();
      setLogs(lData.logs || []);
    }
  }

  useEffect(() => {
    if (user?.role === 'administrator') {
      loadAll();
    }
  }, [user?.role]);

  if (user?.role !== 'administrator') {
    return (
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 text-sm text-rose-200">
        Access Denied: Role Governance is restricted to System Administrators.
      </div>
    );
  }

  async function handleRoleChange(targetId: string, role: UserRole, status: UserAccount['status']) {
    setFeedback(null);
    const res = await apiFetch(`/api/admin/users/${targetId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role, status }),
    });
    const data = await res.json();
    if (res.ok) {
      setFeedback(`Updated permissions for ${data.user.fullName}.`);
      loadAll();
    } else {
      setFeedback(data.error || 'Failed to update role.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">User Role & Audit Governance</h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Assign authorized account roles, enforce data isolation, and review system audit logs.
          </p>
        </div>
        <Shield className="w-6 h-6 text-[#38BDF8]" />
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-white">
          <Users className="w-4 h-4 text-[#38BDF8]" />
          Registered User Directory ({users.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2.5 pr-4 font-medium">User</th>
                <th className="py-2.5 pr-4 font-medium">Location</th>
                <th className="py-2.5 pr-4 font-medium">Role</th>
                <th className="py-2.5 pr-4 font-medium">Status</th>
                <th className="py-2.5 font-medium text-right">Last Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={u.avatarUrl} fullName={u.fullName} size="sm" />
                      <div>
                        <div className="font-medium text-white">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-[#CBD5E1]">
                          @{u.username} · {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[#CBD5E1]">
                    {u.city}, {u.country}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      aria-label={`Role for ${u.username}`}
                      value={u.role}
                      disabled={u.id === user.id}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as UserRole, u.status)
                      }
                      className="px-2.5 py-1.5 rounded bg-[#0B1220] border border-[#293952] text-white text-xs disabled:opacity-60"
                    >
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((rk) => (
                        <option key={rk} value={rk}>
                          {ROLE_LABELS[rk]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      aria-label={`Status for ${u.username}`}
                      value={u.status}
                      disabled={u.id === user.id}
                      onChange={(e) =>
                        handleRoleChange(
                          u.id,
                          u.role,
                          e.target.value as UserAccount['status']
                        )
                      }
                      className="px-2.5 py-1.5 rounded bg-[#0B1220] border border-[#293952] text-white text-xs disabled:opacity-60"
                    >
                      <option value="active">Active</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-[#CBD5E1]">
                    {new Date(u.lastAccessAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">System Audit Logs (AUDIT_LOGS)</h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2 pr-4 font-medium">Actor</th>
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Details</th>
                <th className="py-2 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 pr-4 font-mono text-white">{l.actorUsername}</td>
                  <td className="py-2 pr-4 font-mono text-[#38BDF8]">{l.action}</td>
                  <td className="py-2 pr-4 text-[#CBD5E1]">{l.details}</td>
                  <td className="py-2 font-mono tabular-nums text-[#CBD5E1] text-right">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
