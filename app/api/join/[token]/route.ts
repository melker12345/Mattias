import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCompanyInviteToken } from '@/lib/company-invite-token';

export const dynamic = 'force-dynamic';

// GET — public: validate the token and return the company name so the join page
// can render "You've been invited to <Company>". No auth required.
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const verified = verifyCompanyInviteToken(params.token);
  if (!verified) {
    return NextResponse.json({ valid: false, message: 'Inbjudningslänken är ogiltig eller har gått ut' }, { status: 200 });
  }

  const admin = createAdminClient();
  const { data: company } = await admin.from('companies').select('id, name').eq('id', verified.companyId).maybeSingle();
  if (!company) {
    return NextResponse.json({ valid: false, message: 'Företaget finns inte längre' }, { status: 200 });
  }

  const user = await getAuthUser();

  return NextResponse.json({
    valid: true,
    companyId: company.id,
    companyName: company.name,
    // Tells the page whether to show a "join" prompt or an "create account / sign in" prompt.
    signedIn: !!user,
    alreadyMember: !!user && user.companyId === company.id,
  });
}

// POST — authenticated: attach the current user to the company as an EMPLOYEE.
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const verified = verifyCompanyInviteToken(params.token);
  if (!verified) {
    return NextResponse.json({ message: 'Inbjudningslänken är ogiltig eller har gått ut' }, { status: 400 });
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: 'Du måste vara inloggad för att gå med' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: company } = await admin.from('companies').select('id, name').eq('id', verified.companyId).maybeSingle();
  if (!company) {
    return NextResponse.json({ message: 'Företaget finns inte längre' }, { status: 404 });
  }

  if (user.companyId === company.id) {
    return NextResponse.json({ message: 'Du är redan medlem i detta företag', companyName: company.name });
  }

  // A company admin of another company shouldn't silently lose their role by
  // clicking a join link — guard against it.
  if (user.role === 'COMPANY_ADMIN') {
    return NextResponse.json(
      { message: 'Företagsadministratörer kan inte gå med i ett annat företag via länk.' },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from('users')
    .update({ company_id: company.id, role: 'EMPLOYEE' })
    .eq('id', user.id);

  if (error) {
    console.error('Error joining company:', error);
    return NextResponse.json({ message: 'Kunde inte gå med i företaget' }, { status: 500 });
  }

  return NextResponse.json({ message: `Du har gått med i ${company.name}`, companyName: company.name });
}
