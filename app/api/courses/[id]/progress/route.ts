import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

async function updateCourseProgress(userId: string, courseId: string) {
  try {
    const admin = createAdminClient();
    // Get all lesson IDs for this course
    const { data: lessons } = await admin.from('lessons').select('id').eq('course_id', courseId);
    const lessonIds = (lessons ?? []).map(l => l.id);

    const [{ data: questions }, { data: userAnswers }, { data: course }] = await Promise.all([
      admin.from('questions').select('id').in('lesson_id', lessonIds),
      admin.from('answers').select('is_correct').eq('user_id', userId).in('question_id',
        lessonIds.length ? (await admin.from('questions').select('id').in('lesson_id', lessonIds)).data?.map(q => q.id) ?? [] : []
      ),
      admin.from('courses').select('passing_score').eq('id', courseId).single(),
    ]);

    const totalQuestions = (questions ?? []).length;
    const correctAnswers = (userAnswers ?? []).filter(a => a.is_correct).length;
    const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = finalScore >= ((course?.passing_score as number) || 80);

    await admin.from('enrollments')
      .update({ total_questions: totalQuestions, correct_answers: correctAnswers, final_score: finalScore, passed, completed_at: passed ? new Date().toISOString() : null })
      .eq('user_id', userId).eq('course_id', courseId);
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const user = authResult;

    const admin = createAdminClient();
    const { data: enrollment } = await admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });

    const { data: lessons } = await admin.from('lessons').select('id, title, type, order').eq('course_id', courseId).order('order');
    if (!lessons) return NextResponse.json({ message: 'Kurs hittades inte' }, { status: 404 });

    const lessonIds = lessons.map(l => l.id);
    const questionIds = lessonIds.length
      ? (await admin.from('questions').select('id').in('lesson_id', lessonIds)).data?.map(q => q.id) ?? []
      : [];

    const [{ data: progressRecords }, { data: userAnswers }] = await Promise.all([
      admin.from('progress').select('lesson_id, completed, completed_at').eq('user_id', user.id).in('lesson_id', lessonIds),
      questionIds.length
        ? admin.from('answers').select('question_id, answer, is_correct').eq('user_id', user.id).in('question_id', questionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const progress = lessons.map(lesson => {
      const rec = (progressRecords ?? []).find(p => p.lesson_id === lesson.id);
      return { lessonId: lesson.id, completed: rec?.completed ?? false, completedAt: rec?.completed_at ?? null };
    });
    const answers = (userAnswers ?? []).map(a => ({ questionId: a.question_id, answer: a.answer, isCorrect: a.is_correct }));

    return NextResponse.json({ progress, answers });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av framsteg' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const user = authResult;
    const body = await request.json();
    const { lessonId, completed, score } = body;

    if (!lessonId) {
      return NextResponse.json(
        { message: 'Lektion ID krävs' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: enrollment } = await admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });

    const { data: lesson } = await admin.from('lessons').select('id, type').eq('id', lessonId).eq('course_id', courseId).maybeSingle();
    if (!lesson) return NextResponse.json({ message: 'Lektion hittades inte i denna kurs' }, { status: 404 });

    const { data: existing } = await admin.from('progress').select('attempts').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle();
    const { data: progress } = await admin.from('progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      score: score ?? null,
      attempts: (existing?.attempts ?? 0) + 1,
    }, { onConflict: 'user_id,lesson_id' }).select().single();

    if (lesson.type === 'question' && score !== undefined) {
      await updateCourseProgress(user.id, courseId);
    }

    return NextResponse.json({ message: 'Framsteg sparades framgångsrikt', progress });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid sparande av framsteg' },
      { status: 500 }
    );
  }
}
