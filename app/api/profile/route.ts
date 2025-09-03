import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        company: true,
        enrollments: {
          include: {
            course: true,
          },
          orderBy: { enrolledAt: 'desc' },
        },
        certificates: {
          include: {
            course: true,
          },
          orderBy: { issuedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform the data to match the frontend interface
    const profile = {
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        role: 'Employee', // Default role for company employees
      } : undefined,
      enrollments: user.enrollments.map((enrollment: any) => ({
        id: enrollment.id,
        course: {
          id: enrollment.course.id,
          name: enrollment.course.title,
          description: enrollment.course.description,
        },
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString(),
        passed: enrollment.passed,
        finalScore: enrollment.finalScore,
        isGift: enrollment.isGift,
        giftedBy: enrollment.giftedBy,
        giftedAt: enrollment.giftedAt?.toISOString(),
        giftReason: enrollment.giftReason,
      })),
      certificates: user.certificates.map((certificate: any) => ({
        id: certificate.id,
        course: {
          name: certificate.course.title,
        },
        issuedAt: certificate.issuedAt.toISOString(),
      })),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        enrollments: true,
        certificates: true,
        answers: true,
        progress: true,
        apvSubmissions: true,
        company: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all related data first
    await prisma.$transaction([
      // Delete APV submissions
      prisma.aPVSubmission.deleteMany({
        where: { userId: user.id },
      }),
      
      // Delete answers
      prisma.answer.deleteMany({
        where: { userId: user.id },
      }),
      
      // Delete progress
      prisma.progress.deleteMany({
        where: { userId: user.id },
      }),
      
      // Delete certificates
      prisma.certificate.deleteMany({
        where: { userId: user.id },
      }),
      
      // Delete enrollments
      prisma.enrollment.deleteMany({
        where: { userId: user.id },
      }),
      
      // Delete the user
      prisma.user.delete({
        where: { id: user.id },
      }),
    ]);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
