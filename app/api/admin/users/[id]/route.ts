import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPaywallExempt } from '@/lib/test-accounts';

export const dynamic = 'force-dynamic';

// Toggle a test account's paywall bypass (Aktiv/Inaktiv). Only configured
// paywall-exempt test accounts may be toggled.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const body = await request.json().catch(() => ({}));
    const active = body?.paywallBypassActive;
    if (typeof active !== 'boolean') {
      return NextResponse.json({ message: 'paywallBypassActive (boolean) krävs' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: user } = await admin.from('users').select('id, email').eq('id', params.id).maybeSingle();
    if (!user) {
      return NextResponse.json({ message: 'Användare hittades inte' }, { status: 404 });
    }
    if (!isPaywallExempt(user.email)) {
      return NextResponse.json(
        { message: 'Endast testkonton kan växlas' },
        { status: 400 }
      );
    }

    const { error } = await admin.from('users').update({ paywall_bypass_active: active }).eq('id', params.id);
    if (error) {
      // Most likely the migration adding paywall_bypass_active hasn't been run.
      console.error('Error toggling paywall bypass:', error.message);
      return NextResponse.json(
        { message: 'Kunde inte uppdatera. Kör migrationen som lägger till kolumnen paywall_bypass_active.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: params.id, paywallBypassActive: active });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Ett fel uppstod' }, { status: 500 });
  }
}
