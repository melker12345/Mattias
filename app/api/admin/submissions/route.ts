import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();
    const { data: submissions, error } = await admin
      .from('apv_submissions')
      .select('*, user:users(id, email, name), course:courses(id, title, category)')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    const transformedSubmissions = (submissions ?? []).map(s => ({
      id: s.id,
      user: s.user,
      course: s.course,
      courseTitle: s.course_title,
      completionDate: s.completion_date,
      finalScore: s.final_score,
      passingScore: s.passing_score,
      totalQuestions: s.total_questions,
      correctAnswers: s.correct_answers,
      timeTaken: s.time_taken,
      status: s.status,
      submittedAt: s.submitted_at,
      reviewedAt: s.reviewed_at,
      reviewedBy: s.reviewed_by,
      reviewNotes: s.review_notes,
      answersData: JSON.parse(s.answers_data),
    }));

    return NextResponse.json(transformedSubmissions);

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av inlämningar' },
      { status: 500 }
    );
  }
}

// POST endpoint to update submission status (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;
    const user = adminResult;

    const { submissionId, status, reviewNotes } = await request.json();

    if (!submissionId || !status) {
      return NextResponse.json(
        { message: 'Submission ID och status krävs' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: 'Ogiltig status. Måste vara APPROVED eller REJECTED' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: updatedSubmission, error } = await admin
      .from('apv_submissions')
      .update({
        status,
        review_notes: reviewNotes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', submissionId)
      .select('*, user:users(id, email, name), course:courses(id, title)')
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: `Inlämning ${status === 'APPROVED' ? 'godkänd' : 'avvisad'}`,
      submission: updatedSubmission,
    });

  } catch (error) {
    console.error('Error updating submission status:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av inlämningsstatus' },
      { status: 500 }
    );
  }
}
