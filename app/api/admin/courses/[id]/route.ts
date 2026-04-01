import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const [{ data: course }, { data: lessons }, { data: enrollments }] = await Promise.all([
      admin.from('courses').select('*').eq('id', params.id).single(),
      admin.from('lessons').select('*').eq('course_id', params.id).order('order'),
      admin.from('enrollments').select('*, user:users(id, name, email)').eq('course_id', params.id),
    ]);
    if (!course) return NextResponse.json({ message: 'Kurs hittades inte' }, { status: 404 });
    return NextResponse.json({ ...course, lessons: lessons ?? [], enrollments: enrollments ?? [] });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kurs' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, price, duration, category, image, isPublished } = body;

    // Validate required fields
    if (!title || !description || !price || !duration || !category) {
      return NextResponse.json(
        { message: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: course } = await admin.from('courses').update({
      title, description, price: parseFloat(price), duration: parseInt(duration),
      category, image: image ?? null, is_published: isPublished ?? false,
    }).eq('id', params.id).select().single();
    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av kurs' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient();
    const { count } = await admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', params.id);
    if (count && count > 0) return NextResponse.json({ message: 'Kan inte ta bort kurs som har registrerade användare' }, { status: 400 });
    await admin.from('courses').delete().eq('id', params.id);
    return NextResponse.json({ message: 'Kurs borttagen framgångsrikt' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av kurs' },
      { status: 500 }
    );
  }
}
