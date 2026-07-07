'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/app/providers';
import CourseModal, { type Course } from '@/components/CourseModal';
import SubmissionModal from '@/components/SubmissionModal';
import GiftCourseModal from '@/components/GiftCourseModal';
import { AdminTabs } from './components/AdminTabs';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { AdminCoursesTab } from './components/AdminCoursesTab';
import { AdminUsersTab } from './components/AdminUsersTab';
import { AdminCompaniesTab } from './components/AdminCompaniesTab';
import { AdminSubmissionsTab } from './components/AdminSubmissionsTab';
import { DeleteSubmissionModal } from './components/DeleteSubmissionModal';
import { useAdminData } from './hooks/useAdminData';
import type { AdminTab, AdminCourse, APVSubmission } from '@/lib/types/admin';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const {
    courses,
    users,
    companies,
    submissions,
    loading,
    refreshResource,
    refreshAll,
  } = useAdminData(activeTab);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const [selectedSubmission, setSelectedSubmission] = useState<APVSubmission | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<APVSubmission | null>(null);
  const [isDeletingSubmission, setIsDeletingSubmission] = useState(false);

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

  const handleViewSubmission = (submission: APVSubmission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const handleUpdateSubmissionStatus = async (
    submissionId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string
  ) => {
    try {
      const response = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, status, reviewNotes }),
      });

      if (response.ok) {
        await refreshResource('submissions');
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

  const handleDeleteSubmission = (submission: APVSubmission) => {
    setSubmissionToDelete(submission);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    setIsDeletingSubmission(true);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refreshResource('submissions');
        setShowDeleteConfirm(false);
        setSubmissionToDelete(null);
        const data = await response.json();
        alert(data.message || 'Inlämning borttagen');
      } else {
        const error = await response.json();
        alert(error.message || 'Fel vid borttagning av inlämning');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Ett fel uppstod vid borttagning av inlämning');
    } finally {
      setIsDeletingSubmission(false);
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
          {activeTab === 'users' && <AdminUsersTab users={users} />}
          {activeTab === 'companies' && <AdminCompaniesTab companies={companies} />}
          {activeTab === 'apv-submissions' && (
            <AdminSubmissionsTab
              submissions={submissions}
              onViewSubmission={handleViewSubmission}
              onUpdateStatus={handleUpdateSubmissionStatus}
              onDeleteSubmission={handleDeleteSubmission}
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

      <SubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        onUpdateStatus={handleUpdateSubmissionStatus}
      />

      <GiftCourseModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSuccess={() => refreshAll()}
      />

      {showDeleteConfirm && submissionToDelete && (
        <DeleteSubmissionModal
          submission={submissionToDelete}
          isDeleting={isDeletingSubmission}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSubmissionToDelete(null);
          }}
          onConfirm={confirmDeleteSubmission}
        />
      )}
    </div>
  );
}