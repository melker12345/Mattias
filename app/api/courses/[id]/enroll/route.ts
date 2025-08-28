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

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (enrollment) {
      return NextResponse.json({
        enrolled: true,
        enrollment
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

    // Get user and course
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { email: userEmail }
      }),
      prisma.course.findUnique({
        where: { id: courseId }
      })
    ]);

    if (!user) {
      return NextResponse.json(
        { message: 'Användare hittades inte' },
        { status: 404 }
      );
    }

    if (!course) {
      return NextResponse.json(
        { message: 'Kurs hittades inte' },
        { status: 404 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: 'Du är redan registrerad för denna kurs' },
        { status: 400 }
      );
    }

    // Check if user is admin - admins can enroll without payment
    if (user.role === 'ADMIN') {
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: courseId,
          // No coursePurchaseId for admin enrollments
        }
      });

      return NextResponse.json({
        message: 'Du har registrerats för kursen framgångsrikt',
        enrollment
      });
    }

    // For non-admin users, check if they have a valid course purchase
    // This is a simplified check - in a real implementation, you'd verify payment status
    const coursePurchase = await prisma.coursePurchase.findFirst({
      where: {
        courseId: courseId,
        companyId: user.companyId || undefined
      },
      orderBy: {
        purchasedAt: 'desc'
      }
    });

    if (!coursePurchase && course.price > 0) {
      return NextResponse.json(
        { message: 'Du måste köpa kursen först för att registrera dig' },
        { status: 402 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        coursePurchaseId: coursePurchase?.id || null
      }
    });

    return NextResponse.json({
      message: 'Du har registrerats för kursen framgångsrikt',
      enrollment
    });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering för kurs' },
      { status: 500 }
    );
  }
}
