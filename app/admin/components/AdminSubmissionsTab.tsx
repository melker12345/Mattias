'use client';

import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import type { APVSubmission } from '@/lib/types/admin';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';

interface AdminSubmissionsTabProps {
  submissions: APVSubmission[];
  onViewSubmission: (submission: APVSubmission) => void;
  onUpdateStatus: (submissionId: string, status: 'APPROVED' | 'REJECTED') => void;
  onDeleteSubmission: (submission: APVSubmission) => void;
}

export function AdminSubmissionsTab({
  submissions,
  onViewSubmission,
  onUpdateStatus,
  onDeleteSubmission,
}: AdminSubmissionsTabProps) {
  return (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Användare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poäng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inskickad</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
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
                          : `${Math.floor(submission.timeTaken / 60)}h ${submission.timeTaken % 60}m`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SubmissionStatusBadge status={submission.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString('sv-SE')}
                    <div className="text-xs text-gray-400">
                      {new Date(submission.submittedAt).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onViewSubmission(submission)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded transition-colors"
                        title="Granska inlämning"
                      >
                        Granska
                      </button>

                      {submission.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(submission.id, 'APPROVED')}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded transition-colors"
                            title="Godkänn inlämning"
                          >
                            Godkänn
                          </button>
                          <button
                            onClick={() => onUpdateStatus(submission.id, 'REJECTED')}
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded transition-colors"
                            title="Avvisa inlämning"
                          >
                            Avvisa
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => onDeleteSubmission(submission)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        title="Ta bort inlämning (tillåter omskickning)"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}