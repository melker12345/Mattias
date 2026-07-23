'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { CourseResult, CourseResultDetail, CourseResultAnswer } from '@/lib/types/admin';

interface CourseResultDetailModalProps {
  result: CourseResult | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'Pågående',
  passed: 'Godkänd',
  failed: 'Underkänd',
};

function AnswerGroup({ heading, answers }: { heading: string; answers: CourseResultAnswer[] }) {
  if (answers.length === 0) return null;
  const correct = answers.filter((a) => a.isCorrect).length;
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-2">
        {heading} ({correct}/{answers.length} rätt)
      </h4>
      <div className="space-y-3">
        {answers.map((a, i) => (
          <div key={a.questionId} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              {a.isCorrect
                ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                : <XCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{i + 1}. {a.question}</p>
                <p className={`text-sm mt-1 ${a.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  Svar: {a.answered ? a.userAnswerText : 'Ej besvarad'}
                </p>
                {!a.isCorrect && (
                  <p className="text-sm text-gray-600">Rätt svar: {a.correctAnswerText}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseResultDetailModal({ result, onClose }: CourseResultDetailModalProps) {
  const [detail, setDetail] = useState<CourseResultDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueMsg, setIssueMsg] = useState<string | null>(null);

  const issueCertificate = async () => {
    if (!result) return;
    setIssuing(true);
    setIssueMsg(null);
    try {
      const res = await fetch(`/api/admin/course-results/${result.enrollmentId}/certificate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setIssueMsg(data.message || 'Kunde inte utfärda certifikat');
        return;
      }
      // Refresh the detail so the certificate now shows as issued.
      const refreshed = await fetch(`/api/admin/course-results/${result.enrollmentId}`);
      if (refreshed.ok) setDetail(await refreshed.json());
      setIssueMsg(data.message || 'Certifikat utfärdat');
    } catch {
      setIssueMsg('Kunde inte utfärda certifikat');
    } finally {
      setIssuing(false);
    }
  };

  useEffect(() => {
    if (!result) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/course-results/${result.enrollmentId}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setError('Kunde inte hämta detaljer');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [result]);

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{result.user.name || result.user.email}</h3>
                <p className="text-sm text-gray-500 truncate">{result.user.email}</p>
                {result.user.company && <p className="text-xs text-gray-400 truncate">{result.user.company}</p>}
                <p className="text-sm text-gray-700 mt-1">{result.course.title}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading && <p className="py-8 text-center text-sm text-gray-500">Laddar…</p>}
              {error && <p className="py-8 text-center text-sm text-red-600">{error}</p>}

              {detail && !loading && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="text-sm font-semibold text-gray-900">{STATUS_LABELS[detail.status] ?? detail.status}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">Progression</div>
                      <div className="text-sm font-semibold text-gray-900">{detail.progressPercentage}%</div>
                      <div className="text-xs text-gray-400">{detail.completedLessons}/{detail.totalLessons} lektioner</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500">{detail.hasTest ? 'Provresultat' : 'Resultat'}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {detail.status === 'in_progress' ? '—' : `${detail.finalScore ?? 0}%`}
                      </div>
                      <div className="text-xs text-gray-400">{detail.correctAnswers}/{detail.totalQuestions} rätt</div>
                    </div>
                    {detail.hasTest && detail.learningScore ? (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Övningsfrågor</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {detail.learningScore.total ? `${detail.learningScore.score}%` : '—'}
                        </div>
                        <div className="text-xs text-gray-400">{detail.learningScore.correct}/{detail.learningScore.total} rätt</div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Godkäntgräns</div>
                        <div className="text-sm font-semibold text-gray-900">{detail.course.passingScore}%</div>
                      </div>
                    )}
                  </div>

                  {/* Certificate — admin-granted */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Certifikat</h4>
                        {detail.certificate ? (
                          <p className="text-sm text-green-700 mt-1">
                            Utfärdat · {detail.certificate.certificateNumber}
                          </p>
                        ) : detail.status === 'passed' ? (
                          <p className="text-sm text-gray-600 mt-1">
                            {detail.identityComplete
                              ? 'Godkänd — inget certifikat utfärdat ännu.'
                              : 'Godkänd, men deltagaren saknar namn/personnummer. Fyll i uppgifterna innan certifikat kan utfärdas.'}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">Deltagaren har inte klarat kursen ännu.</p>
                        )}
                        {issueMsg && <p className="text-sm text-gray-700 mt-1">{issueMsg}</p>}
                      </div>
                      {!detail.certificate && detail.status === 'passed' && (
                        <button
                          onClick={issueCertificate}
                          disabled={issuing || !detail.identityComplete}
                          className="shrink-0 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                          title={!detail.identityComplete ? 'Deltagaren saknar namn/personnummer' : undefined}
                        >
                          {issuing ? 'Utfärdar…' : 'Utfärda certifikat'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lesson progression */}
                  {detail.lessons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Lektionsprogression</h4>
                      <ul className="space-y-1">
                        {detail.lessons.map((l) => (
                          <li key={l.id} className="flex items-center gap-2 text-sm">
                            {l.completed
                              ? <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                              : <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />}
                            <span className={l.completed ? 'text-gray-900' : 'text-gray-400'}>{l.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Answers — grouped into test vs. practice when the course has a test. */}
                  {detail.answers.length > 0 && (
                    detail.hasTest ? (
                      <>
                        <AnswerGroup heading="Prov" answers={detail.answers.filter((a) => a.isTest)} />
                        <AnswerGroup heading="Övningsfrågor" answers={detail.answers.filter((a) => !a.isTest)} />
                      </>
                    ) : (
                      <AnswerGroup heading="Svar" answers={detail.answers} />
                    )
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
