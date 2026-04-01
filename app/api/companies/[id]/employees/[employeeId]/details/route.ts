import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const employeeId = params.employeeId

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (!company) return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 })

    const { data: employee } = await admin.from('users')
      .select('id, name, email, identity_verified, created_at, updated_at')
      .eq('id', employeeId).eq('company_id', companyId).eq('role', 'EMPLOYEE').maybeSingle()
    if (!employee) return NextResponse.json({ message: 'Anställd hittades inte' }, { status: 404 })

    const [{ data: enrollments }, { data: certificates }] = await Promise.all([
      admin.from('enrollments')
        .select('id, enrolled_at, completed_at, course:courses(id, title, description, duration)')
        .eq('user_id', employeeId).order('enrolled_at', { ascending: false }),
      admin.from('certificates')
        .select('id, certificate_number, issued_at, id06_verified')
        .eq('user_id', employeeId),
    ])

    // Fetch lessons + progress for each enrolled course
    const enrichedEnrollments = await Promise.all((enrollments ?? []).map(async (enrollment) => {
      const course = enrollment.course as unknown as { id: string; title: string; description: string; duration: number }
      const { data: lessons } = await admin.from('lessons').select('id, title, order').eq('course_id', course.id).order('order')
      const lessonIds = (lessons ?? []).map(l => l.id)
      const { data: progressRecords } = lessonIds.length
        ? await admin.from('progress').select('lesson_id, completed, completed_at').eq('user_id', employeeId).in('lesson_id', lessonIds)
        : { data: [] }
      const totalLessons = (lessons ?? []).length
      const completedLessons = (progressRecords ?? []).filter(p => p.completed).length
      return {
        id: enrollment.id, enrolledAt: enrollment.enrolled_at, completedAt: enrollment.completed_at,
        course: {
          ...course, totalLessons, completedLessons,
          progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          lessons: (lessons ?? []).map(l => {
            const p = (progressRecords ?? []).find(r => r.lesson_id === l.id)
            return { ...l, completed: p?.completed ?? false, completedAt: p?.completed_at ?? null }
          }),
        },
      }
    }))

    return NextResponse.json({ employee: { ...employee, enrollments: enrichedEnrollments, certificates: certificates ?? [] } })
  } catch (error) {
    console.error('Error fetching employee details:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av anställds detaljer' },
      { status: 500 }
    )
  }
}
