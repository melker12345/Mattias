import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const admin = createAdminClient();
    const { data: questions } = await admin.from('questions').select('*').eq('lesson_id', params.lessonId).order('order');
    return NextResponse.json(questions ?? []);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av frågor' },
      { status: 500 }
    );
  }
}
