import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const updatedQuestion = await prisma.question.update({
      where: { id: params.questionId },
      data: {
        question,
        type,
        options: options || '[]',
        correctAnswer: JSON.stringify(Number(correctAnswer)) // Ensure it's stored as a number
      }
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid uppdatering av fråga' },
      { status: 500 }
    );
  }
}
