import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Check if user is enrolled and has passed the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      },
      include: {
        course: true
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: 'Du är inte registrerad för denna kurs' },
        { status: 403 }
      );
    }

    if (!enrollment.passed) {
      return NextResponse.json(
        { message: 'Du måste klara kursen innan du kan skicka in den för granskning' },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.aPVSubmission.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (existingSubmission) {
      return NextResponse.json(
        { message: 'Du har redan skickat in denna kurs för granskning' },
        { status: 400 }
      );
    }

    // Get all questions and user answers for this course
    const questions = await prisma.question.findMany({
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

    const userAnswers = await prisma.answer.findMany({
      where: {
        userId: user.id,
        question: {
          lesson: {
            courseId: courseId
          }
        }
      },
      include: {
        question: true
      }
    });

    // Create detailed answers data
    const answersData = questions.map(question => {
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
        selectedIndex: userAnswer ? parseInt(userAnswer.answer) : -1,
        correctAnswerText: options[correctAnswerIndex],
        userAnswerText: userAnswer ? options[parseInt(userAnswer.answer)] : 'Ej besvarad'
      };
    });

    // Calculate time taken (rough estimate from enrollment to completion)
    const timeTaken = enrollment.completedAt && enrollment.enrolledAt
      ? Math.round((enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime()) / (1000 * 60))
      : null;

    // Create APV submission
    const submission = await prisma.aPVSubmission.create({
      data: {
        userId: user.id,
        courseId: courseId,
        fullName: user.name || user.email,
        personalNumber: user.personalNumber,
        courseTitle: enrollment.course.title,
        completionDate: enrollment.completedAt || new Date(),
        finalScore: enrollment.finalScore || 0,
        passingScore: enrollment.course.passingScore,
        totalQuestions: enrollment.totalQuestions,
        correctAnswers: enrollment.correctAnswers,
        timeTaken: timeTaken,
        answersData: JSON.stringify(answersData),
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      message: 'Kursen har skickats in för granskning',
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Error submitting course for review:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid inskickning för granskning' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user has already submitted
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

    // Check if already submitted
    const existingSubmission = await prisma.aPVSubmission.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    return NextResponse.json({
      hasSubmitted: !!existingSubmission,
      submission: existingSubmission
    });

  } catch (error) {
    console.error('Error checking submission status:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid kontroll av inlämningsstatus' },
      { status: 500 }
    );
  }
}
