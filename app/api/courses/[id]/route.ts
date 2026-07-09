import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Always read fresh — a cached course detail caused stale "not found" after
// publishing/editing. Correctness over the tiny caching win here.
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: course } = await admin.from('courses').select('*').eq('id', params.id).single();
    if (!course) return NextResponse.json({ message: 'Kurs hittades inte' }, { status: 404 });

    // Public endpoint — reachable without auth. Return only a safe outline
    // (lesson titles/types/order) for the course preview. Do NOT include
    // lesson content, media URLs or question data (options/correct answers):
    // that is paid content and is served instead by the gated
    // GET /api/courses/[id]/learn to enrolled learners only.
    const [{ data: lessons }, { count: enrolledUsers }] = await Promise.all([
      admin.from('lessons').select('id, title, type, "order"').eq('course_id', params.id).order('order'),
      admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', params.id),
    ]);

    return NextResponse.json({
      id: course.id, title: course.title, description: course.description,
      price: course.price, duration: course.duration, category: course.category,
      image: course.image, isPublished: course.is_published, enrolledUsers: enrolledUsers ?? 0,
      lessons: (lessons ?? []).map(l => ({
        id: l.id, title: l.title, type: l.type, order: l.order,
      })),
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurs' },
      { status: 500 }
    );
  }
}
