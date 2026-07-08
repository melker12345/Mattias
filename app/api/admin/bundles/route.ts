import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Shape a raw course_bundles row (with nested bundle_courses -> courses) into
// the AdminBundle shape the client expects.
function serializeBundle(row: any) {
  const courses = (row.bundle_courses ?? [])
    .map((bc: any) => bc.courses)
    .filter(Boolean)
    .map((c: any) => ({ id: c.id, title: c.title, price: c.price }));
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    price: row.price,
    image: row.image ?? undefined,
    isPublished: row.is_published,
    courses,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('course_bundles')
      .select('*, bundle_courses(course_id, courses(id, title, price))')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json((data ?? []).map(serializeBundle));
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av paket' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { data: bundle, error: insertError } = await admin
      .from('course_bundles')
      .insert({
        title,
        description: description ?? '',
        price: parseFloat(price),
        image: image ?? null,
        is_published: Boolean(isPublished),
      })
      .select()
      .single();

    if (insertError || !bundle) throw insertError ?? new Error('Insert failed');

    const rows = courseIds.map((courseId: string) => ({ bundle_id: bundle.id, course_id: courseId }));
    const { error: linkError } = await admin.from('bundle_courses').insert(rows);
    if (linkError) throw linkError;

    return NextResponse.json({ id: bundle.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av paket' },
      { status: 500 }
    );
  }
}
