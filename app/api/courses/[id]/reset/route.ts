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

    // Check if user is enrolled
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

    console.log(`Resetting course ${courseId} for user ${user.email}`);

    // Reset course progress in database
    await prisma.$transaction(async (tx) => {
      // Delete all user answers for this course
      await tx.answer.deleteMany({
        where: {
          userId: user.id,
          question: {
            lesson: {
              courseId: courseId
            }
          }
        }
      });

      // Delete all progress for this course
      await tx.progress.deleteMany({
        where: {
          userId: user.id,
          lesson: {
            courseId: courseId
          }
        }
      });

      // Reset enrollment data
      await tx.enrollment.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId
          }
        },
        data: {
          completedAt: null,
          passed: false,
          finalScore: null,
          totalQuestions: 0,
          correctAnswers: 0
        }
      });
    });

    console.log(`Course reset completed for user ${user.email}`);

    return NextResponse.json({
      message: 'Kursen har återställts framgångsrikt'
    });

  } catch (error) {
    console.error('Error resetting course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid återställning av kursen' },
      { status: 500 }
    );
  }
}
