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

    // Get user's enrollments with course and progress data
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id
      },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Transform data to include progress information
    const enrolledCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.course;
        const totalLessons = course.lessons.length;
        
        // Get user's progress for this course
        const progressRecords = await prisma.progress.findMany({
          where: {
            userId: user.id,
            lessonId: {
              in: course.lessons.map(lesson => lesson.id)
            }
          }
        });

        const completedLessons = progressRecords.filter(p => p.completed).length;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Determine status
        let status: 'in-progress' | 'completed' | 'not-started';
        if (completedLessons === 0) {
          status = 'not-started';
        } else if (completedLessons === totalLessons) {
          status = 'completed';
        } else {
          status = 'in-progress';
        }

        // Get last accessed date (most recent progress update)
        const lastProgress = progressRecords
          .filter(p => p.completedAt)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          progress,
          totalLessons,
          completedLessons,
          enrolledAt: enrollment.enrolledAt,
          lastAccessed: lastProgress?.completedAt || enrollment.enrolledAt,
          status,
          courseId: course.id
        };
      })
    );

    return NextResponse.json(enrolledCourses);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}
