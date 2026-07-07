import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const admin = createAdminClient();
    let query = admin.from('courses').select('id, title, description, price, duration, category, image').eq('is_published', true);
    if (category && category !== 'all') query = query.eq('category', category);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    const { data: courses } = await query.order('created_at', { ascending: false });

    const courseList = courses ?? [];
    const courseIds = courseList.map((course) => course.id);

    const enrollmentCounts = new Map<string, number>();
    if (courseIds.length > 0) {
      const { data: enrollmentRows } = await admin.from('enrollments').select('course_id').in('course_id', courseIds);
      for (const row of enrollmentRows ?? []) {
        enrollmentCounts.set(row.course_id, (enrollmentCounts.get(row.course_id) ?? 0) + 1);
      }
    }

    const transformedCourses = courseList.map((course) => ({
      ...course,
      enrolledUsers: enrollmentCounts.get(course.id) ?? 0,
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}
