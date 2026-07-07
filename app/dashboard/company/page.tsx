'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '@/app/providers';
import CoursePurchaseModal from '@/components/CoursePurchaseModal';
import { CompanyStats } from './components/CompanyStats';
import { EmployeeList } from './components/EmployeeList';
import { useCompanyEmployees } from './hooks/useCompanyEmployees';

export default function CompanyDashboard() {
  const { user } = useSupabaseAuth();
  const {
    employees,
    isLoading,
    error,
    stats,
    expandedEmployee,
    employeeDetails,
    loadingDetails,
    removingEmployee,
    companyId,
    refreshEmployees,
    toggleEmployeeDetails,
    removeEmployee,
  } = useCompanyEmployees(user);

  const [coursePurchaseModal, setCoursePurchaseModal] = useState<{
    isOpen: boolean;
    employeeId?: string;
    employeeName?: string;
  }>({ isOpen: false });

  const openCoursePurchaseModal = (employeeId?: string, employeeName?: string) => {
    setCoursePurchaseModal({ isOpen: true, employeeId, employeeName });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar anställda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Fel</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 sm:pt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Företagsdashboard</h1>
          <p className="mt-2 text-gray-600">
            Hantera dina anställda och övervaka deras utbildningsstatus
          </p>
        </div>

        <CompanyStats
          totalEmployees={stats.totalEmployees}
          bankIdVerified={stats.bankIdVerified}
          activeEmployees={stats.activeEmployees}
          totalCertificates={stats.totalCertificates}
        />

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => openCoursePurchaseModal()}
              className="btn-secondary inline-flex items-center bg-green-600 hover:bg-green-700 text-white"
            >
              Köp kurser för alla
            </button>
            <Link href="/dashboard/company/invite-employee" className="btn-primary inline-flex items-center">
              Bjud in anställd
            </Link>
            <button
              onClick={refreshEmployees}
              disabled={isLoading}
              className="btn-secondary inline-flex items-center"
            >
              Uppdatera
            </button>
            <Link href="/dashboard/company/courses" className="btn-secondary inline-flex items-center">
              Hantera kurser
            </Link>
          </div>
        </div>

        <EmployeeList
          employees={employees}
          expandedEmployee={expandedEmployee}
          employeeDetails={employeeDetails}
          loadingDetails={loadingDetails}
          removingEmployee={removingEmployee}
          onToggleDetails={toggleEmployeeDetails}
          onRemoveEmployee={removeEmployee}
          onPurchaseForEmployee={openCoursePurchaseModal}
        />
      </div>

      <CoursePurchaseModal
        isOpen={coursePurchaseModal.isOpen}
        onClose={() => setCoursePurchaseModal({ isOpen: false })}
        employeeId={coursePurchaseModal.employeeId}
        employeeName={coursePurchaseModal.employeeName}
        companyId={companyId || ''}
        onPurchaseSuccess={refreshEmployees}
        userRole={user?.user_metadata?.role}
      />
    </div>
  );
}