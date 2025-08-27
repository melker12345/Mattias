import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            user: true
          }
        },
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

    // Transform data to include enrollment statistics
    const coursesWithStats = courses.map(course => {
      const completedEnrollments = course.enrollments.filter(e => e.completedAt !== null);
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        duration: course.duration,
        category: course.category,
        image: course.image,
        isPublished: course.isPublished,
        enrolledUsers: course._count.enrollments,
        completedUsers: completedEnrollments.length,
        status: course.isPublished ? 'active' : 'draft',
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      };
    });

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, price, duration, category, image } = body;

    // Validate required fields
    if (!title || !description || !price || !duration || !category) {
      return NextResponse.json(
        { message: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        image: image || null,
        isPublished: false // Default to draft
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av kurs' },
      { status: 500 }
    );
  }
}
