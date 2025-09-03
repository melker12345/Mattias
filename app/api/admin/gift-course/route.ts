import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSecureEnrollment } from '@/lib/enrollment-validation';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Endast administratörer kan ge bort kurser' },
        { status: 403 }
      );
    }

    const { userEmail, courseId, reason } = await request.json();

    if (!userEmail || !courseId) {
      return NextResponse.json(
        { message: 'Användarens e-post och kurs-ID krävs' },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'Användare med den e-postadressen hittades inte' },
        { status: 404 }
      );
    }

    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Kurs hittades inte' },
        { status: 404 }
      );
    }

    // Create secure enrollment as gift
    const result = await createSecureEnrollment(targetUser.id, courseId, {
      isGift: true,
      giftedBy: admin.id,
      giftReason: reason || `Administratörsgåva från ${admin.name || admin.email}`
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    // Log the gift action
    console.log(`ADMIN GIFT: ${admin.email} gifted course "${course.title}" to ${targetUser.email}. Reason: ${reason || 'No reason provided'}`);

    return NextResponse.json({
      message: `Kursen "${course.title}" har getts som gåva till ${targetUser.email}`,
      enrollment: result.enrollment
    });

  } catch (error) {
    console.error('Error gifting course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid gåvogivning av kurs' },
      { status: 500 }
    );
  }
}

// Get all gifted courses for admin overview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    // Verify admin access
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Endast administratörer kan se gåvoöversikt' },
        { status: 403 }
      );
    }

    // Get all gifted enrollments
    const giftedEnrollments = await prisma.enrollment.findMany({
      where: {
        isGift: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true
          }
        },
        giftedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        giftedAt: 'desc'
      }
    });

    return NextResponse.json({
      gifts: giftedEnrollments.map(enrollment => ({
        id: enrollment.id,
        user: enrollment.user,
        course: enrollment.course,
        giftedBy: enrollment.giftedByUser,
        giftedAt: enrollment.giftedAt,
        giftReason: enrollment.giftReason,
        completed: !!enrollment.completedAt,
        passed: enrollment.passed
      }))
    });

  } catch (error) {
    console.error('Error fetching gifted courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av gåvoöversikt' },
      { status: 500 }
    );
  }
}
