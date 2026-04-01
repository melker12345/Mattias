import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { data: courses } = await admin.from('courses').select('*').order('created_at', { ascending: false });

    const coursesWithStats = await Promise.all((courses ?? []).map(async (course) => {
      const [{ count: enrolledUsers }, { data: completed }] = await Promise.all([
        admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
        admin.from('enrollments').select('id').eq('course_id', course.id).not('completed_at', 'is', null),
      ]);
      return {
        id: course.id, title: course.title, description: course.description,
        price: course.price, duration: course.duration, category: course.category,
        image: course.image, isPublished: course.is_published,
        enrolledUsers: enrolledUsers ?? 0, completedUsers: completed?.length ?? 0,
        status: course.is_published ? 'active' : 'draft',
        createdAt: course.created_at, updatedAt: course.updated_at,
      };
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
