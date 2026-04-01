import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;
    const user = authResult;

    const admin = createAdminClient();
    const { data: enrollments } = await admin.from('enrollments')
      .select('enrolled_at, course:courses(id, title, description)')
      .eq('user_id', user.id).order('enrolled_at', { ascending: false });

    const enrolledCourses = await Promise.all((enrollments ?? []).map(async (enrollment) => {
      const course = enrollment.course as unknown as { id: string; title: string; description: string };
      const { data: lessons } = await admin.from('lessons').select('id').eq('course_id', course.id);
      const lessonIds = (lessons ?? []).map(l => l.id);
      const { data: progressRecords } = lessonIds.length
        ? await admin.from('progress').select('completed, completed_at').eq('user_id', user.id).in('lesson_id', lessonIds)
        : { data: [] };

      const totalLessons = lessonIds.length;
      const completedLessons = (progressRecords ?? []).filter(p => p.completed).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const status: 'in-progress' | 'completed' | 'not-started' =
        completedLessons === 0 ? 'not-started' : completedLessons === totalLessons ? 'completed' : 'in-progress';
      const lastProgress = (progressRecords ?? [])
        .filter(p => p.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

      return {
        id: course.id, title: course.title, description: course.description,
        progress, totalLessons, completedLessons,
        enrolledAt: enrollment.enrolled_at,
        lastAccessed: lastProgress?.completed_at ?? enrollment.enrolled_at,
        status, courseId: course.id,
      };
    }));

    return NextResponse.json(enrolledCourses);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}
