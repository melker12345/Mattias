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
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    const courseId = params.id;
    const body = await request.json();
    const {
      fullName,
      personalNumber,
      address,
      postalCode,
      city,
      phone,
      finalScore,
      passingScore
    } = body;

    // Validate required fields
    if (!fullName || !personalNumber || !address || !postalCode || !city) {
      return NextResponse.json(
        { message: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    // Get user and course
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        enrollments: {
          where: { courseId },
          include: { course: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Användare hittades inte' },
        { status: 404 }
      );
    }

    const enrollment = user.enrollments[0];
    if (!enrollment) {
      return NextResponse.json(
        { message: 'Du är inte registrerad för denna kurs' },
        { status: 400 }
      );
    }

    if (!enrollment.passed) {
      return NextResponse.json(
        { message: 'Du måste ha godkänt kursen för att kunna skicka APV submission' },
        { status: 400 }
      );
    }

    // Check if APV submission already exists
    const existingSubmission = await prisma.aPVSubmission.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId
        }
      }
    });

    if (existingSubmission) {
      return NextResponse.json(
        { message: 'APV submission har redan skickats för denna kurs' },
        { status: 400 }
      );
    }

    // Create or get certificate
    let certificate = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId
        }
      }
    });

    if (!certificate) {
      // Generate certificate number
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      certificate = await prisma.certificate.create({
        data: {
          userId: user.id,
          courseId,
          certificateNumber
        }
      });
    }

    // Create APV submission
    const apvSubmission = await prisma.aPVSubmission.create({
      data: {
        userId: user.id,
        courseId,
        certificateId: certificate.id,
        fullName,
        personalNumber,
        address,
        postalCode,
        city,
        phone: phone || null,
        courseTitle: enrollment.course.title,
        completionDate: enrollment.completedAt || new Date(),
        finalScore,
        passingScore,
        status: 'PENDING'
      }
    });

    // Update certificate with APV submission reference
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        apvSubmitted: true,
        apvSubmittedAt: new Date(),
        apvSubmissionId: apvSubmission.id
      }
    });

    return NextResponse.json({
      message: 'APV submission skickades framgångsrikt',
      submission: apvSubmission
    });

  } catch (error) {
    console.error('Error creating APV submission:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av APV submission' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    const courseId = params.id;
    const userId = (session.user as any).id;

    // Get APV submission for this user and course
    const submission = await prisma.aPVSubmission.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        course: true,
        certificate: true
      }
    });

    if (!submission) {
      return NextResponse.json(
        { message: 'Ingen APV submission hittades' },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);

  } catch (error) {
    console.error('Error fetching APV submission:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av APV submission' },
      { status: 500 }
    );
  }
}
