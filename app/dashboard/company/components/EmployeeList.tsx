'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Employee, EmployeeDetails } from '@/lib/types/company-dashboard';
import { EmployeeDetailsPanel } from './EmployeeDetailsPanel';

interface EmployeeListProps {
  employees: Employee[];
  expandedEmployee: string | null;
  employeeDetails: Record<string, EmployeeDetails>;
  loadingDetails: Record<string, boolean>;
  removingEmployee: string | null;
  companyId: string | null;
  onToggleDetails: (employeeId: string) => void;
  onRemoveEmployee: (employeeId: string) => void;
  onPurchaseForEmployee: (employeeId: string, employeeName: string) => void;
  onEmployeeUpdated: () => void;
}

export function EmployeeList({
  employees,
  expandedEmployee,
  employeeDetails,
  loadingDetails,
  removingEmployee,
  companyId,
  onToggleDetails,
  onRemoveEmployee,
  onPurchaseForEmployee,
  onEmployeeUpdated,
}: EmployeeListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Anställda</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anställd</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certifikat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Senaste aktivitet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee, index) => (
              <React.Fragment key={employee.id}>
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {employee.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {employee.identityVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Identitetsverifierad
                        </span>
                      ) : employee.status === 'NEEDS_INFO' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Uppgifter saknas
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Ej verifierad
                        </span>
                      )}
                      {employee.id06Eligible && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ID06-berättigad
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.enrolledCourses} registrerade, {employee.completedCourses} slutförda
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.certificates} st</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.lastActivity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onToggleDetails(employee.id)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      disabled={loadingDetails[employee.id]}
                    >
                      {loadingDetails[employee.id] ? 'Laddar...' : expandedEmployee === employee.id ? 'Dölj detaljer' : 'Visa detaljer'}
                    </button>
                    <button
                      onClick={() => onRemoveEmployee(employee.id)}
                      disabled={removingEmployee === employee.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removingEmployee === employee.id ? 'Tar bort...' : 'Ta bort'}
                    </button>
                  </td>
                </motion.tr>

                {expandedEmployee === employee.id && (
                  <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50"
                  >
                    <td colSpan={6} className="px-6 py-4">
                      <EmployeeDetailsPanel
                        employee={employee}
                        details={employeeDetails[employee.id]}
                        isLoading={!!loadingDetails[employee.id]}
                        companyId={companyId}
                        onPurchaseForEmployee={onPurchaseForEmployee}
                        onUpdated={onEmployeeUpdated}
                      />
                    </td>
                  </motion.tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}