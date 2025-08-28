import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
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
    const questionId = params.questionId;
    const userEmail = session.user.email;
    const body = await request.json();
    const { answer, isCorrect } = body;

    if (!answer) {
      return NextResponse.json(
        { message: 'Svar krävs' },
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

    // Verify question exists and belongs to this course
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        lesson: {
          courseId: courseId
        }
      }
    });

    if (!question) {
      return NextResponse.json(
        { message: 'Fråga hittades inte i denna kurs' },
        { status: 404 }
      );
    }

    // Upsert answer record
    const userAnswer = await prisma.answer.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: questionId
        }
      },
      update: {
        answer: answer,
        isCorrect: isCorrect
      },
      create: {
        userId: user.id,
        questionId: questionId,
        answer: answer,
        isCorrect: isCorrect
      }
    });

    return NextResponse.json({
      message: 'Svar sparades framgångsrikt',
      answer: userAnswer
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid sparande av svar' },
      { status: 500 }
    );
  }
}
