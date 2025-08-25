'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface EnrolledCourse {
  id: string
  title: string
  progress: number
  totalLessons: number
  completedLessons: number
  image?: string
  lastAccessed?: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Redirect company admins to company dashboard
    if ((session.user as any)?.role === 'COMPANY_ADMIN') {
      router.push('/dashboard/company')
      return
    }

    // Simulate fetching enrolled courses
    const fetchEnrolledCourses = async () => {
      try {
        // Mock data - replace with actual API call
        const mockCourses: EnrolledCourse[] = [
          {
            id: '1',
            title: 'Arbete på Väg - Grundkurs',
            progress: 75,
            totalLessons: 8,
            completedLessons: 6,
            lastAccessed: '2024-01-15',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          },
          {
            id: '2',
            title: 'Säkerhet i Byggbranschen',
            progress: 30,
            totalLessons: 12,
            completedLessons: 4,
            lastAccessed: '2024-01-10',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          }
        ]
        
        setEnrolledCourses(mockCourses)
      } catch (error) {
        console.error('Error fetching enrolled courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrolledCourses()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Välkommen tillbaka, {session.user?.name || 'Användare'}!
          </h1>
          <p className="text-gray-600">
            Här kan du se dina kurser och fortsätta där du slutade.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktiva kurser</p>
                <p className="text-2xl font-semibold text-gray-900">{enrolledCourses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Slutförda lektioner</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {enrolledCourses.reduce((sum, course) => sum + course.completedLessons, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certifikat</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {enrolledCourses.filter(course => course.progress === 100).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mina Kurser</h2>
          </div>
          
          {enrolledCourses.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="p-6">
                  <div className="flex items-center space-x-4">
                                         <div className="flex-shrink-0">
                       <Image
                         src={course.image || '/images/course-placeholder.jpg'}
                         alt={course.title}
                         width={64}
                         height={64}
                         className="w-16 h-16 rounded-lg object-cover"
                       />
                     </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {course.completedLessons} av {course.totalLessons} lektioner slutförda
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        {course.progress}% slutförd
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Link
                        href={`/courses/${course.id}/learn`}
                        className="btn-primary"
                      >
                        {course.progress === 100 ? 'Se certifikat' : 'Fortsätt lära'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga kurser ännu
              </h3>
              <p className="text-gray-600 mb-4">
                Du har inte registrerat dig för några kurser än. Utforska vårt utbud och börja lära dig!
              </p>
              <Link href="/courses" className="btn-primary">
                Utforska kurser
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Snabbåtgärder</h3>
            <div className="space-y-3">
              <Link
                href="/courses"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Utforska nya kurser
              </Link>
              <Link
                href="/certificates"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Visa certifikat
              </Link>
              <Link
                href="/profile"
                className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Redigera profil
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste aktivitet</h3>
            <div className="space-y-3">
              {enrolledCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                                     <span className="text-gray-600">
                     Fortsatte med &quot;{course.title}&quot;
                   </span>
                  <span className="ml-auto text-gray-400">
                    {course.lastAccessed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
