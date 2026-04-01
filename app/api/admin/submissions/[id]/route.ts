import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;
    const user = adminResult;

    const submissionId = params.id;

    const admin = createAdminClient();
    const { data: submission } = await admin
      .from('apv_submissions')
      .select('*, user:users(email, name), course:courses(title)')
      .eq('id', submissionId).single();

    if (!submission) return NextResponse.json({ message: 'Inlämning hittades inte' }, { status: 404 });

    await admin.from('apv_submissions').delete().eq('id', submissionId);

    const u = submission.user as { email: string; name: string | null };
    const c = submission.course as { title: string };
    console.log(`ADMIN DELETION: ${user.email} deleted APV submission for ${u.email} - Course: ${c.title}`);

    return NextResponse.json({
      message: `Inlämning för ${u.name ?? u.email} har tagits bort`,
      deletedSubmission: { id: submissionId, userEmail: u.email, courseTitle: c.title },
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid borttagning av inlämning' },
      { status: 500 }
    );
  }
}
