export type AdminTab = 'overview' | 'courses' | 'users' | 'companies' | 'apv-submissions';

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
  completedUsers: number;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
  personalNumber: string | null;
  bankIdVerified: boolean;
  id06Eligible: boolean;
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

export interface APVSubmission {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    personalNumber?: string;
  };
  course: {
    id: string;
    title: string;
    category: string;
  };
  courseTitle: string;
  completionDate: string;
  finalScore: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken?: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  answersData: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    options: string[];
    selectedIndex: number;
    correctAnswerText: string;
    userAnswerText: string;
  }>;
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