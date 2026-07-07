'use client';

import type { Employee, EmployeeDetails } from '@/lib/types/company-dashboard';

interface EmployeeDetailsPanelProps {
  employee: Employee;
  details: EmployeeDetails | undefined;
  isLoading: boolean;
  onPurchaseForEmployee: (employeeId: string, employeeName: string) => void;
}

export function EmployeeDetailsPanel({
  employee,
  details,
  isLoading,
  onPurchaseForEmployee,
}: EmployeeDetailsPanelProps) {
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
          <p className="text-sm text-gray-600">Personnummer: {details.personalNumber}</p>
          <p className="text-sm text-gray-600">
            Registrerad: {new Date(details.createdAt).toLocaleDateString('sv-SE')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Verifiering</h4>
          <div className="space-y-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              details.bankIdVerified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {details.bankIdVerified ? 'BankID-verifierad' : 'Väntar på BankID'}
            </span>
            {details.bankIdVerifiedAt && (
              <p className="text-xs text-gray-500">
                Verifierad: {new Date(details.bankIdVerifiedAt).toLocaleDateString('sv-SE')}
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

      {!details.bankIdVerified && details.invitationLink && (
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