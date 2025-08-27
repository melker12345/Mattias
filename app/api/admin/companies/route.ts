import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // First, get all companies
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Then, get employee counts and admin info for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        // Get employee count
        const employeeCount = await prisma.user.count({
          where: {
            companyId: company.id,
            role: 'EMPLOYEE'
          }
        });

        // Get company admin
        const companyAdmin = await prisma.user.findFirst({
          where: {
            companyId: company.id,
            role: 'COMPANY_ADMIN'
          },
          select: {
            name: true,
            email: true
          }
        });

        // Get invitation count
        const invitationCount = await prisma.invitation.count({
          where: {
            companyId: company.id
          }
        });

        return {
          id: company.id,
          name: company.name,
          organizationNumber: company.organizationNumber,
          contactPerson: company.contactPerson,
          email: company.email,
          phone: company.phone,
          address: company.address,
          verified: company.verified,
          isActive: company.isActive,
          adminName: companyAdmin?.name || 'Ej tilldelad',
          adminEmail: companyAdmin?.email || 'Ej tilldelad',
          employeeCount,
          invitationCount,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        };
      })
    );

    return NextResponse.json(companiesWithStats);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av företag' },
      { status: 500 }
    );
  }
}
