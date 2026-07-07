'use client';

import { motion } from 'framer-motion';
import type { AdminUser } from '@/lib/types/admin';
import { formatDate, getRoleColor } from '@/lib/types/admin';

interface AdminUsersTabProps {
  users: AdminUser[];
  onToggleBypass: (userId: string, active: boolean) => void;
}

function TestBadge() {
  return (
    <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wide">
      Testkonto
    </span>
  );
}

function BypassToggle({ user, onToggleBypass }: { user: AdminUser; onToggleBypass: AdminUsersTabProps['onToggleBypass'] }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        user.paywallBypassActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
      }`}>
        {user.paywallBypassActive ? 'Aktiv' : 'Inaktiv'}
      </span>
      <button
        onClick={() => onToggleBypass(user.id, !user.paywallBypassActive)}
        className="text-xs font-medium text-primary-600 hover:text-primary-800"
      >
        {user.paywallBypassActive ? 'Inaktivera' : 'Aktivera'}
      </button>
    </div>
  );
}

export function AdminUsersTab({ users, onToggleBypass }: AdminUsersTabProps) {
  // Pin test accounts to the top (stable sort preserves order within groups).
  const rows = [...users].sort((a, b) => Number(b.isTestAccount) - Number(a.isTestAccount));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Användare</h2>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((user) => (
          <div
            key={user.id}
            className={`border rounded-lg p-4 space-y-2 ${user.isTestAccount ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</span>
                  {user.isTestAccount && <TestBadge />}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <span className={`shrink-0 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {user.company && <span>{user.company}</span>}
              <span>{user.enrolledCourses} anmälda / {user.completedCourses} klara</span>
              <span className={user.identityVerified ? 'text-green-700' : 'text-red-700'}>
                {user.identityVerified ? 'Verifierad' : 'Ej verifierad'}
              </span>
              <span>{formatDate(user.createdAt)}</span>
            </div>
            {user.isTestAccount && (
              <div className="pt-1">
                <BypassToggle user={user} onToggleBypass={onToggleBypass} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Användare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Företag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verifierad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betalstatus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrerad</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((user) => (
              <tr key={user.id} className={user.isTestAccount ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      {user.isTestAccount && <TestBadge />}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.company || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.enrolledCourses} / {user.completedCourses}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.identityVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.identityVerified ? 'Verifierad' : 'Ej verifierad'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isTestAccount
                    ? <BypassToggle user={user} onToggleBypass={onToggleBypass} />
                    : <span className="text-sm text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
