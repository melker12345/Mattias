import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Manually issue a certificate for a passed enrollment. `id` is the enrollment
// id. Certificates are admin-granted for now (until ID06 automation), and are
// only issued once the learner's identity (name + personnummer) is on file so
// the certificate is bound to a fixed identity.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id, user_id, course_id, passed')
      .eq('id', params.id)
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Anmälan hittades inte' }, { status: 404 });
    if (!enrollment.passed) {
      return NextResponse.json({ message: 'Deltagaren har inte klarat kursen' }, { status: 400 });
    }

    const { data: learner } = await admin
      .from('users').select('name, personnummer_encrypted').eq('id', enrollment.user_id).maybeSingle();
    if (!learner?.name || !learner?.personnummer_encrypted) {
      return NextResponse.json(
        { message: 'Deltagaren saknar namn/personnummer. Uppgifterna måste fyllas i innan certifikat kan utfärdas.' },
        { status: 400 }
      );
    }

    const existing = await admin
      .from('certificates').select('id').eq('user_id', enrollment.user_id).eq('course_id', enrollment.course_id).maybeSingle();
    if (existing.data) {
      return NextResponse.json({ message: 'Certifikat finns redan', certificateId: existing.data.id });
    }

    // Human-readable, unique certificate number. Year is passed in to avoid
    // relying on server clock semantics inconsistently; a random suffix keeps it
    // unique without a sequence table.
    const year = new Date().getFullYear();
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    const certificateNumber = `CERT-${year}-${suffix}`;

    const { data: cert, error } = await admin
      .from('certificates')
      .insert({
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        certificate_number: certificateNumber,
      })
      .select('id, certificate_number, issued_at')
      .single();

    if (error) {
      console.error('Certificate issue error:', error);
      return NextResponse.json({ message: 'Kunde inte utfärda certifikat' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Certifikat utfärdat',
      certificate: { id: cert.id, certificateNumber: cert.certificate_number, issuedAt: cert.issued_at },
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({ message: 'Ett fel uppstod vid utfärdande av certifikat' }, { status: 500 });
  }
}
