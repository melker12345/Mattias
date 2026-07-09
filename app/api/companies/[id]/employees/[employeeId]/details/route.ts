import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAccess, isNextResponse } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const companyId = params.id
    const access = await requireCompanyAccess(companyId)
    if (isNextResponse(access)) return access
    const employeeId = params.employeeId

    const admin = createAdminClient()

    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (!company) return NextResponse.json({ message: 'Företag hittades inte' }, { status: 404 })

    // Scope: the employee must belong to this company.
    const { data: employee } = await admin.from('users')
      .select('id, name, email, phone, personnummer_encrypted, identity_verified, created_at, updated_at')
      .eq('id', employeeId).eq('company_id', companyId).eq('role', 'EMPLOYEE').maybeSingle()
    if (!employee) return NextResponse.json({ message: 'Anställd hittades inte' }, { status: 404 })

    const [{ data: enrollments }, { data: certificates }] = await Promise.all([
      admin.from('enrollments')
        .select('id, enrolled_at, completed_at, passed, final_score, total_questions, correct_answers, course:courses(id, title, description, duration, passing_score)')
        .eq('user_id', employeeId).order('enrolled_at', { ascending: false }),
      admin.from('certificates')
        .select('id, certificate_number, issued_at, id06_verified, course_id')
        .eq('user_id', employeeId),
    ])

    const enrollmentRows = enrollments ?? []
    const courseIds = Array.from(new Set(enrollmentRows.map((e) => (e.course as any)?.id).filter(Boolean)))

    // Batch-fetch lessons, progress, questions and answers for every enrolled
    // course at once, then group in memory (avoids per-enrollment N+1 queries).
    const [{ data: lessons }, { data: progressRecords }] = await Promise.all([
      courseIds.length
        ? admin.from('lessons').select('id, title, type, "order", course_id').in('course_id', courseIds).order('order')
        : Promise.resolve({ data: [] as any[] }),
      courseIds.length
        ? admin.from('progress').select('lesson_id, completed, completed_at').eq('user_id', employeeId)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const lessonRows = lessons ?? []
    const lessonIds = lessonRows.map((l) => l.id)
    const lessonToCourse = new Map<string, string>()
    const lessonOrderById = new Map<string, number>()
    for (const l of lessonRows) {
      lessonToCourse.set(l.id, l.course_id)
      lessonOrderById.set(l.id, l.order)
    }
    // Per course: the order of the 'test_intro' divider (if any). Question
    // lessons ordered after it make up the graded test.
    const dividerOrderByCourse = new Map<string, number>()
    for (const l of lessonRows) {
      if (l.type === 'test_intro') dividerOrderByCourse.set(l.course_id, l.order)
    }

    const [{ data: questions }, { data: answers }] = await Promise.all([
      lessonIds.length
        ? admin.from('questions').select('id, question, options, correct_answer, lesson_id, "order"').in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] as any[] }),
      lessonIds.length
        ? admin.from('answers').select('question_id, answer, is_correct').eq('user_id', employeeId)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const answerByQuestion = new Map<string, { answer: string; is_correct: boolean }>()
    for (const a of answers ?? []) answerByQuestion.set(a.question_id, a)

    // Build per-question detail grouped by course.
    const answersByCourse = new Map<string, any[]>()
    for (const q of questions ?? []) {
      const courseId = lessonToCourse.get(q.lesson_id)
      if (!courseId) continue
      let options: string[] = []
      try { options = JSON.parse(q.options) } catch { options = [] }
      const ua = answerByQuestion.get(q.id)
      const selectedIndex = ua ? parseInt(ua.answer) : -1
      const correctIndex = parseInt(q.correct_answer)
      const dividerOrder = dividerOrderByCourse.get(courseId)
      const lessonOrder = lessonOrderById.get(q.lesson_id) ?? 0
      const isTest = dividerOrder !== undefined && lessonOrder > dividerOrder
      const entry = {
        questionId: q.id,
        question: q.question,
        options,
        correctAnswer: q.correct_answer,
        correctAnswerText: options[correctIndex] ?? '',
        userAnswer: ua?.answer ?? 'Ej besvarad',
        userAnswerText: ua ? (options[selectedIndex] ?? 'Ej besvarad') : 'Ej besvarad',
        selectedIndex,
        isCorrect: ua?.is_correct ?? false,
        answered: !!ua,
        isTest,
      }
      if (!answersByCourse.has(courseId)) answersByCourse.set(courseId, [])
      answersByCourse.get(courseId)!.push(entry)
    }

    const enrichedEnrollments = enrollmentRows.map((enrollment) => {
      const course = enrollment.course as unknown as { id: string; title: string; description: string; duration: number; passing_score: number }
      const courseLessons = lessonRows.filter((l) => l.course_id === course.id)
      const totalLessons = courseLessons.length
      const completedLessons = courseLessons.filter((l) => (progressRecords ?? []).find((p) => p.lesson_id === l.id && p.completed)).length
      const courseAnswers = answersByCourse.get(course.id) ?? []
      const hasTest = dividerOrderByCourse.has(course.id)
      const scoreOf = (set: typeof courseAnswers) => {
        const correct = set.filter((a) => a.isCorrect).length
        return {
          total: set.length,
          answered: set.filter((a) => a.answered).length,
          correct,
          score: set.length ? Math.round((correct / set.length) * 100) : 0,
        }
      }
      const testScore = scoreOf(courseAnswers.filter((a) => a.isTest))
      const learningScore = scoreOf(courseAnswers.filter((a) => !a.isTest))
      const status: 'in_progress' | 'passed' | 'failed' = enrollment.completed_at
        ? (enrollment.passed ? 'passed' : 'failed')
        : 'in_progress'
      return {
        id: enrollment.id,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        status,
        finalScore: enrollment.final_score,
        correctAnswers: enrollment.correct_answers,
        totalQuestions: enrollment.total_questions,
        hasTest,
        testScore,
        learningScore,
        course: {
          id: course.id, title: course.title, description: course.description, duration: course.duration,
          passingScore: course.passing_score,
          totalLessons, completedLessons,
          progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          lessons: courseLessons.map((l) => {
            const p = (progressRecords ?? []).find((r) => r.lesson_id === l.id)
            return { id: l.id, title: l.title, order: l.order, completed: p?.completed ?? false, completedAt: p?.completed_at ?? null }
          }),
        },
        answers: courseAnswers,
        certificates: (certificates ?? []).filter((c) => c.course_id === course.id).map((c) => ({
          id: c.id, certificateNumber: c.certificate_number, issuedAt: c.issued_at, id06Verified: c.id06_verified,
        })),
      }
    })

    // Never expose the encrypted personnummer ciphertext to the client — only
    // whether one is on file.
    const { personnummer_encrypted, ...employeeSafe } = employee
    return NextResponse.json({
      employee: {
        ...employeeSafe,
        identityVerified: employee.identity_verified,
        hasPersonnummer: !!personnummer_encrypted,
        enrollments: enrichedEnrollments,
        certificates: certificates ?? [],
      },
    })
  } catch (error) {
    console.error('Error fetching employee details:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av anställds detaljer' },
      { status: 500 }
    )
  }
}
