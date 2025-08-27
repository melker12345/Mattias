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
      }
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Kurs hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurs' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, price, duration, category, image, isPublished } = body;

    // Validate required fields
    if (!title || !description || !price || !duration || !category) {
      return NextResponse.json(
        { message: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        title,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        image: image || null,
        isPublished: isPublished || false
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av kurs' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if course has enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: params.id }
    });

    if (enrollments.length > 0) {
      return NextResponse.json(
        { message: 'Kan inte ta bort kurs som har registrerade användare' },
        { status: 400 }
      );
    }

    await prisma.course.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Kurs borttagen framgångsrikt' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av kurs' },
      { status: 500 }
    );
  }
}
