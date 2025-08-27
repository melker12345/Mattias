import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        lessons: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Kurs hittades inte' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      duration: course.duration,
      category: course.category,
      image: course.image,
      isPublished: course.isPublished,
      enrolledUsers: course._count.enrollments,
      lessons: course.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        order: lesson.order
      }))
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurs' },
      { status: 500 }
    );
  }
}
