import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

// Gated content endpoint for the course player. Unlike the public
// GET /api/courses/[id] (which returns only safe metadata), this returns the
// full lesson content + the learner's progress and answers in a SINGLE
// round-trip. It is only reachable by an enrolled learner (or an admin
// previewing), so paid content and question data never leak to logged-out or
// non-enrolled visitors.
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: 'Du måste vara inloggad' }, { status: 401 });
    }

    const courseId = params.id;
    const admin = createAdminClient();

    // Course + this user's enrollment, in parallel.
    const [{ data: course }, { data: enrollment }] = await Promise.all([
      admin.from('courses').select('id, title, description, passing_score').eq('id', courseId).single(),
      admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    ]);

    if (!course) {
      return NextResponse.json({ message: 'Kurs hittades inte' }, { status: 404 });
    }

    const isAdmin = user.role === 'ADMIN';
    if (!enrollment && !isAdmin) {
      // Not enrolled and not an admin: deny access to the paid content.
      return NextResponse.json(
        { message: 'Du är inte registrerad för denna kurs' },
        { status: 403 }
      );
    }

    const { data: lessons } = await admin
      .from('lessons')
      .select('*, questions(*)')
      .eq('course_id', courseId)
      .order('order');

    const lessonIds = (lessons ?? []).map((l) => l.id);
    const questionIds = (lessons ?? []).flatMap((l) => (l.questions ?? []).map((q: { id: string }) => q.id));

    // Progress + answers only exist for an actual enrollment; an admin
    // previewing without an enrollment simply sees an empty state.
    const [{ data: progressRecords }, { data: userAnswers }] = enrollment
      ? await Promise.all([
          admin.from('progress').select('lesson_id, completed, completed_at').eq('user_id', user.id).in('lesson_id', lessonIds.length ? lessonIds : ['']),
          questionIds.length
            ? admin.from('answers').select('question_id, answer, is_correct').eq('user_id', user.id).in('question_id', questionIds)
            : Promise.resolve({ data: [] as { question_id: string; answer: string; is_correct: boolean }[] }),
        ])
      : [{ data: [] }, { data: [] }];

    const progress = (lessons ?? []).map((lesson) => {
      const rec = (progressRecords ?? []).find((p) => p.lesson_id === lesson.id);
      return { lessonId: lesson.id, completed: rec?.completed ?? false, completedAt: rec?.completed_at ?? null };
    });

    const answers = (userAnswers ?? []).map((a) => ({
      questionId: a.question_id,
      answer: a.answer,
      isCorrect: a.is_correct,
    }));

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        passingScore: course.passing_score,
        lessons: (lessons ?? []).map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          videoUrl: l.video_url,
          imageUrl: l.image_url,
          type: l.type,
          order: l.order,
          questions: l.questions,
        })),
      },
      enrolled: !!enrollment,
      isAdminPreview: !enrollment && isAdmin,
      progress,
      answers,
    });
  } catch (error) {
    console.error('Error fetching course learn data:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurs' },
      { status: 500 }
    );
  }
}
