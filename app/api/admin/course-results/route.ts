import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Lists every enrollment (all users who have started a course) with their
// progression and completion status. Replaces the old APV-submissions view.
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();

    // enrollments has two FKs to users (user_id + gifted_by), so the users
    // embed must name the FK explicitly or PostgREST refuses to embed.
    const { data: enrollments, error } = await admin.from('enrollments')
      .select(`
        id, enrolled_at, completed_at, passed, final_score, total_questions, correct_answers,
        user:users!enrollments_user_id_fkey(id, name, email, company:companies(name)),
        course:courses(id, title, category, passing_score)
      `)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    const rows = enrollments ?? [];

    // Progression = completed lessons / total lessons. Compute it from a fixed
    // number of queries rather than per-enrollment lookups.
    const courseIds = Array.from(new Set(rows.map((e) => (e.course as any)?.id).filter(Boolean)));
    const userIds = Array.from(new Set(rows.map((e) => (e.user as any)?.id).filter(Boolean)));

    const [{ data: lessons }, { data: progress }] = await Promise.all([
      courseIds.length
        ? admin.from('lessons').select('id, course_id').in('course_id', courseIds)
        : Promise.resolve({ data: [] as { id: string; course_id: string }[] }),
      userIds.length
        ? admin.from('progress').select('user_id, lesson_id, completed').in('user_id', userIds).eq('completed', true)
        : Promise.resolve({ data: [] as { user_id: string; lesson_id: string; completed: boolean }[] }),
    ]);

    const lessonCountByCourse = new Map<string, number>();
    const courseByLesson = new Map<string, string>();
    for (const l of lessons ?? []) {
      lessonCountByCourse.set(l.course_id, (lessonCountByCourse.get(l.course_id) ?? 0) + 1);
      courseByLesson.set(l.id, l.course_id);
    }

    // completed lessons per (user, course)
    const completedByUserCourse = new Map<string, number>();
    for (const p of progress ?? []) {
      const courseId = courseByLesson.get(p.lesson_id);
      if (!courseId) continue;
      const key = `${p.user_id}:${courseId}`;
      completedByUserCourse.set(key, (completedByUserCourse.get(key) ?? 0) + 1);
    }

    const results = rows.map((e) => {
      const user = e.user as unknown as { id: string; name: string | null; email: string; company: { name: string } | null } | null;
      const course = e.course as unknown as { id: string; title: string; category: string; passing_score: number } | null;
      const totalLessons = course ? (lessonCountByCourse.get(course.id) ?? 0) : 0;
      const completedLessons = user && course ? (completedByUserCourse.get(`${user.id}:${course.id}`) ?? 0) : 0;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const status: 'in_progress' | 'passed' | 'failed' = e.completed_at
        ? (e.passed ? 'passed' : 'failed')
        : 'in_progress';

      return {
        enrollmentId: e.id,
        user: {
          id: user?.id ?? '',
          name: user?.name ?? null,
          email: user?.email ?? '',
          company: user?.company?.name ?? null,
        },
        course: {
          id: course?.id ?? '',
          title: course?.title ?? '',
          category: course?.category ?? '',
          passingScore: course?.passing_score ?? 0,
        },
        status,
        progressPercentage,
        completedLessons,
        totalLessons,
        finalScore: e.final_score,
        correctAnswers: e.correct_answers,
        totalQuestions: e.total_questions,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching course results:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kursresultat' },
      { status: 500 }
    );
  }
}
