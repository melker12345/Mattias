import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id, name').eq('id', companyId).single()
    if (!company) {
      return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 })
    }

    const { data: employees } = await admin
      .from('users')
      .select('id, name, email, identity_verified, id06_eligible, created_at, updated_at')
      .eq('company_id', companyId)
      .eq('role', 'EMPLOYEE')
      .order('created_at', { ascending: false })

    // Fetch enrollment + certificate counts for each employee
    const employeeIds = (employees ?? []).map(e => e.id)
    const [{ data: enrollments }, { data: certificates }] = await Promise.all([
      admin.from('enrollments').select('user_id, completed_at').in('user_id', employeeIds),
      admin.from('certificates').select('user_id').in('user_id', employeeIds),
    ])

    const transformedEmployees = (employees ?? []).map(employee => {
      const userEnrollments = (enrollments ?? []).filter(e => e.user_id === employee.id)
      const userCerts = (certificates ?? []).filter(c => c.user_id === employee.id)
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        identityVerified: employee.identity_verified,
        id06Eligible: employee.id06_eligible,
        enrolledCourses: userEnrollments.length,
        completedCourses: userEnrollments.filter(e => e.completed_at).length,
        certificates: userCerts.length,
        lastActivity: employee.updated_at ? new Date(employee.updated_at).toLocaleDateString('sv-SE') : 'Aldrig',
        createdAt: employee.created_at,
        status: employee.identity_verified ? 'VERIFIED' : 'PENDING_VERIFICATION',
      }
    })

    return NextResponse.json({ employees: transformedEmployees, company: { id: company.id, name: company.name } })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av anställda' },
      { status: 500 }
    )
  }
}
