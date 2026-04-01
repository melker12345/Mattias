import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptPersonnummer, normalisePersonnummer } from '@/lib/encryption';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const body = await request.json();
    const {
      fullName,
      personalNumber,
      address,
      postalCode,
      city,
      phone,
      finalScore,
      passingScore
    } = body;

    // Validate required fields
    if (!fullName || !personalNumber || !address || !postalCode || !city) {
      return NextResponse.json(
        { message: 'Alla obligatoriska fält måste fyllas i' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const userId = authResult.id;

    const { data: enrollment } = await admin
      .from('enrollments').select('*, course:courses(id, title, passing_score)')
      .eq('user_id', userId).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 400 });
    if (!enrollment.passed) return NextResponse.json({ message: 'Du måste ha godkänt kursen för att kunna skicka APV submission' }, { status: 400 });

    const { data: existingSubmission } = await admin.from('apv_submissions').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
    if (existingSubmission) return NextResponse.json({ message: 'APV submission har redan skickats för denna kurs' }, { status: 400 });

    // Upsert certificate
    let { data: certificate } = await admin.from('certificates').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
    if (!certificate) {
      const { data: newCert } = await admin.from('certificates').insert({
        user_id: userId, course_id: courseId,
        certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      }).select('id').single();
      certificate = newCert;
    }

    // Build answers data
    const { data: lessons } = await admin.from('lessons').select('id').eq('course_id', courseId);
    const lessonIds = (lessons ?? []).map(l => l.id);
    const { data: questions } = lessonIds.length ? await admin.from('questions').select('*').in('lesson_id', lessonIds) : { data: [] };
    const qIds = (questions ?? []).map(q => q.id);
    const { data: userAnswersRaw } = qIds.length ? await admin.from('answers').select('*').eq('user_id', userId).in('question_id', qIds) : { data: [] };

    const totalQuestions = (questions ?? []).length;
    const correctAnswers = (userAnswersRaw ?? []).filter(a => a.is_correct).length;
    const answersData = (questions ?? []).map(q => {
      const ans = (userAnswersRaw ?? []).find(a => a.question_id === q.id);
      let options: unknown;
      try { options = q.options ? JSON.parse(q.options) : undefined; } catch { options = undefined; }
      return { questionId: q.id, question: q.question, userAnswer: ans?.answer ?? null, isCorrect: ans?.is_correct ?? false, correctAnswer: q.correct_answer, options };
    });

    const encryptedPnr = personalNumber ? encryptPersonnummer(normalisePersonnummer(personalNumber)) : null;
    const courseData = enrollment.course as { id: string; title: string; passing_score: number };

    const { data: apvSubmission } = await admin.from('apv_submissions').insert({
      user_id: userId, course_id: courseId, certificate_id: certificate?.id ?? null,
      full_name: fullName, personnummer_encrypted: encryptedPnr,
      address, postal_code: postalCode, city, phone: phone ?? null,
      course_title: courseData.title,
      completion_date: enrollment.completed_at ?? new Date().toISOString(),
      final_score: finalScore, passing_score: passingScore,
      total_questions: totalQuestions, correct_answers: correctAnswers,
      answers_data: JSON.stringify(answersData), status: 'PENDING',
    }).select().single();

    if (certificate) {
      await admin.from('certificates').update({ apv_submitted: true, apv_submitted_at: new Date().toISOString(), apv_submission_id: apvSubmission?.id }).eq('id', certificate.id);
    }

    return NextResponse.json({ message: 'APV submission skickades framgångsrikt', submission: apvSubmission });

  } catch (error) {
    console.error('Error creating APV submission:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av APV submission' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const userId = authResult.id;

    const admin = createAdminClient();
    const { data: submission } = await admin
      .from('apv_submissions')
      .select('*, course:courses(*), certificate:certificates(*)')
      .eq('user_id', userId).eq('course_id', courseId).maybeSingle();

    if (!submission) return NextResponse.json({ message: 'Ingen APV submission hittades' }, { status: 404 });
    return NextResponse.json(submission);

  } catch (error) {
    console.error('Error fetching APV submission:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av APV submission' },
      { status: 500 }
    );
  }
}
