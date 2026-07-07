export interface LearnQuestion {
  id: string;
  question: string;
  type: string;
  options: string | unknown;
  correctAnswer?: string;
  correct_answer?: string;
  order: number;
}

export interface LearnLesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  type: string;
  order: number;
  questions?: LearnQuestion[];
}

export interface LearnCourse {
  id: string;
  title: string;
  description: string;
  lessons: LearnLesson[];
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export interface UserAnswer {
  questionId: string;
  answer: string;
  selectedIndex?: number;
  isCorrect: boolean;
}

export interface CompletionAnswer {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: string[];
  selectedIndex: number;
}

export interface CompletionData {
  courseId: string;
  courseTitle: string;
  finalScore: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  timeTaken?: number;
  answers: CompletionAnswer[];
  userEmail: string;
  completed: boolean;
}