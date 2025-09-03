import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get enrollment with course data
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            passingScore: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: 'Du är inte registrerad för denna kurs' },
        { status: 403 }
      );
    }

    // Get all questions and user answers to calculate completion
    const questions = await prisma.question.findMany({
      where: {
        lesson: {
          courseId: courseId
        }
      }
    });

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

    const totalQuestions = questions.length;
    const answeredQuestions = userAnswers.length;
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = finalScore >= enrollment.course.passingScore;

    console.log(`Course completion check for ${user.email}:`, {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      finalScore,
      passingScore: enrollment.course.passingScore,
      passed,
      allQuestionsAnswered: answeredQuestions === totalQuestions
    });

    // Check if all questions are answered (course is completed)
    const isCompleted = totalQuestions > 0 && answeredQuestions === totalQuestions;
    
    if (!isCompleted) {
      return NextResponse.json({
        completed: false,
        enrolled: true,
        debug: {
          totalQuestions,
          answeredQuestions,
          message: 'Not all questions answered'
        }
      });
    }

    // Update enrollment with final results if not already updated
    if (!enrollment.completedAt || enrollment.finalScore !== finalScore) {
      console.log('Updating enrollment with final results...');
      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId
          }
        },
        data: {
          totalQuestions,
          correctAnswers,
          finalScore,
          passed,
          completedAt: passed ? new Date() : null
        }
      });
    }

    // Get detailed questions with lesson info for the summary
    const detailedQuestions = await prisma.question.findMany({
      where: {
        lesson: {
          courseId: courseId
        }
      },
      include: {
        lesson: true
      },
      orderBy: [
        { lesson: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    // Create detailed answers data for the summary
    const answersData = detailedQuestions.map(question => {
      const userAnswer = userAnswers.find(a => a.questionId === question.id);
      const options = JSON.parse(question.options);
      const correctAnswerIndex = parseInt(question.correctAnswer);
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer?.answer || 'Ej besvarad',
        correctAnswer: question.correctAnswer,
        isCorrect: userAnswer?.isCorrect || false,
        options: options,
        selectedIndex: userAnswer ? parseInt(userAnswer.answer) : -1
      };
    });

    // Calculate time taken (rough estimate from enrollment to completion)
    const timeTaken = enrollment.completedAt && enrollment.enrolledAt
      ? Math.round((enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime()) / (1000 * 60))
      : null;

    return NextResponse.json({
      completed: true,
      enrolled: true,
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      finalScore: enrollment.finalScore || 0,
      passingScore: enrollment.course.passingScore,
      totalQuestions: enrollment.totalQuestions,
      correctAnswers: enrollment.correctAnswers,
      passed: enrollment.passed,
      timeTaken: timeTaken,
      answers: answersData,
      userEmail: user.email
    });

  } catch (error) {
    console.error('Error fetching course completion data:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kursdata' },
      { status: 500 }
    );
  }
}
