'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/app/providers';

interface JoinInfo {
  valid: boolean;
  companyName?: string;
  companyId?: string;
  alreadyMember?: boolean;
  message?: string;
}

export default function JoinCompanyPage({ params }: { params: { token: string } }) {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/join/${params.token}`, { cache: 'no-store' });
        const data = await res.json();
        setInfo(data);
      } catch {
        setInfo({ valid: false, message: 'Ett fel uppstod' });
      } finally {
        setLoading(false);
      }
    })();
  }, [params.token]);

  const join = async () => {
    setJoining(true);
    setError('');
    try {
      const res = await fetch(`/api/join/${params.token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Kunde inte gå med i företaget');
        return;
      }
      router.push('/dashboard?joined=1');
    } catch {
      setError('Kunde inte gå med i företaget');
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 max-w-md w-full text-center">{children}</div>
    </div>
  );

  if (!info?.valid) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Inbjudningslänken är ogiltig</h1>
        <p className="text-gray-600 mb-6">{info?.message || 'Länken kan ha gått ut. Be företaget om en ny länk.'}</p>
        <Link href="/" className="btn-primary">Till startsidan</Link>
      </Shell>
    );
  }

  const company = info.companyName;

  if (info.alreadyMember) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Du är redan medlem</h1>
        <p className="text-gray-600 mb-6">Ditt konto tillhör redan {company}.</p>
        <Link href="/dashboard" className="btn-primary">Till min dashboard</Link>
      </Shell>
    );
  }

  // Signed in → confirm join.
  if (user) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gå med i {company}?</h1>
        <p className="text-gray-600 mb-6">
          Ditt konto ({user.email}) kopplas till {company} som anställd, och företaget kan tilldela dig kurser
          och följa dina resultat.
        </p>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="space-y-3">
          <button onClick={join} disabled={joining} className="w-full btn-primary disabled:opacity-50">
            {joining ? 'Går med…' : `Ja, gå med i ${company}`}
          </button>
          <Link href="/dashboard" className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Inte nu
          </Link>
        </div>
      </Shell>
    );
  }

  // Logged out → create account (auto-joins) or sign in and come back here.
  const callback = encodeURIComponent(`/join/${params.token}`);
  return (
    <Shell>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Du har blivit inbjuden till {company}</h1>
      <p className="text-gray-600 mb-6">
        Skapa ett konto för att gå med i {company}. Har du redan ett konto kan du logga in och gå med.
      </p>
      <div className="space-y-3">
        <Link href={`/auth/signup?companyToken=${params.token}`} className="block w-full btn-primary">
          Skapa konto och gå med
        </Link>
        <Link
          href={`/auth/signin?callbackUrl=${callback}`}
          className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Jag har redan ett konto
        </Link>
      </div>
    </Shell>
  );
}
