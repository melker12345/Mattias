'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { AdminCourse } from '@/lib/types/admin';
import { formatDate } from '@/lib/types/admin';

interface EnrollmentUser {
  id: string;
  name: string | null;
  email: string;
}

interface CourseEnrollment {
  id: string;
  enrolled_at: string;
  completed_at: string | null;
  passed: boolean;
  is_paid: boolean;
  is_gift: boolean;
  user: EnrollmentUser | null;
}

interface CourseDetail {
  lessons: Array<{ id: string }>;
  enrollments: CourseEnrollment[];
}

interface DeleteCourseModalProps {
  course: AdminCourse | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

function enrollmentStatus(e: CourseEnrollment) {
  if (e.completed_at) return e.passed ? 'Godkänd' : 'Slutförd';
  return 'Pågående';
}

export function DeleteCourseModal({ course, onClose, onConfirm, isDeleting }: DeleteCourseModalProps) {
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!course) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/courses/${course.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Kunde inte hämta kursinformation');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDetail({ lessons: data.lessons ?? [], enrollments: data.enrollments ?? [] });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Kunde inte hämta kursinformation');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [course]);

  const enrollments = detail?.enrollments ?? [];
  const registered = enrollments.length;
  const paying = enrollments.filter((e) => e.is_paid).length;
  const completed = enrollments.filter((e) => e.completed_at).length;
  const gifts = enrollments.filter((e) => e.is_gift).length;
  const lessons = detail?.lessons.length ?? 0;

  return (
    <AnimatePresence>
      {course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ta bort kurs</h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Du är på väg att ta bort <span className="font-medium">{course.title}</span>.
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Stäng">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              {loading ? (
                <div className="py-10 text-center text-sm text-gray-500">Hämtar kursinformation…</div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-red-600">{error}</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{registered}</div>
                      <div className="text-xs text-gray-500">Registrerade</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{paying}</div>
                      <div className="text-xs text-gray-500">Betalande</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{completed}</div>
                      <div className="text-xs text-gray-500">Slutförda</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{lessons}</div>
                      <div className="text-xs text-gray-500">Lektioner</div>
                    </div>
                  </div>

                  {registered > 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-5">
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">{registered} användare</span> är registrerade på den här
                        kursen{paying > 0 ? `, varav ${paying} har betalat` : ''}. Om du tar bort kursen förloras
                        deras registreringar, resultat och eventuella certifikat. Detta går inte att ångra.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-5">
                      <p className="text-sm text-gray-600">
                        Inga användare är registrerade på den här kursen. Det är säkert att ta bort den.
                      </p>
                    </div>
                  )}

                  {registered > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Registrerade användare</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Namn</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-post</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrerad</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {enrollments.map((e) => (
                                <tr key={e.id}>
                                  <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                    {e.user?.name || '—'}
                                    {e.is_gift && <span className="ml-1 text-xs text-purple-600">(gåva)</span>}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{e.user?.email || '—'}</td>
                                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(e.enrolled_at)}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span
                                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        e.completed_at
                                          ? e.passed
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {enrollmentStatus(e)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting || loading}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isDeleting ? 'Tar bort…' : registered > 0 ? `Ta bort kurs och ${registered} registreringar` : 'Ta bort kurs'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
