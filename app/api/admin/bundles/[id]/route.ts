import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const body = await request.json();
    const { title, description, price, image, courseIds, isPublished } = body;

    if (!title || price === undefined || price === null || !Array.isArray(courseIds) || courseIds.length < 2) {
      return NextResponse.json(
        { message: 'Ange titel, pris och minst två kurser' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('course_bundles')
      .update({
        title,
        description: description ?? '',
        price: parseFloat(price),
        image: image ?? null,
        is_published: Boolean(isPublished),
      })
      .eq('id', params.id);

    if (updateError) throw updateError;

    // Replace the course associations wholesale.
    const { error: delError } = await admin.from('bundle_courses').delete().eq('bundle_id', params.id);
    if (delError) throw delError;

    const rows = courseIds.map((courseId: string) => ({ bundle_id: params.id, course_id: courseId }));
    const { error: linkError } = await admin.from('bundle_courses').insert(rows);
    if (linkError) throw linkError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av paket' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();
    const { error } = await admin.from('course_bundles').delete().eq('id', params.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av paket' },
      { status: 500 }
    );
  }
}
