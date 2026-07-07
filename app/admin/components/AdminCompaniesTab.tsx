'use client';

import { motion } from 'framer-motion';
import type { AdminCompany } from '@/lib/types/admin';
import { formatDate } from '@/lib/types/admin';

interface AdminCompaniesTabProps {
  companies: AdminCompany[];
}

export function AdminCompaniesTab({ companies }: AdminCompaniesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Företag</h2>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {companies.map((company) => (
          <div key={company.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{company.name}</div>
                <div className="text-xs text-gray-500 truncate">{company.organizationNumber}</div>
              </div>
              <span className={`shrink-0 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {company.isActive ? 'Aktivt' : 'Inaktivt'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              <div>{company.adminName} · {company.adminEmail}</div>
              <div className="flex flex-wrap gap-x-4 mt-1">
                <span>{company.employeeCount} anställda</span>
                <span>{formatDate(company.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Företag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anställda</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrerat</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                    <div className="text-sm text-gray-500">{company.organizationNumber}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{company.adminName}</div>
                    <div className="text-sm text-gray-500">{company.adminEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.employeeCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {company.isActive ? 'Aktivt' : 'Inaktivt'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(company.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}