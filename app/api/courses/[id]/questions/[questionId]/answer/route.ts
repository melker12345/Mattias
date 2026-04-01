import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const questionId = params.questionId;
    const user = authResult;
    const body = await request.json();
    const { answer, isCorrect } = body;

    if (!answer) {
      return NextResponse.json(
        { message: 'Svar krävs' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: enrollment } = await admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });

    // Verify question belongs to this course via its lesson
    const { data: question } = await admin
      .from('questions').select('id')
      .eq('id', questionId)
      .in('lesson_id', (await admin.from('lessons').select('id').eq('course_id', courseId)).data?.map(l => l.id) ?? [])
      .maybeSingle();
    if (!question) return NextResponse.json({ message: 'Fråga hittades inte i denna kurs' }, { status: 404 });

    const { data: userAnswer } = await admin.from('answers').upsert(
      { user_id: user.id, question_id: questionId, answer, is_correct: isCorrect },
      { onConflict: 'user_id,question_id' }
    ).select().single();

    return NextResponse.json({ message: 'Svar sparades framgångsrikt', answer: userAnswer });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid sparande av svar' },
      { status: 500 }
    );
  }
}
