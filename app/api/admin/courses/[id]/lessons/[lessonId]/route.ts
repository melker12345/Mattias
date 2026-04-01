import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Fetch a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: lesson } = await admin.from('lessons').select('*, questions(*)').eq('id', params.lessonId).single();
    if (!lesson) return NextResponse.json({ message: 'Lektion hittades inte' }, { status: 404 });
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av lektion' },
      { status: 500 }
    );
  }
}

// PUT - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const body = await request.json();
    const { title, type, content, videoUrl, imageUrl, order } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { message: 'Titel och typ är obligatoriska fält' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: lesson } = await admin.from('lessons').update({
      title, type, content: content ?? null, video_url: videoUrl ?? null,
      image_url: imageUrl ?? null, ...(order !== undefined ? { order } : {}),
    }).eq('id', params.lessonId).select().single();
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av lektion' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const admin = createAdminClient();
    await admin.from('lessons').delete().eq('id', params.lessonId);
    return NextResponse.json({ message: 'Lektion borttagen framgångsrikt' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av lektion' },
      { status: 500 }
    );
  }
}
