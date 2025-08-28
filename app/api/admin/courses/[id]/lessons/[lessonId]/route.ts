import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { message: 'Lektion hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av lektion' },
      { status: 500 }
    );
  }
}

// PUT - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const body = await request.json();
    const { title, type, content, videoUrl, imageUrl, order } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { message: 'Titel och typ är obligatoriska fält' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        title,
        type,
        content: content || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        order: order || undefined
      }
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av lektion' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    await prisma.lesson.delete({
      where: { id: params.lessonId }
    });

    return NextResponse.json({ message: 'Lektion borttagen framgångsrikt' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av lektion' },
      { status: 500 }
    );
  }
}
