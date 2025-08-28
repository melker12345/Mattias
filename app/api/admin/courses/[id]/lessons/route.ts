import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { courseId: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av lektioner' },
      { status: 500 }
    );
  }
}

// POST - Create a new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, type, content, videoUrl, imageUrl, questionOptions, correctAnswer } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { message: 'Titel och typ är obligatoriska fält' },
        { status: 400 }
      );
    }

    // Get the next order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId: params.id },
      orderBy: { order: 'desc' }
    });
    const nextOrder = (lastLesson?.order || 0) + 1;

    // Create lesson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        type,
        content: content || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        order: nextOrder,
        courseId: params.id
      }
    });

    // If this is a question lesson, create the question
    if (type === 'question' && questionOptions && correctAnswer !== null) {
      // Validate question data
      if (!content) {
        return NextResponse.json(
          { message: 'Frågetext är obligatorisk' },
          { status: 400 }
        );
      }

      if (!questionOptions.every((option: string) => option.trim())) {
        return NextResponse.json(
          { message: 'Alla svarsalternativ måste fyllas i' },
          { status: 400 }
        );
      }

      // Create the question
      await prisma.question.create({
        data: {
          lessonId: lesson.id,
          question: content, // Use content as question text
          type: 'multiple_choice',
          options: JSON.stringify(questionOptions),
          correctAnswer: JSON.stringify(Number(correctAnswer)), // Ensure it's stored as a number
          order: 1
        }
      });
    }

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av lektion', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
