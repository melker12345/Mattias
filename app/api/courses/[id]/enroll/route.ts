import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSecureEnrollment } from '@/lib/enrollment-validation';

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

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      },
      include: {
        giftedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (enrollment) {
      return NextResponse.json({
        enrolled: true,
        enrollment: {
          id: enrollment.id,
          isGift: enrollment.isGift,
          giftedBy: enrollment.giftedByUser,
          giftedAt: enrollment.giftedAt,
          giftReason: enrollment.giftReason,
          completedAt: enrollment.completedAt,
          passed: enrollment.passed,
          finalScore: enrollment.finalScore
        }
      });
    } else {
      return NextResponse.json({
        enrolled: false
      });
    }

  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid kontroll av registreringsstatus' },
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
        { message: 'Du måste vara inloggad för att registrera dig för kurser' },
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

    // Use secure enrollment creation
    const result = await createSecureEnrollment(user.id, courseId);

    if (!result.success) {
      // Determine appropriate status code based on error
      let statusCode = 400;
      if (result.message.includes('köpa kursen')) {
        statusCode = 402; // Payment required
      } else if (result.message.includes('hittades inte')) {
        statusCode = 404;
      }

      return NextResponse.json(
        { message: result.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      message: result.message,
      enrollment: result.enrollment
    });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering för kurs' },
      { status: 500 }
    );
  }
}
