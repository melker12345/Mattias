import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string; questionId: string } }
) {
  try {
    const body = await request.json();
    const { question, type, options, correctAnswer } = body;

    // Validate required fields
    if (!question || !type || correctAnswer === undefined) {
      return NextResponse.json(
        { message: 'Fråga, typ och korrekt svar är obligatoriska fält' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: updatedQuestion } = await admin.from('questions').update({
      question, type, options: options ?? '[]',
      correct_answer: JSON.stringify(Number(correctAnswer)),
    }).eq('id', params.questionId).select().single();
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av fråga' },
      { status: 500 }
    );
  }
}
