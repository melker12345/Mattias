import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Fetch all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: lessons } = await admin.from('lessons').select('*, questions(*).order(order)').eq('course_id', params.id).order('order');
    return NextResponse.json(lessons ?? []);
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

    const admin = createAdminClient();
    const { data: lastLesson } = await admin.from('lessons').select('order').eq('course_id', params.id).order('order', { ascending: false }).limit(1).maybeSingle();
    const nextOrder = (lastLesson?.order ?? 0) + 1;

    const { data: lesson } = await admin.from('lessons').insert({
      title, type, content: content ?? null, video_url: videoUrl ?? null,
      image_url: imageUrl ?? null, order: nextOrder, course_id: params.id,
    }).select().single();

    if (type === 'question' && questionOptions && correctAnswer !== null) {
      if (!content) return NextResponse.json({ message: 'Frågetext är obligatorisk' }, { status: 400 });
      if (!questionOptions.every((opt: string) => opt.trim())) {
        return NextResponse.json({ message: 'Alla svarsalternativ måste fyllas i' }, { status: 400 });
      }
      await admin.from('questions').insert({
        lesson_id: lesson!.id, question: content, type: 'multiple_choice',
        options: JSON.stringify(questionOptions),
        correct_answer: JSON.stringify(Number(correctAnswer)), order: 1,
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
