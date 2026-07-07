export interface Employee {
  id: string;
  name: string;
  email: string;
  personalNumber: string;
  bankIdVerified: boolean;
  id06Eligible: boolean;
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  lastActivity: string;
}

export interface EmployeeDetails {
  id: string;
  name: string;
  email: string;
  personalNumber: string;
  bankIdVerified: boolean;
  bankIdVerifiedAt: string | null;
  id06Eligible: boolean;
  createdAt: string;
  updatedAt: string;
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    completedAt: string | null;
    course: {
      id: string;
      title: string;
      description: string;
      duration: number;
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
    certificates: Array<{
      id: string;
      certificateNumber: string;
      issuedAt: string;
      id06Verified: boolean;
    }>;
  }>;
  invitationLink?: string;
}