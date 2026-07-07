'use client';

import type { APVSubmission } from '@/lib/types/admin';

interface DeleteSubmissionModalProps {
  submission: APVSubmission;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteSubmissionModal({
  submission,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteSubmissionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-red-900 mb-4">Ta bort inlämning</h3>

        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-4">
            Är du säker på att du vill ta bort denna inlämning? Detta kommer att:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4 ml-4">
            <li>• Ta bort inlämningen permanent</li>
            <li>• Tillåta användaren att skicka in på nytt</li>
            <li>• Användaren kan då få en ny poäng baserat på uppdaterat kursinnehåll</li>
          </ul>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Användare:</strong> {submission.user.name || submission.user.email}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Kurs:</strong> {submission.courseTitle}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Nuvarande poäng:</strong> {submission.finalScore}%
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Tar bort...
              </>
            ) : (
              'Ta bort inlämning'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}