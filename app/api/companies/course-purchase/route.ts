import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (isNextResponse(authResult)) return authResult

    const { companyId, employeeId, employeeIds, courseIds, purchaseType } = await request.json()

    // Validate input
    if (!companyId || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    // Check if user has access to this company
    if (authResult.role !== 'ADMIN' && authResult.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const { data: courses } = await admin.from('courses').select('id, price').in('id', courseIds)
    if (!courses || courses.length !== courseIds.length) return NextResponse.json({ error: 'Some courses not found' }, { status: 404 })

    const totalPrice = courses.reduce((sum, c) => sum + (c.price as number), 0)
    const finalPrice = purchaseType === 'bulk' ? totalPrice * 0.85 : totalPrice

    const { data: coursePurchase } = await admin.from('course_purchases').insert({
      company_id: companyId,
      course_id: courseIds[0],
      quantity: 1,
      price_per_unit: courses[0].price,
      total_amount: finalPrice,
    }).select().single()

    // Resolve which employees to enrol:
    //  - bulk                       → every employee in the company
    //  - specific employeeIds[]     → those employees (validated to the company)
    //  - single employeeId (legacy) → that employee
    let targetUserIds: string[] = []
    if (purchaseType === 'bulk') {
      const { data: employees } = await admin.from('users').select('id').eq('company_id', companyId).eq('role', 'EMPLOYEE')
      targetUserIds = (employees ?? []).map(e => e.id)
    } else {
      const requested: string[] = Array.isArray(employeeIds) && employeeIds.length
        ? employeeIds
        : employeeId ? [employeeId] : []
      if (requested.length) {
        // Only enrol users that actually belong to this company.
        const { data: valid } = await admin.from('users').select('id').eq('company_id', companyId).eq('role', 'EMPLOYEE').in('id', requested)
        targetUserIds = (valid ?? []).map(e => e.id)
      }
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: 'No employees selected' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const enrollmentRows = targetUserIds.flatMap(uid =>
      courseIds.map((courseId: string) => ({
        user_id: uid,
        course_id: courseId,
        course_purchase_id: coursePurchase!.id,
        is_paid: true,
        paid_at: nowIso,
        payment_method: 'company_purchase',
      }))
    )

    // Upsert so an employee already enrolled in one of the courses doesn't fail
    // the whole batch; ignoreDuplicates keeps any existing progress intact.
    if (enrollmentRows.length > 0) {
      await admin.from('enrollments').upsert(enrollmentRows, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
    }

    const { data: invoice } = await admin.from('invoices').insert({
      company_id: companyId,
      invoice_number: `INV-COURSE-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      amount: finalPrice, currency: 'SEK',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
    }).select('id, invoice_number, amount').single()

    for (const course of courses) {
      const qty = purchaseType === 'bulk' ? enrollmentRows.filter(e => e.course_id === course.id).length : 1
      await admin.from('invoice_items').insert({ invoice_id: invoice!.id, course_id: course.id, quantity: qty, price: course.price, total: (course.price as number) * qty })
    }

    return NextResponse.json({
      success: true,
      message: purchaseType === 'individual' ? 'Kurser köpta för anställd' : 'Kurser köpta för alla anställda',
      coursePurchase,
      enrollments: enrollmentRows.length,
      invoice: { id: invoice!.id, invoiceNumber: invoice!.invoice_number, amount: invoice!.amount },
    })

  } catch (error) {
    console.error('Course purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to process course purchase' },
      { status: 500 }
    )
  }
}



