import { NextResponse } from 'next/server'
import { requireAdmin, isNextResponse } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { generateID06Export } from '@/lib/export'

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await requireAdmin()
  if (isNextResponse(user)) return user

  const supabase = createClient()

  const { data, error } = await supabase
    .from('apv_submissions')
    .select(`
      full_name,
      personnummer_encrypted,
      course_title,
      completion_date,
      final_score,
      passing_score,
      submitted_at,
      id06_registered,
      certificates (certificate_number)
    `)
    .eq('status', 'APPROVED')
    .order('completion_date', { ascending: false })

  if (error) {
    console.error('[export/id06-completions]', error)
    return NextResponse.json({ message: 'Databasfel vid hämtning av godkända inlämningar' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ message: 'Inga godkända inlämningar hittades' }, { status: 404 })
  }

  const rows = data.map((row: any) => ({
    full_name: row.full_name,
    personnummer_encrypted: row.personnummer_encrypted,
    course_title: row.course_title,
    completion_date: row.completion_date,
    final_score: row.final_score,
    passing_score: row.passing_score,
    submitted_at: row.submitted_at,
    id06_registered: row.id06_registered,
    certificate_number: row.certificates?.certificate_number ?? null,
  }))

  const buffer = generateID06Export(rows)

  const supabaseAdmin = createClient()
  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'EXPORT_ID06',
    resource: 'apv_submissions',
    metadata: JSON.stringify({ count: rows.length, exported_at: new Date().toISOString() }),
  })

  const filename = `id06-export-${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
