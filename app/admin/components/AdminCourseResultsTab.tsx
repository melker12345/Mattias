'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { CourseResult, CourseResultStatus } from '@/lib/types/admin';
import { formatDate } from '@/lib/types/admin';
import { categoryLabel } from '@/lib/categories';

interface AdminCourseResultsTabProps {
  results: CourseResult[];
  onViewResult: (result: CourseResult) => void;
}

const STATUS_LABELS: Record<CourseResultStatus, string> = {
  in_progress: 'Pågående',
  passed: 'Godkänd',
  failed: 'Underkänd',
};

const STATUS_COLORS: Record<CourseResultStatus, string> = {
  in_progress: 'bg-yellow-100 text-yellow-800',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

type Filter = 'all' | CourseResultStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alla' },
  { id: 'in_progress', label: 'Pågående' },
  { id: 'passed', label: 'Godkända' },
  { id: 'failed', label: 'Underkända' },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-[60px] h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-600 tabular-nums w-9 text-right">{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: CourseResultStatus }) {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function AdminCourseResultsTab({ results, onViewResult }: AdminCourseResultsTabProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return (
        (r.user.name ?? '').toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        (r.user.company ?? '').toLowerCase().includes(q) ||
        r.course.title.toLowerCase().includes(q)
      );
    });
  }, [results, filter, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Kursresultat</h2>
        <p className="text-sm text-gray-600">Alla användare som påbörjat en kurs — progression, resultat och svar</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök användare, företag eller kurs…"
          className="sm:ml-auto w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Inga kursresultat att visa</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Användare</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anmäld</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((r) => (
                  <tr key={r.enrollmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{r.user.name || r.user.email}</div>
                      <div className="text-sm text-gray-500">{r.user.email}</div>
                      {r.user.company && <div className="text-xs text-gray-400">{r.user.company}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{r.course.title}</div>
                      <div className="text-xs text-gray-500">{categoryLabel(r.course.category)}</div>
                    </td>
                    <td className="px-4 py-4 w-48">
                      <ProgressBar value={r.progressPercentage} />
                      <div className="text-xs text-gray-400 mt-1">{r.completedLessons}/{r.totalLessons} lektioner</div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-4">
                      {r.status === 'in_progress' ? (
                        <span className="text-sm text-gray-400">—</span>
                      ) : (
                        <>
                          <div className="text-sm text-gray-900">{r.finalScore ?? 0}%</div>
                          <div className="text-xs text-gray-500">{r.correctAnswers}/{r.totalQuestions} rätt</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(r.enrolledAt)}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => onViewResult(r)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Granska
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <button
                key={r.enrollmentId}
                onClick={() => onViewResult(r)}
                className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 space-y-3 active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.user.name || r.user.email}</div>
                    <div className="text-xs text-gray-500 truncate">{r.user.email}</div>
                    {r.user.company && <div className="text-xs text-gray-400 truncate">{r.user.company}</div>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-sm text-gray-900">{r.course.title}</div>
                <ProgressBar value={r.progressPercentage} />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{r.completedLessons}/{r.totalLessons} lektioner</span>
                  {r.status !== 'in_progress' && <span>{r.finalScore ?? 0}% · {r.correctAnswers}/{r.totalQuestions} rätt</span>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
