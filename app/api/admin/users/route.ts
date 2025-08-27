import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: true,
        enrollments: {
          include: {
            course: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            certificates: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for admin view
    const usersWithStats = users.map(user => {
      const completedCourses = user.enrollments.filter(e => e.completedAt !== null);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company?.name || null,
        personalNumber: user.personalNumber,
        bankIdVerified: user.bankIdVerified,
        id06Eligible: user.id06Eligible,
        enrolledCourses: user._count.enrollments,
        completedCourses: completedCourses.length,
        certificates: user._count.certificates,
        lastActive: user.updatedAt,
        createdAt: user.createdAt
      };
    });

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av användare' },
      { status: 500 }
    );
  }
}
