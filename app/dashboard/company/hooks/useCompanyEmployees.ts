'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Employee, EmployeeDetails } from '@/lib/types/company-dashboard';

export function useCompanyEmployees(user: User | null) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<Record<string, EmployeeDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [removingEmployee, setRemovingEmployee] = useState<string | null>(null);

  const companyId = user?.user_metadata?.companyId as string | undefined;

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies/${companyId}/employees`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ett fel uppstod vid hämtning av anställda');
      } else {
        setEmployees(data.employees);
        setError('');
      }
    } catch {
      setError('Ett fel uppstod vid hämtning av anställda');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'COMPANY_ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (!companyId) {
      setError('Inget företag kopplat till ditt konto');
      setIsLoading(false);
      return;
    }

    fetchEmployees();
  }, [user, router, companyId, fetchEmployees]);

  const fetchEmployeeDetails = useCallback(async (employeeId: string) => {
    if (!companyId) return;

    setLoadingDetails((prev) => ({ ...prev, [employeeId]: true }));

    try {
      const response = await fetch(`/api/companies/${companyId}/employees/${employeeId}/details`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching employee details:', data.message);
        return;
      }

      let invitationLink: string | undefined;
      if (!data.employee.bankIdVerified) {
        try {
          const invitationResponse = await fetch(
            `/api/companies/${companyId}/employees/${employeeId}/invitation-link`
          );
          const invitationData = await invitationResponse.json();
          if (invitationResponse.ok && invitationData.invitationUrl) {
            invitationLink = invitationData.invitationUrl;
          }
        } catch (err) {
          console.error('Error fetching invitation link:', err);
        }
      }

      setEmployeeDetails((prev) => ({
        ...prev,
        [employeeId]: { ...data.employee, invitationLink },
      }));
    } catch (err) {
      console.error('Error fetching employee details:', err);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [employeeId]: false }));
    }
  }, [companyId]);

  const toggleEmployeeDetails = useCallback((employeeId: string) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null);
      return;
    }
    setExpandedEmployee(employeeId);
    if (!employeeDetails[employeeId]) {
      fetchEmployeeDetails(employeeId);
    }
  }, [expandedEmployee, employeeDetails, fetchEmployeeDetails]);

  const removeEmployee = useCallback(async (employeeId: string) => {
    if (!companyId) return;
    if (!confirm('Är du säker på att du vill ta bort denna anställd från företaget?')) return;

    setRemovingEmployee(employeeId);

    try {
      const response = await fetch(`/api/companies/${companyId}/employees/${employeeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Ett fel uppstod vid borttagning av anställd');
      } else {
        setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
        setExpandedEmployee((current) => (current === employeeId ? null : current));
        setEmployeeDetails((prev) => {
          const next = { ...prev };
          delete next[employeeId];
          return next;
        });
        alert('Anställd har tagits bort från företaget');
      }
    } catch {
      alert('Ett fel uppstod vid borttagning av anställd');
    } finally {
      setRemovingEmployee(null);
    }
  }, [companyId]);

  const stats = {
    totalEmployees: employees.length,
    bankIdVerified: employees.filter((emp) => emp.bankIdVerified).length,
    activeEmployees: employees.filter((emp) => emp.enrolledCourses > 0).length,
    totalCertificates: employees.reduce((sum, emp) => sum + emp.certificates, 0),
  };

  return {
    employees,
    isLoading,
    error,
    stats,
    expandedEmployee,
    employeeDetails,
    loadingDetails,
    removingEmployee,
    companyId,
    refreshEmployees: fetchEmployees,
    toggleEmployeeDetails,
    removeEmployee,
  };
}