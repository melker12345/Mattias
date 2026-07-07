'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/app/providers';
import CourseModal, { type Course } from '@/components/CourseModal';
import GiftCourseModal from '@/components/GiftCourseModal';
import { AdminTabs } from './components/AdminTabs';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { AdminCoursesTab } from './components/AdminCoursesTab';
import { AdminUsersTab } from './components/AdminUsersTab';
import { AdminCompaniesTab } from './components/AdminCompaniesTab';
import { AdminCourseResultsTab } from './components/AdminCourseResultsTab';
import { CourseResultDetailModal } from './components/CourseResultDetailModal';
import { useAdminData } from './hooks/useAdminData';
import type { AdminTab, AdminCourse, CourseResult } from '@/lib/types/admin';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const {
    courses,
    users,
    companies,
    courseResults,
    loading,
    refreshResource,
    refreshAll,
  } = useAdminData(activeTab);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CourseResult | null>(null);

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: AdminCourse) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (courseData: Course) => {
    try {
      setIsSavingCourse(true);

      const url = editingCourse
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        setIsCourseModalOpen(false);
        setEditingCourse(null);
        await refreshResource('courses');
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

  const handleToggleBypass = async (userId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paywallBypassActive: active }),
      });
      if (response.ok) {
        await refreshResource('users');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.message || 'Kunde inte uppdatera testkontots status');
      }
    } catch (error) {
      console.error('Error toggling test account bypass:', error);
      alert('Kunde inte uppdatera testkontots status');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kurs?')) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
      if (response.ok) {
        await refreshResource('courses');
      } else {
        const error = await response.json();
        alert(error.message || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ett fel uppstod vid borttagning av kurs');
    }
  };

  if (!authLoading && !loading && (!user || user.user_metadata?.role !== 'ADMIN')) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-24 sm:pt-28">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Hantera kurser, användare och företag</p>
        </div>

        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              courses={courses}
              users={users}
              totalCompanies={companies.length}
              onGiftCourse={() => setShowGiftModal(true)}
              onCreateCourse={handleCreateCourse}
            />
          )}
          {activeTab === 'courses' && (
            <AdminCoursesTab
              courses={courses}
              onCreateCourse={handleCreateCourse}
              onEditCourse={handleEditCourse}
              onEditCourseContent={(courseId) => router.push(`/admin/courses/${courseId}/edit`)}
              onDeleteCourse={handleDeleteCourse}
            />
          )}
          {activeTab === 'users' && <AdminUsersTab users={users} onToggleBypass={handleToggleBypass} />}
          {activeTab === 'companies' && <AdminCompaniesTab companies={companies} />}
          {activeTab === 'course-results' && (
            <AdminCourseResultsTab
              results={courseResults}
              onViewResult={setSelectedResult}
            />
          )}
        </div>
      </div>

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

      <GiftCourseModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSuccess={() => refreshAll()}
      />

      <CourseResultDetailModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
}
