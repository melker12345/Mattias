import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: existingUser } = await admin.from('users').select('id').eq('email', email).maybeSingle();
    if (existingUser && existingUser.id !== authResult.id) {
      return NextResponse.json({ error: 'Email is already taken' }, { status: 409 });
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });

    await admin.from('users').update({ email }).eq('id', authResult.id);

    return NextResponse.json({ message: 'Email updated successfully', email });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
