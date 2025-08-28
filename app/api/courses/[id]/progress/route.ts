import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function updateCourseProgress(userId: string, courseId: string) {
  try {
    // Get all questions in the course
    const questions = await prisma.question.findMany({
      where: {
        lesson: {
          courseId: courseId
        }
      }
    });

    // Get all user answers for this course
    const userAnswers = await prisma.answer.findMany({
      where: {
        userId: userId,
        question: {
          lesson: {
            courseId: courseId
          }
        }
      }
    });

    const totalQuestions = questions.length;
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Get course passing score
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { passingScore: true }
    });

    const passed = finalScore >= (course?.passingScore || 80);

    // Update enrollment with course progress
    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      },
      data: {
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        finalScore: finalScore,
        passed: passed,
        completedAt: passed ? new Date() : null
      }
    });

  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    const courseId = params.id;
    const userEmail = session.user.email;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Användare hittades inte' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: 'Du är inte registrerad för denna kurs' },
        { status: 403 }
      );
    }

    // Get course lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Kurs hittades inte' },
        { status: 404 }
      );
    }

    // Get user's progress for all lessons in this course
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId: user.id,
        lessonId: {
          in: course.lessons.map(lesson => lesson.id)
        }
      }
    });

    // Get user's answers for all questions in this course
    const userAnswers = await prisma.answer.findMany({
      where: {
        userId: user.id,
        question: {
          lesson: {
            courseId: courseId
          }
        }
      }
    });

    // Transform to match frontend expectations
    const progress = course.lessons.map(lesson => {
      const progressRecord = progressRecords.find(p => p.lessonId === lesson.id);
      return {
        lessonId: lesson.id,
        completed: progressRecord?.completed || false,
        completedAt: progressRecord?.completedAt || null
      };
    });

    // Add user answers to the response
    const answers = userAnswers.map(answer => ({
      questionId: answer.questionId,
      answer: answer.answer,
      isCorrect: answer.isCorrect
    }));

    return NextResponse.json({ progress, answers });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av framsteg' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    const courseId = params.id;
    const userEmail = session.user.email;
    const body = await request.json();
    const { lessonId, completed, score } = body;

    if (!lessonId) {
      return NextResponse.json(
        { message: 'Lektion ID krävs' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Användare hittades inte' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: 'Du är inte registrerad för denna kurs' },
        { status: 403 }
      );
    }

    // Verify lesson belongs to this course
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        courseId: courseId
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { message: 'Lektion hittades inte i denna kurs' },
        { status: 404 }
      );
    }

    // Upsert progress record
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        completed: completed,
        completedAt: completed ? new Date() : null,
        score: score || null,
        attempts: {
          increment: 1
        }
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        completed: completed,
        completedAt: completed ? new Date() : null,
        score: score || null,
        attempts: 1
      }
    });

    // If this is a question lesson and we have a score, update course-level progress
    if (lesson.type === 'question' && score !== undefined) {
      await updateCourseProgress(user.id, courseId);
    }

    return NextResponse.json({
      message: 'Framsteg sparades framgångsrikt',
      progress
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid sparande av framsteg' },
      { status: 500 }
    );
  }
}
