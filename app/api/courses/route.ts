import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      isPublished: true // Only show published courses
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      duration: course.duration,
      category: course.category,
      image: course.image,
      enrolledUsers: course._count.enrollments
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}
