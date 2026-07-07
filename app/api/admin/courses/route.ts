import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();
    const { data: courses } = await admin.from('courses').select('*').order('created_at', { ascending: false });

    // Aggregate enrollment stats from a single query instead of 2 queries per course.
    const { data: enrollments } = await admin.from('enrollments').select('course_id, completed_at');
    const enrolledByCourse = new Map<string, number>();
    const completedByCourse = new Map<string, number>();
    for (const e of enrollments ?? []) {
      enrolledByCourse.set(e.course_id, (enrolledByCourse.get(e.course_id) ?? 0) + 1);
      if (e.completed_at) completedByCourse.set(e.course_id, (completedByCourse.get(e.course_id) ?? 0) + 1);
    }

    const coursesWithStats = (courses ?? []).map((course) => ({
      id: course.id, title: course.title, description: course.description,
      price: course.price, duration: course.duration, category: course.category,
      image: course.image, isPublished: course.is_published,
      enrolledUsers: enrolledByCourse.get(course.id) ?? 0,
      completedUsers: completedByCourse.get(course.id) ?? 0,
      status: course.is_published ? 'active' : 'draft',
      createdAt: course.created_at, updatedAt: course.updated_at,
    }));

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurser' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const body = await request.json();
    const { title, description, price, duration, category, image, passingScore } = body;

    // Validate required fields
    if (!title || !description || !price || !duration || !category) {
      return NextResponse.json(
        { message: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: course } = await admin.from('courses').insert({
      title, description, price: parseFloat(price), duration: parseInt(duration),
      category, image: image ?? null, passing_score: parseInt(passingScore) || 80, is_published: false,
    }).select().single();

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av kurs' },
      { status: 500 }
    );
  }
}
