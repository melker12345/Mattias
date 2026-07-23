import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyAccess, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCompanyInviteToken } from '@/lib/company-invite-token';

export const dynamic = 'force-dynamic';

// Returns a shareable "join this company" link for the company admin to send by
// text/email. The token is stateless (signed), so no per-share record is
// stored. Anyone who opens it is guided to create an account (auto-joined) or,
// if already signed in / has an account, to join the company.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;
    const access = await requireCompanyAccess(companyId);
    if (isNextResponse(access)) return access;

    const admin = createAdminClient();
    const { data: company } = await admin.from('companies').select('id, name').eq('id', companyId).maybeSingle();
    if (!company) return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 });

    const token = createCompanyInviteToken(companyId);
    const origin = new URL(request.url).origin;
    const url = `${origin}/join/${token}`;

    return NextResponse.json({ url, token, companyName: company.name });
  } catch (error) {
    console.error('Error creating company invite link:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av inbjudningslänk' },
      { status: 500 }
    );
  }
}
