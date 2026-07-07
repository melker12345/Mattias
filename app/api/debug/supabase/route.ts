import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// TEMPORARY diagnostic. Reports which Supabase project the SERVER runtime is
// actually using and whether it can read courses. Does NOT expose secrets
// (only presence/length/prefix of the service key). Remove after debugging.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const info: Record<string, unknown> = {
    serverSupabaseUrl: url,
    serviceKeyPresent: key.length > 0,
    serviceKeyLength: key.length,
    serviceKeyPrefix: key.slice(0, 10),
  };

  try {
    const admin = createAdminClient();
    const { count: publishedCount, error: pubErr } = await admin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);
    const { count: totalCount, error: totErr } = await admin
      .from('courses')
      .select('*', { count: 'exact', head: true });
    info.publishedCourseCount = publishedCount;
    info.totalCourseCount = totalCount;
    info.queryError = pubErr?.message ?? totErr?.message ?? null;
  } catch (e) {
    info.createClientError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}
