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

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInviteLink = async () => {
    if (!companyId) return;
    setInviteLinkLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/invite-link`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.url) {
        setInviteLink(data.url);
        try {
          await navigator.clipboard.writeText(data.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          /* clipboard may be blocked — the link is still shown for manual copy */
        }
      }
    } finally {
      setInviteLinkLoading(false);
    }
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
          identityVerified={stats.identityVerified}
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
              onClick={generateInviteLink}
              disabled={inviteLinkLoading || !companyId}
              className="btn-secondary inline-flex items-center"
            >
              {inviteLinkLoading ? 'Skapar länk…' : 'Dela inbjudningslänk'}
            </button>
            <button
              onClick={refreshEmployees}
              disabled={isLoading}
              className="btn-secondary inline-flex items-center"
            >
              Uppdatera
            </button>
          </div>

          {inviteLink && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Dela den här länken via sms eller mejl. Den som öppnar den kan skapa ett konto (eller logga in) och
                gå med i företaget.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 input-field bg-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="btn-primary shrink-0"
                >
                  {copied ? 'Kopierad!' : 'Kopiera'}
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2">Länken är giltig i 30 dagar.</p>
            </div>
          )}
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