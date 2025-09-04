import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Du har inte behörighet att ta bort inlämningar' },
        { status: 403 }
      );
    }

    const submissionId = params.id;

    // Get the submission before deleting (for logging)
    const submission = await prisma.aPVSubmission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { message: 'Inlämning hittades inte' },
        { status: 404 }
      );
    }

    // Delete the submission
    await prisma.aPVSubmission.delete({
      where: { id: submissionId }
    });

    // Log the deletion
    console.log(`ADMIN DELETION: ${user.email} deleted APV submission for ${submission.user.email} - Course: ${submission.course.title}`);

    return NextResponse.json({
      message: `Inlämning för ${submission.user.name || submission.user.email} har tagits bort`,
      deletedSubmission: {
        id: submissionId,
        userEmail: submission.user.email,
        courseTitle: submission.course.title
      }
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av inlämning' },
      { status: 500 }
    );
  }
}
