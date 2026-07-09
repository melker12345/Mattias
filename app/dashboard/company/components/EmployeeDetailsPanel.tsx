'use client';

import { useState } from 'react';
import type { Employee, EmployeeDetails } from '@/lib/types/company-dashboard';

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'Pågående',
  passed: 'Godkänd',
  failed: 'Underkänd',
};

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-yellow-100 text-yellow-800',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

interface EmployeeDetailsPanelProps {
  employee: Employee;
  details: EmployeeDetails | undefined;
  isLoading: boolean;
  companyId: string | null;
  onPurchaseForEmployee: (employeeId: string, employeeName: string) => void;
  onUpdated: () => void;
}

export function EmployeeDetailsPanel({
  employee,
  details,
  isLoading,
  companyId,
  onPurchaseForEmployee,
  onUpdated,
}: EmployeeDetailsPanelProps) {
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [idName, setIdName] = useState('');
  const [idPersonnummer, setIdPersonnummer] = useState('');
  const [idPhone, setIdPhone] = useState('');
  const [savingId, setSavingId] = useState(false);
  const [idMsg, setIdMsg] = useState<string | null>(null);

  const startEditIdentity = () => {
    setIdName(details?.name ?? '');
    setIdPhone(details?.phone ?? '');
    setIdPersonnummer('');
    setIdMsg(null);
    setEditingIdentity(true);
  };

  const saveIdentity = async () => {
    if (!companyId) return;
    setSavingId(true);
    setIdMsg(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: idName, personnummer: idPersonnummer || undefined, phone: idPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setIdMsg(data.message || 'Kunde inte spara'); return; }
      setEditingIdentity(false);
      onUpdated();
    } catch {
      setIdMsg('Kunde inte spara');
    } finally {
      setSavingId(false);
    }
  };

  const toggleAnswers = (enrollmentId: string) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) next.delete(enrollmentId);
      else next.add(enrollmentId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Laddar detaljer...</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Kunde inte ladda detaljer</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Kontaktinformation</h4>
          <p className="text-sm text-gray-600">E-post: {details.email}</p>
          <p className="text-sm text-gray-600">
            Registrerad: {new Date(details.createdAt).toLocaleDateString('sv-SE')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Verifiering</h4>
          <div className="space-y-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              details.identityVerified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {details.identityVerified ? 'Identitetsverifierad' : 'Väntar på verifiering'}
            </span>
            {details.identityVerifiedAt && (
              <p className="text-xs text-gray-500">
                Verifierad: {new Date(details.identityVerifiedAt).toLocaleDateString('sv-SE')}
              </p>
            )}
            {details.id06Eligible && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ID06-berättigad
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Statistik</h4>
          <p className="text-sm text-gray-600">Registrerade kurser: {details.enrollments.length}</p>
          <p className="text-sm text-gray-600">
            Slutförda kurser: {details.enrollments.filter((e) => e.completedAt).length}
          </p>
          <p className="text-sm text-gray-600">
            Certifikat: {details.enrollments.reduce((sum, e) => sum + e.certificates.length, 0)}
          </p>
        </div>
      </div>

      {/* Identity — the company can fill these in on the employee's behalf. */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Personuppgifter</h4>
          {!editingIdentity && (
            <button onClick={startEditIdentity} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Redigera uppgifter
            </button>
          )}
        </div>

        {!editingIdentity ? (
          <div className="text-sm text-gray-600 space-y-1">
            <p>Namn: {details.name || '—'}</p>
            <p>Personnummer: {details.hasPersonnummer ? 'Ifyllt' : 'Saknas'}</p>
            <p>Telefon: {details.phone || '—'}</p>
            <p className="text-xs text-gray-400 mt-1">
              Genom att fylla i namn och personnummer intygar företaget den anställdes identitet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={idName}
                onChange={(e) => setIdName(e.target.value)}
                placeholder="Namn"
                className="px-3 py-2 text-sm border border-gray-300 rounded"
              />
              <input
                value={idPersonnummer}
                onChange={(e) => setIdPersonnummer(e.target.value)}
                placeholder={details.hasPersonnummer ? 'Nytt personnummer (ersätter)' : 'ÅÅÅÅMMDD-XXXX'}
                className="px-3 py-2 text-sm border border-gray-300 rounded"
              />
              <input
                value={idPhone}
                onChange={(e) => setIdPhone(e.target.value)}
                placeholder="Telefon"
                className="px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>
            {idMsg && <p className="text-sm text-red-600">{idMsg}</p>}
            <div className="flex gap-2">
              <button onClick={saveIdentity} disabled={savingId} className="btn-primary text-sm disabled:opacity-50">
                {savingId ? 'Sparar…' : 'Spara'}
              </button>
              <button onClick={() => setEditingIdentity(false)} className="btn-secondary text-sm">Avbryt</button>
            </div>
          </div>
        )}
      </div>

      {!details.identityVerified && details.invitationLink && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Inbjudningslänk</h4>
          <p className="text-sm text-yellow-800 mb-3">
            Anställd har inte loggat in än. Du kan dela denna länk direkt om e-post inte fungerade.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={details.invitationLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-white"
            />
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(details.invitationLink!);
                  alert('Inbjudningslänk kopierad till urklipp!');
                } catch {
                  alert('Kunde inte kopiera länken');
                }
              }}
              className="px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Kopiera
            </button>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Dela denna länk direkt med anställd via SMS, Slack eller annan kommunikationskanal.
          </p>
        </div>
      )}

      {details.enrollments.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 p-4 border-b border-gray-200">Kurser och Progress</h4>
          <div className="divide-y divide-gray-200">
            {details.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{enrollment.course.title}</h5>
                    <p className="text-sm text-gray-600">
                      Registrerad: {new Date(enrollment.enrolledAt).toLocaleDateString('sv-SE')}
                      {enrollment.completedAt && (
                        <span className="ml-2 text-green-600">
                          • Slutförd: {new Date(enrollment.completedAt).toLocaleDateString('sv-SE')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {enrollment.course.progressPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {enrollment.course.completedLessons}/{enrollment.course.totalLessons} lektioner
                    </div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrollment.course.progressPercentage}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {enrollment.course.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center text-sm">
                      <div className={`w-4 h-4 rounded-full mr-3 ${lesson.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={lesson.completed ? 'text-gray-900' : 'text-gray-600'}>{lesson.title}</span>
                      {lesson.completed && lesson.completedAt && (
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(lesson.completedAt).toLocaleDateString('sv-SE')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Result + how they answered */}
                {enrollment.answers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[enrollment.status]}`}>
                        {STATUS_LABELS[enrollment.status]}
                      </span>
                      {enrollment.status !== 'in_progress' && (
                        <span className="text-sm text-gray-600">
                          {enrollment.finalScore ?? 0}% · {enrollment.correctAnswers}/{enrollment.totalQuestions} rätt
                          <span className="text-gray-400"> (godkänt {enrollment.course.passingScore}%)</span>
                        </span>
                      )}
                      <button
                        onClick={() => toggleAnswers(enrollment.id)}
                        className="ml-auto text-sm text-primary-600 hover:text-primary-800 font-medium"
                      >
                        {expandedAnswers.has(enrollment.id) ? 'Dölj svar' : 'Visa svar'}
                      </button>
                    </div>

                    {expandedAnswers.has(enrollment.id) && (
                      <div className="space-y-2">
                        {enrollment.answers.map((a, i) => (
                          <div key={a.questionId} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <span className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                                a.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {a.isCorrect ? '✓' : '✗'}
                              </span>
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
                    )}
                  </div>
                )}

                {enrollment.certificates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Certifikat</h6>
                    {enrollment.certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">#{cert.certificateNumber}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">
                            {new Date(cert.issuedAt).toLocaleDateString('sv-SE')}
                          </span>
                          {cert.id06Verified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ID06
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 mb-4">Inga kurser registrerade än</p>
          <button
            onClick={() => onPurchaseForEmployee(employee.id, employee.name)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Köp kurser för {employee.name}
          </button>
        </div>
      )}
    </div>
  );
}