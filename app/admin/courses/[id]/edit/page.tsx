'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlayIcon,
  PhotoIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import AddContentModal from '@/components/AddContentModal';
import LessonEditor from '@/components/LessonEditor';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  isPublished: boolean;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text' | 'question';
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  order: number;
  questions?: Question[];
}

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options: string;
  correctAnswer: string;
  explanation?: string;
  order: number;
}

export default function CourseEditorPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isLessonEditorOpen, setIsLessonEditorOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchCourseData();
    }
  }, [session, params.id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course and lessons in parallel
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`/api/admin/courses/${params.id}`),
        fetch(`/api/admin/courses/${params.id}/lessons`)
      ]);

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContent = async (contentData: any) => {
    try {
      const response = await fetch(`/api/admin/courses/${params.id}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData),
      });

      if (response.ok) {
        setIsAddContentModalOpen(false);
        fetchCourseData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Ett fel uppstod vid tillägg av innehåll');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setIsLessonEditorOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna lektion?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${params.id}/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCourseData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.message || 'Ett fel uppstod');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Ett fel uppstod vid borttagning av lektion');
    }
  };

  const moveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;

    // Swap orders
    const currentLesson = lessons[currentIndex];
    const targetLesson = lessons[newIndex];

    try {
      await Promise.all([
        fetch(`/api/admin/courses/${params.id}/lessons/${currentLesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentLesson, order: targetLesson.order }),
        }),
        fetch(`/api/admin/courses/${params.id}/lessons/${targetLesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...targetLesson, order: currentLesson.order }),
        }),
      ]);

      fetchCourseData(); // Refresh data
    } catch (error) {
      console.error('Error moving lesson:', error);
      alert('Ett fel uppstod vid flytt av lektion');
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayIcon className="w-5 h-5" />;
      case 'image':
        return <PhotoIcon className="w-5 h-5" />;
      case 'text':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'question':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'image':
        return 'Bild';
      case 'text':
        return 'Text';
      case 'question':
        return 'Fråga';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kurs hittades inte</h1>
          <Link href="/admin" className="btn-primary">
            Tillbaka till admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Tillbaka till admin
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Redigera Kurs</h1>
                <p className="text-gray-600">{course.title}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddContentModalOpen(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Lägg till innehåll
            </button>
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kursinformation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Titel</label>
              <p className="text-gray-900">{course.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <p className="text-gray-900">{course.category}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pris</label>
              <p className="text-gray-900">{course.price} kr</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {course.isPublished ? 'Publicerad' : 'Utkast'}
              </span>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Kursinnehåll</h2>
            <p className="text-gray-600">Hantera lektioner och innehåll för denna kurs</p>
          </div>

          <div className="p-6">
            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <DocumentTextIcon className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Inget innehåll än</h3>
                <p className="text-gray-600 mb-6">
                  Börja med att lägga till innehåll för din kurs.
                </p>
                <button
                  onClick={() => setIsAddContentModalOpen(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Lägg till första innehållet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-full">
                          {getContentIcon(lesson.type)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                          <p className="text-sm text-gray-500">
                            {getContentTypeLabel(lesson.type)} • Ordning {lesson.order}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveLesson(lesson.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveLesson(lesson.id, 'down')}
                          disabled={index === lessons.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditLesson(lesson)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
        onAdd={handleAddContent}
      />

      {/* Lesson Editor Modal */}
      <AnimatePresence>
        {isLessonEditorOpen && editingLesson && (
          <LessonEditor
            lesson={editingLesson}
            onClose={() => {
              setIsLessonEditorOpen(false);
              setEditingLesson(null);
            }}
            onSave={() => {
              setIsLessonEditorOpen(false);
              setEditingLesson(null);
              fetchCourseData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
