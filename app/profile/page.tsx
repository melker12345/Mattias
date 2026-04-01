'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  AcademicCapIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    role: string;
  };
  enrollments: Array<{
    id: string;
    course: {
      id: string;
      name: string;
      description: string;
    };
    enrolledAt: string;
    completedAt?: string;
    passed?: boolean;
    finalScore?: number;
    isGift: boolean;
    giftedBy?: string;
    giftedAt?: string;
    giftReason?: string;
  }>;
  certificates: Array<{
    id: string;
    course: {
      name: string;
    };
    issuedAt: string;
  }>;
}

export default function ProfilePage() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/signin');
      return;
    }

    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !profile) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, email: newEmail } : null);
        setNewEmail('');
        setShowEmailModal(false);
        // Refresh the session to update the email
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Failed to update email');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE' || !profile) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Sign out and redirect to home
        router.push('/');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600">Unable to load your profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administratör';
      case 'USER': return 'Användare';
      case 'COMPANY_ADMIN': return 'Företagsadministratör';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Min Profil</h1>
          <p className="text-gray-600 mt-2">Hantera din kontoinformation och inställningar</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-6 h-6 mr-2 text-primary-600" />
              Kontoinformation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Namn</label>
                <p className="text-gray-900">{profile.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <div className="flex items-center justify-between">
                  <p className="text-gray-900">{profile.email}</p>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Ändra
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll</label>
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-2 text-primary-600" />
                  <span className="text-gray-900">{getRoleDisplay(profile.role)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medlem sedan</label>
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-900">{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            {profile.company && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Företagsinformation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Företag</label>
                    <p className="text-gray-900">{profile.company.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll på företaget</label>
                    <p className="text-gray-900">{profile.company.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course Enrollments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AcademicCapIcon className="w-6 h-6 mr-2 text-primary-600" />
              Mina Kurser ({profile.enrollments.length})
            </h2>
            
            {profile.enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Du har inte registrerat dig för några kurser än.</p>
            ) : (
              <div className="space-y-4">
                {profile.enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{enrollment.course.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{enrollment.course.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Registrerad:</span>
                            <p className="text-gray-900">{formatDate(enrollment.enrolledAt)}</p>
                          </div>
                          
                          {enrollment.completedAt && (
                            <div>
                              <span className="text-gray-500">Slutförd:</span>
                              <p className="text-gray-900">{formatDate(enrollment.completedAt)}</p>
                            </div>
                          )}
                          
                          {enrollment.finalScore !== undefined && (
                            <div>
                              <span className="text-gray-500">Poäng:</span>
                              <p className="text-gray-900">{enrollment.finalScore}%</p>
                            </div>
                          )}
                          
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="flex items-center">
                              {enrollment.passed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Godkänd
                                </span>
                              ) : enrollment.completedAt ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Underkänd
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pågående
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {enrollment.isGift && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center text-sm text-blue-800">
                              <span className="font-medium">🎁 Gåva</span>
                              {enrollment.giftedBy && (
                                <span className="ml-2">från {enrollment.giftedBy}</span>
                              )}
                              {enrollment.giftReason && (
                                <span className="ml-2">- {enrollment.giftReason}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => router.push(`/courses/${enrollment.course.id}/learn`)}
                          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          {enrollment.completedAt ? 'Visa sammanfattning' : 'Fortsätt kurs'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-primary-600" />
                Mina Certifikat ({profile.certificates.length})
              </h2>
              
              <div className="space-y-4">
                {profile.certificates.map((certificate) => (
                  <div key={certificate.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{certificate.course.name}</h3>
                        <p className="text-sm text-gray-600">Utfärdat {formatDate(certificate.issuedAt)}</p>
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Ladda ner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="px-6 py-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
              <TrashIcon className="w-6 h-6 mr-2 text-red-600" />
              Farlig zon
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-900 mb-2">Radera konto</h3>
                <p className="text-sm text-red-700 mb-4">
                  Detta kommer att permanent radera ditt konto och all tillhörande data. 
                  Denna åtgärd kan inte ångras.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Radera konto
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Change Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ändra e-postadress</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ny e-postadress</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="ny@email.com"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleEmailChange}
                  disabled={!newEmail || isUpdating}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Uppdaterar...' : 'Uppdatera'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-red-900 mb-4">Radera konto</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-4">
                  För att bekräfta att du vill radera ditt konto, skriv <strong>DELETE</strong> i rutan nedan.
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || isUpdating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Raderar...' : 'Radera konto'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
