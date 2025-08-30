'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import CoursePurchaseModal from '@/components/CoursePurchaseModal'

interface Employee {
  id: string
  name: string
  email: string
  personalNumber: string
  bankIdVerified: boolean
  id06Eligible: boolean
  enrolledCourses: number
  completedCourses: number
  certificates: number
  lastActivity: string
}

interface EmployeeDetails {
  id: string
  name: string
  email: string
  personalNumber: string
  bankIdVerified: boolean
  bankIdVerifiedAt: string | null
  id06Eligible: boolean
  createdAt: string
  updatedAt: string
  enrollments: Array<{
    id: string
    enrolledAt: string
    completedAt: string | null
    course: {
      id: string
      title: string
      description: string
      duration: number
      totalLessons: number
      completedLessons: number
      progressPercentage: number
      lessons: Array<{
        id: string
        title: string
        order: number
        completed: boolean
        completedAt: string | null
      }>
    }
    certificates: Array<{
      id: string
      certificateNumber: string
      issuedAt: string
      id06Verified: boolean
    }>
  }>
  invitationLink?: string
}

export default function CompanyDashboard() {
  const { data: session, status } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [employeeDetails, setEmployeeDetails] = useState<Record<string, EmployeeDetails>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  const [removingEmployee, setRemovingEmployee] = useState<string | null>(null)
  const [coursePurchaseModal, setCoursePurchaseModal] = useState<{
    isOpen: boolean
    employeeId?: string
    employeeName?: string
  }>({ isOpen: false })
  const router = useRouter()

  // Fetch real employees from API
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'COMPANY_ADMIN') {
      router.push('/dashboard')
      return
    }

    const companyId = (session.user as any)?.companyId
    if (!companyId) {
      setError('Inget företag kopplat till ditt konto')
      setIsLoading(false)
      return
    }

    const fetchEmployees = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/employees`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.message || 'Ett fel uppstod vid hämtning av anställda')
        } else {
          setEmployees(data.employees)
          setError('')
        }
      } catch (error) {
        setError('Ett fel uppstod vid hämtning av anställda')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [session, status, router])

  const stats = {
    totalEmployees: employees.length,
    bankIdVerified: employees.filter(emp => emp.bankIdVerified).length,
    activeEmployees: employees.filter(emp => emp.enrolledCourses > 0).length,
    totalCertificates: employees.reduce((sum, emp) => sum + emp.certificates, 0)
  }

  const refreshEmployees = async () => {
    if (!session) return
    
    const companyId = (session.user as any)?.companyId
    if (!companyId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/companies/${companyId}/employees`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Ett fel uppstod vid hämtning av anställda')
      } else {
        setEmployees(data.employees)
        setError('')
      }
    } catch (error) {
      setError('Ett fel uppstod vid hämtning av anställda')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmployeeDetails = async (employeeId: string) => {
    if (!session) return
    
    const companyId = (session.user as any)?.companyId
    if (!companyId) return

    setLoadingDetails(prev => ({ ...prev, [employeeId]: true }))
    
    try {
      const response = await fetch(`/api/companies/${companyId}/employees/${employeeId}/details`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Error fetching employee details:', data.message)
      } else {
        // Also fetch invitation link if employee hasn't logged in
        let invitationLink = null
        if (!data.employee.bankIdVerified) {
          try {
            const invitationResponse = await fetch(`/api/companies/${companyId}/employees/${employeeId}/invitation-link`)
            const invitationData = await invitationResponse.json()
            if (invitationResponse.ok && invitationData.invitationUrl) {
              invitationLink = invitationData.invitationUrl
            }
          } catch (error) {
            console.error('Error fetching invitation link:', error)
          }
        }

        setEmployeeDetails(prev => ({ 
          ...prev, 
          [employeeId]: {
            ...data.employee,
            invitationLink
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
    } finally {
      setLoadingDetails(prev => ({ ...prev, [employeeId]: false }))
    }
  }

  const openCoursePurchaseModal = (employeeId?: string, employeeName?: string) => {
    setCoursePurchaseModal({
      isOpen: true,
      employeeId,
      employeeName
    })
  }

  const closeCoursePurchaseModal = () => {
    setCoursePurchaseModal({ isOpen: false })
  }

  const handlePurchaseSuccess = () => {
    refreshEmployees()
  }

  const removeEmployee = async (employeeId: string) => {
    if (!session) return
    
    const companyId = (session.user as any)?.companyId
    if (!companyId) return

    if (!confirm('Är du säker på att du vill ta bort denna anställd från företaget?')) {
      return
    }

    setRemovingEmployee(employeeId)
    
    try {
      const response = await fetch(`/api/companies/${companyId}/employees/${employeeId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Ett fel uppstod vid borttagning av anställd')
      } else {
        // Remove from local state
        setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
        // Clear details if expanded
        if (expandedEmployee === employeeId) {
          setExpandedEmployee(null)
          setEmployeeDetails(prev => {
            const newDetails = { ...prev }
            delete newDetails[employeeId]
            return newDetails
          })
        }
        alert('Anställd har tagits bort från företaget')
      }
    } catch (error) {
      alert('Ett fel uppstod vid borttagning av anställd')
    } finally {
      setRemovingEmployee(null)
    }
  }

  const toggleEmployeeDetails = (employeeId: string) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null)
    } else {
      setExpandedEmployee(employeeId)
      // Fetch details if not already loaded
      if (!employeeDetails[employeeId]) {
        fetchEmployeeDetails(employeeId)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar anställda...</p>
        </div>
      </div>
    )
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Företagsdashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Hantera dina anställda och övervaka deras utbildningsstatus
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt anställda</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BankID-verifierade</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bankIdVerified}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktiva anställda</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totalt certifikat</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCertificates}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => openCoursePurchaseModal()}
              className="btn-secondary inline-flex items-center bg-green-600 hover:bg-green-700 text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Köp kurser för alla
            </button>
            <Link
              href="/dashboard/company/invite-employee"
              className="btn-primary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Bjud in anställd
            </Link>
            <button
              onClick={refreshEmployees}
              disabled={isLoading}
              className="btn-secondary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Uppdatera
            </button>
            <Link
              href="/dashboard/company/courses"
              className="btn-secondary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Hantera kurser
            </Link>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Anställda</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anställd
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certifikat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Senaste aktivitet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Åtgärder
                  </th>
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
                                {employee.name.split(' ').map(n => n[0]).join('')}
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
                          {employee.bankIdVerified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              BankID-verifierad
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              Väntar på inloggning
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.certificates} st
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.lastActivity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleEmployeeDetails(employee.id)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                          disabled={loadingDetails[employee.id]}
                        >
                          {loadingDetails[employee.id] ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Laddar...
                            </span>
                          ) : (
                            expandedEmployee === employee.id ? 'Dölj detaljer' : 'Visa detaljer'
                          )}
                        </button>
                        <button 
                          onClick={() => removeEmployee(employee.id)}
                          disabled={removingEmployee === employee.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingEmployee === employee.id ? 'Tar bort...' : 'Ta bort'}
                        </button>
                      </td>
                    </motion.tr>
                    
                    {/* Expandable Details Row */}
                    {expandedEmployee === employee.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50"
                      >
                        <td colSpan={6} className="px-6 py-4">
                          {loadingDetails[employee.id] ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                              <p className="mt-2 text-gray-600">Laddar detaljer...</p>
                            </div>
                          ) : employeeDetails[employee.id] ? (
                            <div className="space-y-6">
                              {/* Employee Info */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 mb-2">Kontaktinformation</h4>
                                  <p className="text-sm text-gray-600">E-post: {employeeDetails[employee.id].email}</p>
                                  <p className="text-sm text-gray-600">Personnummer: {employeeDetails[employee.id].personalNumber}</p>
                                  <p className="text-sm text-gray-600">Registrerad: {new Date(employeeDetails[employee.id].createdAt).toLocaleDateString('sv-SE')}</p>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 mb-2">Verifiering</h4>
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        employeeDetails[employee.id].bankIdVerified 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {employeeDetails[employee.id].bankIdVerified ? 'BankID-verifierad' : 'Väntar på BankID'}
                                      </span>
                                    </div>
                                                                         {employeeDetails[employee.id].bankIdVerifiedAt && (
                                       <p className="text-xs text-gray-500">
                                         Verifierad: {new Date(employeeDetails[employee.id].bankIdVerifiedAt!).toLocaleDateString('sv-SE')}
                                       </p>
                                     )}
                                    {employeeDetails[employee.id].id06Eligible && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        ID06-berättigad
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 mb-2">Statistik</h4>
                                  <p className="text-sm text-gray-600">Registrerade kurser: {employeeDetails[employee.id].enrollments.length}</p>
                                  <p className="text-sm text-gray-600">Slutförda kurser: {employeeDetails[employee.id].enrollments.filter(e => e.completedAt).length}</p>
                                  <p className="text-sm text-gray-600">Certifikat: {employeeDetails[employee.id].enrollments.reduce((sum, e) => sum + e.certificates.length, 0)}</p>
                                </div>
                              </div>

                              {/* Invitation Link Section - Only show if employee hasn't logged in */}
                              {!employeeDetails[employee.id].bankIdVerified && employeeDetails[employee.id].invitationLink && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                  <h4 className="font-medium text-yellow-900 mb-2">Inbjudningslänk</h4>
                                  <p className="text-sm text-yellow-800 mb-3">
                                    Anställd har inte loggat in än. Du kan dela denna länk direkt om e-post inte fungerade.
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={employeeDetails[employee.id].invitationLink}
                                      readOnly
                                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white"
                                    />
                                    <button
                                                                             onClick={async () => {
                                         try {
                                           await navigator.clipboard.writeText(employeeDetails[employee.id].invitationLink!)
                                           alert('Inbjudningslänk kopierad till urklipp!')
                                         } catch (error) {
                                           alert('Kunde inte kopiera länken')
                                         }
                                       }}
                                      className="px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                    >
                                      Kopiera
                                    </button>
                                  </div>
                                  <p className="text-xs text-yellow-700 mt-2">
                                    Dela denna länk direkt med anställd via SMS, Slack eller annan kommunikationskanal.
                                  </p>
                                </div>
                              )}

                              {/* Course Progress */}
                              {employeeDetails[employee.id].enrollments.length > 0 ? (
                                <div className="bg-white rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 p-4 border-b border-gray-200">Kurser och Progress</h4>
                                  <div className="divide-y divide-gray-200">
                                    {employeeDetails[employee.id].enrollments.map((enrollment) => (
                                      <div key={enrollment.id} className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <div>
                                            <h5 className="font-medium text-gray-900">{enrollment.course.title}</h5>
                                            <p className="text-sm text-gray-600">
                                              Registrerad: {new Date(enrollment.enrolledAt).toLocaleDateString('sv-SE')}
                                              {enrollment.completedAt && (
                                                <span className="ml-2 text-green-600">
                                                  • Slutförd: {new Date(enrollment.completedAt).toLocaleDateString('sv-SE')}
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                              {enrollment.course.progressPercentage}%
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {enrollment.course.completedLessons}/{enrollment.course.totalLessons} lektioner
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                          <div 
                                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${enrollment.course.progressPercentage}%` }}
                                          ></div>
                                        </div>
                                        
                                        {/* Lessons */}
                                        <div className="space-y-2">
                                          {enrollment.course.lessons.map((lesson) => (
                                            <div key={lesson.id} className="flex items-center text-sm">
                                              <div className={`w-4 h-4 rounded-full mr-3 ${
                                                lesson.completed ? 'bg-green-500' : 'bg-gray-300'
                                              }`}></div>
                                              <span className={lesson.completed ? 'text-gray-900' : 'text-gray-600'}>
                                                {lesson.title}
                                              </span>
                                              {lesson.completed && lesson.completedAt && (
                                                <span className="ml-auto text-xs text-gray-500">
                                                  {new Date(lesson.completedAt).toLocaleDateString('sv-SE')}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                        
                                        {/* Certificates */}
                                        {enrollment.certificates.length > 0 && (
                                          <div className="mt-3 pt-3 border-t border-gray-200">
                                            <h6 className="text-sm font-medium text-gray-900 mb-2">Certifikat</h6>
                                            {enrollment.certificates.map((cert) => (
                                              <div key={cert.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">#{cert.certificateNumber}</span>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-gray-500">
                                                    {new Date(cert.issuedAt).toLocaleDateString('sv-SE')}
                                                  </span>
                                                  {cert.id06Verified && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                      ID06
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                                  <p className="text-gray-500 mb-4">Inga kurser registrerade än</p>
                                  <button
                                    onClick={() => openCoursePurchaseModal(employee.id, employee.name)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Köp kurser för {employee.name}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500">Kunde inte ladda detaljer</p>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Course Purchase Modal */}
      <CoursePurchaseModal
        isOpen={coursePurchaseModal.isOpen}
        onClose={closeCoursePurchaseModal}
        employeeId={coursePurchaseModal.employeeId}
        employeeName={coursePurchaseModal.employeeName}
        companyId={(session?.user as any)?.companyId || ''}
        onPurchaseSuccess={handlePurchaseSuccess}
        userRole={(session?.user as any)?.role}
      />
    </div>
  )
}
