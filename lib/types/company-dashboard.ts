export interface Employee {
  id: string;
  name: string;
  email: string;
  identityVerified: boolean;
  id06Eligible: boolean;
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  lastActivity: string;
  status?: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS_INFO';
  hasPersonnummer?: boolean;
}

export interface EmployeeDetails {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  hasPersonnummer?: boolean;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  id06Eligible: boolean;
  createdAt: string;
  updatedAt: string;
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    completedAt: string | null;
    status: 'in_progress' | 'passed' | 'failed';
    finalScore: number | null;
    correctAnswers: number;
    totalQuestions: number;
    course: {
      id: string;
      title: string;
      description: string;
      duration: number;
      passingScore: number;
      totalLessons: number;
      completedLessons: number;
      progressPercentage: number;
      lessons: Array<{
        id: string;
        title: string;
        order: number;
        completed: boolean;
        completedAt: string | null;
      }>;
    };
    answers: Array<{
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
    }>;
    certificates: Array<{
      id: string;
      certificateNumber: string;
      issuedAt: string;
      id06Verified: boolean;
    }>;
  }>;
  invitationLink?: string;
}