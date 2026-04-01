import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { data: companies } = await admin.from('companies').select('*').order('created_at', { ascending: false });

    const companiesWithStats = await Promise.all((companies ?? []).map(async (company) => {
      const [{ count: employeeCount }, { data: companyAdmin }, { count: invitationCount }] = await Promise.all([
        admin.from('users').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('role', 'EMPLOYEE'),
        admin.from('users').select('name, email').eq('company_id', company.id).eq('role', 'COMPANY_ADMIN').limit(1).maybeSingle(),
        admin.from('invitations').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
      ]);
      return {
        id: company.id, name: company.name, organizationNumber: company.organization_number,
        contactPerson: company.contact_person, email: company.email, phone: company.phone,
        address: company.address, verified: company.verified, isActive: company.is_active,
        adminName: companyAdmin?.name ?? 'Ej tilldelad', adminEmail: companyAdmin?.email ?? 'Ej tilldelad',
        employeeCount: employeeCount ?? 0, invitationCount: invitationCount ?? 0,
        createdAt: company.created_at, updatedAt: company.updated_at,
      };
    }));

    return NextResponse.json(companiesWithStats);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av företag' },
      { status: 500 }
    );
  }
}
