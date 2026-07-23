import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;
    const user = authResult;

    const admin = createAdminClient();
    const { data: enrollments } = await admin.from('enrollments')
      .select('enrolled_at, completed_at, passed, course:courses(id, title, description)')
      .eq('user_id', user.id).order('enrolled_at', { ascending: false });

    const enrollmentList = enrollments ?? [];
    const courseIds = enrollmentList.map((enrollment) => {
      const course = enrollment.course as unknown as { id: string; title: string; description: string };
      return course.id;
    });

    // Batch: fetch all lessons for the enrolled courses and all of this user's progress in one query each.
    // We track lesson type so the 'test_intro' divider (a gateway screen, never
    // "completed") is excluded from progress totals.
    const { data: allLessons } = courseIds.length
      ? await admin.from('lessons').select('id, course_id, type').in('course_id', courseIds)
      : { data: [] };

    const lessonIdsByCourse = new Map<string, string[]>();
    const courseIdByLesson = new Map<string, string>();
    const courseHasTest = new Map<string, boolean>();
    for (const lesson of allLessons ?? []) {
      if (lesson.type === 'test_intro') {
        courseHasTest.set(lesson.course_id, true);
        continue; // the divider is not a countable lesson
      }
      courseIdByLesson.set(lesson.id, lesson.course_id);
      const list = lessonIdsByCourse.get(lesson.course_id);
      if (list) list.push(lesson.id);
      else lessonIdsByCourse.set(lesson.course_id, [lesson.id]);
    }

    const allLessonIds = (allLessons ?? []).map(l => l.id);
    const { data: allProgress } = allLessonIds.length
      ? await admin.from('progress').select('lesson_id, completed, completed_at').eq('user_id', user.id).in('lesson_id', allLessonIds)
      : { data: [] };

    const progressByCourse = new Map<string, { completed: boolean | null; completed_at: string | null }[]>();
    for (const record of allProgress ?? []) {
      const courseId = courseIdByLesson.get(record.lesson_id);
      if (!courseId) continue;
      const list = progressByCourse.get(courseId);
      const entry = { completed: record.completed, completed_at: record.completed_at };
      if (list) list.push(entry);
      else progressByCourse.set(courseId, [entry]);
    }

    const enrolledCourses = enrollmentList.map((enrollment) => {
      const course = enrollment.course as unknown as { id: string; title: string; description: string };
      const lessonIds = lessonIdsByCourse.get(course.id) ?? [];
      const progressRecords = progressByCourse.get(course.id) ?? [];
      const hasTest = courseHasTest.get(course.id) ?? false;

      const totalLessons = lessonIds.length;
      const completedLessons = progressRecords.filter(p => p.completed).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      // A course with a graded test is "completed" only when the test is passed.
      // Without a test we keep the legacy rule: all lessons completed = done.
      const status: 'in-progress' | 'completed' | 'not-started' = hasTest
        ? (enrollment.passed ? 'completed' : completedLessons === 0 ? 'not-started' : 'in-progress')
        : (completedLessons === 0 ? 'not-started' : completedLessons === totalLessons ? 'completed' : 'in-progress');
      const lastProgress = progressRecords
        .filter(p => p.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

      return {
        id: course.id, title: course.title, description: course.description,
        progress, totalLessons, completedLessons,
        enrolledAt: enrollment.enrolled_at,
        lastAccessed: lastProgress?.completed_at ?? enrollment.enrolled_at,
        status, courseId: course.id,
      };
    });

    return NextResponse.json(enrolledCourses);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}
