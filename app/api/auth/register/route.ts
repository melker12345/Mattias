import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { decryptPersonnummer, encryptPersonnummer, normalisePersonnummer } from '@/lib/encryption'

const registerSchema = z.object({
  name: z.string().min(2, 'Namnet måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  personnummer: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, 'Lösenordet måste vara minst 6 tecken'),
  invitationToken: z.string().nullable().optional(),
})

function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, personnummer, phone, password, invitationToken } = registerSchema.parse(body)

    // If invitation token is provided, validate it before creating the auth user
    let invitation: any = null
    if (invitationToken) {
      const admin = createAdminClient()
      const { data } = await admin
        .from('invitations')
        .select('*, company:companies(id, name)')
        .eq('token', invitationToken)
        .single()
      invitation = data

      if (!invitation) {
        return NextResponse.json(
          { message: 'Ogiltig inbjudningslänk' },
          { status: 400 }
        )
      }

      if (invitation.used) {
        return NextResponse.json(
          { message: 'Inbjudningslänken har redan använts' },
          { status: 400 }
        )
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return NextResponse.json(
          { message: 'Inbjudningslänken har gått ut' },
          { status: 400 }
        )
      }

      if (invitation.email !== email) {
        return NextResponse.json(
          { message: 'E-postadressen matchar inte inbjudningen' },
          { status: 400 }
        )
      }

      // Identity cross-check: personnummer
      if (invitation.personnummer_encrypted) {
        if (!personnummer) {
          return NextResponse.json(
            { message: 'Personnummer krävs för att verifiera din identitet' },
            { status: 400 }
          )
        }
        try {
          const storedPnr = decryptPersonnummer(invitation.personnummer_encrypted)
          const normalisedStored = normalisePersonnummer(storedPnr)
          const normalisedProvided = normalisePersonnummer(personnummer)
          if (normalisedStored !== normalisedProvided) {
            return NextResponse.json(
              { message: 'Personnumret matchar inte de uppgifter företaget angav. Kontakta din arbetsgivare.' },
              { status: 400 }
            )
          }
        } catch {
          return NextResponse.json(
            { message: 'Kunde inte verifiera personnummer. Kontakta support.' },
            { status: 500 }
          )
        }
      }

      // Identity cross-check: phone
      if (invitation.phone) {
        if (!phone) {
          return NextResponse.json(
            { message: 'Telefonnummer krävs för att verifiera din identitet' },
            { status: 400 }
          )
        }
        if (normalisePhone(invitation.phone) !== normalisePhone(phone)) {
          return NextResponse.json(
            { message: 'Telefonnumret matchar inte de uppgifter företaget angav. Kontakta din arbetsgivare.' },
            { status: 400 }
          )
        }
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const isAdminEmail = adminEmail && email === adminEmail
    const role = isAdminEmail ? 'ADMIN' : invitation ? 'EMPLOYEE' : 'INDIVIDUAL'
    const displayName = invitation?.name ?? name

    // Create Supabase Auth user — Supabase handles password hashing
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: displayName,
          role,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { message: 'En användare med denna e-postadress finns redan' },
          { status: 400 }
        )
      }
      console.error('Supabase signUp error:', authError)
      return NextResponse.json(
        { message: 'Ett fel uppstod vid registrering' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { message: 'Ett fel uppstod vid skapande av konto' },
        { status: 500 }
      )
    }

    const identityVerified = !!(invitation && (invitation.personnummer_encrypted || invitation.phone))
    const admin = createAdminClient()

    const userData: Record<string, unknown> = {
      id: authData.user.id,
      name: displayName,
      email,
      role,
      phone: phone ?? null,
      identity_verified: identityVerified,
      company_id: invitation ? invitation.company_id : null,
      personnummer_encrypted: personnummer
        ? encryptPersonnummer(normalisePersonnummer(personnummer))
        : null,
    }

    const { data: user, error: insertError } = await admin
      .from('users')
      .insert(userData)
      .select('id, email, name, role')
      .single()

    if (insertError) {
      console.error('User insert error:', insertError)
      return NextResponse.json({ message: 'Kunde inte skapa användarprofil' }, { status: 500 })
    }

    // Mark invitation as used
    if (invitation) {
      await admin
        .from('invitations')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', invitation.id)
    }

    return NextResponse.json(
      {
        message: invitation
          ? 'Användare skapad och ansluten till företaget framgångsrikt'
          : 'Användare skapad framgångsrikt',
        user: { id: user!.id, email: user!.email, name: user!.name, role: user!.role },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Ogiltig data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering' },
      { status: 500 }
    )
  }
}
