import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Du har inte behörighet att se denna information' },
        { status: 403 }
      );
    }

    // Get all APV submissions
    const submissions = await prisma.aPVSubmission.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            personalNumber: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      user: {
        id: submission.user.id,
        email: submission.user.email,
        name: submission.user.name,
        personalNumber: submission.user.personalNumber
      },
      course: {
        id: submission.course.id,
        title: submission.course.title,
        category: submission.course.category
      },
      courseTitle: submission.courseTitle,
      completionDate: submission.completionDate,
      finalScore: submission.finalScore,
      passingScore: submission.passingScore,
      totalQuestions: submission.totalQuestions,
      correctAnswers: submission.correctAnswers,
      timeTaken: submission.timeTaken,
      status: submission.status,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      reviewedBy: submission.reviewedBy,
      reviewNotes: submission.reviewNotes,
      answersData: JSON.parse(submission.answersData)
    }));

    return NextResponse.json(transformedSubmissions);

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av inlämningar' },
      { status: 500 }
    );
  }
}

// POST endpoint to update submission status (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Du har inte behörighet att utföra denna åtgärd' },
        { status: 403 }
      );
    }

    const { submissionId, status, reviewNotes } = await request.json();

    if (!submissionId || !status) {
      return NextResponse.json(
        { message: 'Submission ID och status krävs' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: 'Ogiltig status. Måste vara APPROVED eller REJECTED' },
        { status: 400 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.aPVSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
        reviewedBy: user.email
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
            title: true
          }
        }
      }
    });

    return NextResponse.json({
      message: `Inlämning ${status === 'APPROVED' ? 'godkänd' : 'avvisad'}`,
      submission: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av inlämningsstatus' },
      { status: 500 }
    );
  }
}
