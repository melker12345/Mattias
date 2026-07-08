export type AdminTab = 'overview' | 'courses' | 'users' | 'companies' | 'course-results';

export type CourseResultStatus = 'in_progress' | 'passed' | 'failed';

export interface CourseResult {
  enrollmentId: string;
  user: { id: string; name: string | null; email: string; company: string | null };
  course: { id: string; title: string; category: string; passingScore: number };
  status: CourseResultStatus;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  finalScore: number | null;
  correctAnswers: number;
  totalQuestions: number;
  enrolledAt: string;
  completedAt: string | null;
}

export interface CourseResultAnswer {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerText: string;
  userAnswer: string;
  userAnswerText: string;
  selectedIndex: number;
  isCorrect: boolean;
  answered: boolean;
}

export interface CourseResultDetail {
  enrollmentId: string;
  user: { id: string; name: string | null; email: string; company: string | null };
  course: { id: string; title: string; category: string; passingScore: number };
  status: CourseResultStatus;
  finalScore: number | null;
  correctAnswers: number;
  totalQuestions: number;
  enrolledAt: string;
  completedAt: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lessons: Array<{ id: string; title: string; order: number; completed: boolean; completedAt: string | null }>;
  answers: CourseResultAnswer[];
}

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  isPublished: boolean;
  enrolledUsers: number;
  payingEnrolledUsers: number;
  completedUsers: number;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface AdminBundle {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  isPublished: boolean;
  courses: Array<{ id: string; title: string; price: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  identityVerified: boolean;
  id06Eligible: boolean;
  isTestAccount: boolean;
  paywallBypassActive: boolean;
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  lastActive: string;
  createdAt: string;
}

export interface AdminCompany {
  id: string;
  name: string;
  organizationNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  verified: boolean;
  isActive: boolean;
  adminName: string;
  adminEmail: string;
  employeeCount: number;
  invitationCount: number;
  createdAt: string;
  updatedAt: string;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
  }).format(price);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('sv-SE');
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleColor(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800';
    case 'COMPANY_ADMIN':
      return 'bg-blue-100 text-blue-800';
    case 'EMPLOYEE':
      return 'bg-green-100 text-green-800';
    case 'INDIVIDUAL':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}