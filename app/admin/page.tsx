'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import CourseModal from '@/components/CourseModal';
import SubmissionModal from '@/components/SubmissionModal';
import GiftCourseModal from '@/components/GiftCourseModal';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  isPublished: boolean;
  enrolledUsers: number;
  completedUsers: number;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  personalNumber: string | null;
  bankIdVerified: boolean;
  id06Eligible: boolean;
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  lastActive: string;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  organizationNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  verified: boolean;
  isActive: boolean;
  adminName: string;
  adminEmail: string;
  employeeCount: number;
  invitationCount: number;
  createdAt: string;
  updatedAt: string;
}

interface APVSubmission {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    personalNumber?: string;
  };
  course: {
    id: string;
    title: string;
    category: string;
  };
  courseTitle: string;
  completionDate: string;
  finalScore: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken?: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  answersData: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    options: string[];
    selectedIndex: number;
    correctAnswerText: string;
    userAnswerText: string;
  }>;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submissions, setSubmissions] = useState<APVSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'companies' | 'apv-submissions'>('overview');
  
  // Course modal state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Submission modal state
  const [selectedSubmission, setSelectedSubmission] = useState<APVSubmission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Gift course modal state
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [coursesRes, usersRes, companiesRes, submissionsRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/users'),
        fetch('/api/admin/companies'),
        fetch('/api/admin/submissions')
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (courseData: any) => {
    try {
      setIsSavingCourse(true);
      
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses';
      
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        setIsCourseModalOpen(false);
        setEditingCourse(null);
        fetchAdminData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Ett fel uppstod vid sparande av kurs');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kurs?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ett fel uppstod vid borttagning av kurs');
    }
  };

  const handleEditCourseContent = (courseId: string) => {
    router.push(`/admin/courses/${courseId}/edit`);
  };

  const handleViewSubmission = (submission: APVSubmission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleUpdateSubmissionStatus = async (submissionId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) => {
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          status,
          reviewNotes
        })
      });

      if (response.ok) {
        // Refresh submissions data
        const submissionsRes = await fetch('/api/admin/submissions');
        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData);
        }
        setShowSubmissionModal(false);
        setSelectedSubmission(null);
      } else {
        alert('Fel vid uppdatering av inlämningsstatus');
      }
    } catch (error) {
      console.error('Error updating submission status:', error);
      alert('Fel vid uppdatering av inlämningsstatus');
    }
  };

  const getSubmissionStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Väntar' },
      'APPROVED': { color: 'bg-green-100 text-green-800', text: 'Godkänd' },
      'REJECTED': { color: 'bg-red-100 text-red-800', text: 'Avvisad' },
      'ID06_REGISTERED': { color: 'bg-blue-100 text-blue-800', text: 'ID06 Registrerad' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'COMPANY_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      case 'INDIVIDUAL':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check if user is admin
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Åtkomst nekad</h1>
          <p className="text-gray-600 mb-8">Du har inte behörighet att komma åt admin-panelen.</p>
          <a href="/" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
            Tillbaka till startsidan
          </a>
        </div>
      </div>
    );
  }

  // Calculate overview statistics
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const totalUsers = users.length;
  const totalCompanies = companies.length;
  const totalEnrollments = courses.reduce((sum, course) => sum + course.enrolledUsers, 0);
  const totalRevenue = courses.reduce((sum, course) => sum + (course.price * course.enrolledUsers), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-24 sm:pt-28">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Hantera kurser, användare och företag</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-8 px-4 sm:px-6">
              {[
                { id: 'overview', name: 'Översikt', icon: ChartBarIcon },
                { id: 'courses', name: 'Kurser', icon: BookOpenIcon },
                { id: 'users', name: 'Användare', icon: UsersIcon },
                { id: 'companies', name: 'Företag', icon: BuildingOfficeIcon },
                { id: 'apv-submissions', name: 'APV Submissions', icon: DocumentTextIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Plattform Översikt</h2>
              
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Totalt Kurser</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900">{totalCourses}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-green-600">Totalt Användare</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-900">{totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-purple-600">Företag</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900">{totalCompanies}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                    <div className="ml-3 sm:ml-4">
                      <p className="text-xs sm:text-sm font-medium text-yellow-600">Total Intäkt</p>
                      <p className="text-xl sm:text-2xl font-bold text-yellow-900">{formatPrice(totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => setShowGiftModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Ge bort kurs
                </button>
                
                <button
                  onClick={handleCreateCourse}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Skapa kurs
                </button>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste Kurser</h3>
                  <div className="space-y-3">
                    {courses.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-600">{formatDate(course.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                          {course.isPublished ? 'Publicerad' : 'Utkast'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste Användare</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Kurser</h2>
                <button
                  onClick={handleCreateCourse}
                  className="btn-primary inline-flex items-center w-full sm:w-auto justify-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Skapa Ny Kurs
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Inga kurser</h3>
                  <p className="mt-1 text-sm text-gray-500">Börja med att skapa din första kurs.</p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateCourse}
                      className="btn-primary inline-flex items-center"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Skapa Kurs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kurs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pris
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registrerade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Skapad
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Åtgärder
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500">{course.description.substring(0, 60)}...</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(course.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {course.enrolledUsers}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                              {course.isPublished ? 'Publicerad' : 'Utkast'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(course.createdAt)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleEditCourse(course)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Redigera kursinfo"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditCourseContent(course.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Redigera innehåll"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Ta bort kurs"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">Användare</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Användare
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Företag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kurser
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BankID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrerad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.company || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.enrolledCourses} / {user.completedCourses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.bankIdVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.bankIdVerified ? 'Verifierad' : 'Ej verifierad'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">Företag</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Företag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anställda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrerat
                      </th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.employeeCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {company.isActive ? 'Aktivt' : 'Inaktivt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(company.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* APV Submissions Tab */}
          {activeTab === 'apv-submissions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">APV Submissions</h2>
              <p className="text-gray-600">Hantera användares APV submissions för ID06-registrering</p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Användare
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kurs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poäng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inskickad
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Åtgärder
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                          Inga inlämningar att visa
                        </td>
                      </tr>
                    ) : (
                      submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {submission.user.name || submission.user.email}
                              </div>
                              <div className="text-sm text-gray-500">{submission.user.email}</div>
                              {submission.user.personalNumber && (
                                <div className="text-sm text-gray-500">{submission.user.personalNumber}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{submission.courseTitle}</div>
                            <div className="text-sm text-gray-500">{submission.course.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{submission.finalScore}%</div>
                            <div className="text-sm text-gray-500">
                              {submission.correctAnswers}/{submission.totalQuestions} rätt
                            </div>
                            {submission.timeTaken && (
                              <div className="text-sm text-gray-500">
                                {submission.timeTaken < 60 
                                  ? `${submission.timeTaken}min` 
                                  : `${Math.floor(submission.timeTaken / 60)}h ${submission.timeTaken % 60}m`
                                }
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getSubmissionStatusBadge(submission.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(submission.submittedAt).toLocaleDateString('sv-SE')}
                            <div className="text-xs text-gray-400">
                              {new Date(submission.submittedAt).toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleViewSubmission(submission)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Granska
                            </button>
                            {submission.status === 'PENDING' && (
                              <>
                                <button 
                                  onClick={() => handleUpdateSubmissionStatus(submission.id, 'APPROVED')}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Godkänn
                                </button>
                                <button 
                                  onClick={() => handleUpdateSubmissionStatus(submission.id, 'REJECTED')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Avvisa
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Course Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        course={editingCourse}
        onSave={handleSaveCourse}
        isSaving={isSavingCourse}
      />

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        onUpdateStatus={handleUpdateSubmissionStatus}
      />

      {/* Gift Course Modal */}
      <GiftCourseModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSuccess={() => {
          // Refresh data after successful gift
          fetchAdminData();
        }}
      />
    </div>
  );
}
