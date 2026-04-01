import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const transformedCourses = await Promise.all((courses ?? []).map(async (course) => {
      const { count } = await admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
      return { ...course, enrolledUsers: count ?? 0 };
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
