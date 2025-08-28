import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const questions = await prisma.question.findMany({
      where: { lessonId: params.lessonId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av frågor' },
      { status: 500 }
    );
  }
}
