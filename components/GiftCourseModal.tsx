'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

interface GiftCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GiftCourseModal({ isOpen, onClose, onSuccess }: GiftCourseModalProps) {
  const [userEmail, setUserEmail] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [reason, setReason] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User search states
  const [users, setUsers] = useState<Array<{id: string, email: string, name: string}>>([]);
  const [filteredUsers, setFilteredUsers] = useState<Array<{id: string, email: string, name: string}>>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (courseSearch) {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.description.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.category.toLowerCase().includes(courseSearch.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [courseSearch, courses]);

  // User search effect
  useEffect(() => {
    if (userEmail.length >= 2) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(userEmail.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(userEmail.toLowerCase()))
      );
      setFilteredUsers(filtered.slice(0, 10)); // Limit to 10 results
      setShowUserDropdown(filtered.length > 0);
    } else {
      setFilteredUsers([]);
      setShowUserDropdown(false);
    }
  }, [userEmail, users]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: user.name || ''
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail || !selectedCourseId) {
      setError('Vänligen fyll i alla obligatoriska fält');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/gift-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          courseId: selectedCourseId,
          reason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setUserEmail('');
        setSelectedCourseId('');
        setReason('');
        setCourseSearch('');
        onSuccess();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Ett fel uppstod vid gåvogivning');
      }
    } catch (error) {
      setError('Ett fel uppstod vid gåvogivning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (user: {id: string, email: string, name: string}) => {
    setUserEmail(user.email);
    setShowUserDropdown(false);
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserEmail(e.target.value);
    // Show dropdown when user starts typing
    if (e.target.value.length >= 2) {
      setShowUserDropdown(true);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity duration-300 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div
          className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all duration-300 transform bg-white shadow-xl rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <GiftIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ge bort kurs
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ge en användare gratis tillgång till en kurs
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-800 text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Email Input with Autocomplete */}
              <div className="relative">
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Mottagarens e-postadress *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <input
                    type="email"
                    id="userEmail"
                    value={userEmail}
                    onChange={handleUserInputChange}
                    onFocus={() => {
                      if (userEmail.length >= 2 && filteredUsers.length > 0) {
                        setShowUserDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding dropdown to allow clicks
                      setTimeout(() => setShowUserDropdown(false), 200);
                    }}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="Börja skriva namn eller e-post..."
                    required
                    autoComplete="off"
                  />
                  
                  {/* Loading indicator */}
                  {isLoadingUsers && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {user.name && (
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                            )}
                            <p className={`text-sm text-gray-500 truncate ${!user.name ? 'font-medium text-gray-900' : ''}`}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  {userEmail.length >= 2 ? 
                    `${filteredUsers.length} användare hittades` : 
                    'Skriv minst 2 tecken för att söka bland befintliga användare'
                  }
                </p>
              </div>

              {/* Course Search */}
              <div>
                <label htmlFor="courseSearch" className="block text-sm font-medium text-gray-700 mb-2">
                  Sök kurs *
                </label>
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="courseSearch"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="Sök efter kursnamn, beskrivning eller kategori..."
                  />
                </div>

                {/* Course Selection */}
                <div 
                  className="max-h-60 overflow-y-auto border border-gray-300 rounded-md bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  {filteredCourses.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">Inga kurser hittades</p>
                      {courseSearch && (
                        <p className="text-xs text-gray-400 mt-1">Försök med andra sökord</p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredCourses.map((course, index) => (
                        <label
                          key={course.id}
                          className={`block p-4 cursor-pointer transition-colors duration-150 ${
                            selectedCourseId === course.id 
                              ? 'bg-primary-50 border-l-4 border-l-primary-500' 
                              : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                          } ${index === filteredCourses.length - 1 ? '' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="radio"
                              name="course"
                              value={course.id}
                              checked={selectedCourseId === course.id}
                              onChange={(e) => setSelectedCourseId(e.target.value)}
                              className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500 focus:ring-2"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                                    {course.title}
                                  </h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      {course.category}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      course.price === 0 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {course.price === 0 ? 'Gratis' : `${course.price.toLocaleString('sv-SE')} SEK`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                {course.description}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Course Summary */}
              {selectedCourse && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Vald kurs för gåva</h4>
                      <p className="text-sm font-semibold text-blue-800 mb-1">{selectedCourse.title}</p>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {selectedCourse.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                          selectedCourse.price === 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {selectedCourse.price === 0 ? 'Gratis kurs' : `Värde: ${selectedCourse.price.toLocaleString('sv-SE')} SEK`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason Input */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Anledning (valfritt)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none text-gray-900 placeholder-gray-400"
                  placeholder="T.ex. 'Belöning för utmärkt arbete', 'Kompetensutveckling', etc."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Denna information sparas för dokumentation och kommer att visas i loggar
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !userEmail || !selectedCourseId}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center transition-all duration-200 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ger bort kurs...
                    </>
                  ) : (
                    <>
                      <GiftIcon className="w-4 h-4 mr-2" />
                      Ge bort kurs
                    </>
                  )}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}
