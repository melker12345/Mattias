import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Tillbaka till startsidan
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cookies och Spårning</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <h2>Vad är cookies?</h2>
            <p>
              Cookies är små textfiler som lagras på din enhet när du besöker vår webbplats. 
              De hjälper oss att förbättra din upplevelse och webbplatsens funktionalitet.
            </p>

            <h2>Vilka cookies använder vi?</h2>
            
            <h3>Nödvändiga cookies</h3>
            <p>
              Dessa cookies är nödvändiga för att webbplatsen ska fungera korrekt. 
              De kan inte stängas av och inkluderar cookies för:
            </p>
            <ul>
              <li>Inloggning och sessionshantering</li>
              <li>Säkerhet och autentisering</li>
              <li>Kundvagnsfunktionalitet</li>
              <li>Grundläggande webbplatsfunktioner</li>
            </ul>

            <h3>Funktionella cookies</h3>
            <p>
              Dessa cookies förbättrar funktionaliteten och personanpassningen:
            </p>
            <ul>
              <li>Språkinställningar</li>
              <li>Användarpreferenser</li>
              <li>Kursframsteg och statistik</li>
            </ul>

            <h3>Analytiska cookies</h3>
            <p>
              Vi använder analytiska cookies för att förstå hur webbplatsen används:
            </p>
            <ul>
              <li>Besökarstatistik</li>
              <li>Populära sidor och innehåll</li>
              <li>Prestanda och felrapportering</li>
            </ul>

            <h2>Hantera cookies</h2>
            <p>
              Du kan hantera dina cookie-inställningar i din webbläsare. 
              Observera att om du stänger av vissa cookies kan webbplatsens funktionalitet påverkas.
            </p>

            <h3>Webbläsarinställningar</h3>
            <p>
              För att hantera cookies i din webbläsare:
            </p>
            <ul>
              <li><strong>Chrome:</strong> Inställningar → Avancerat → Sekretess och säkerhet → Cookies</li>
              <li><strong>Firefox:</strong> Inställningar → Sekretess och säkerhet → Cookies</li>
              <li><strong>Safari:</strong> Inställningar → Sekretess → Hantera webbplatsdata</li>
              <li><strong>Edge:</strong> Inställningar → Cookies och webbplatsbehörigheter</li>
            </ul>

            <h2>Tredjepartscookies</h2>
            <p>
              Vi kan använda tjänster från tredje part som också sätter cookies:
            </p>
            <ul>
              <li><strong>Google Analytics:</strong> För webbplatsanalys</li>
              <li><strong>Fortnox:</strong> För fakturahantering</li>
              <li><strong>NextAuth.js:</strong> För autentisering</li>
            </ul>

            <h2>Uppdateringar av denna policy</h2>
            <p>
              Vi kan uppdatera denna cookie-policy när vi ändrar våra rutiner. 
              Senaste uppdateringen finns längst ner på sidan.
            </p>

            <h2>Kontakt</h2>
            <p>
              Om du har frågor om vår användning av cookies, kontakta oss via 
              <a href="/contact" className="text-primary-600 hover:text-primary-500"> kontaktsidan</a>.
            </p>

            <p className="text-sm text-gray-500 mt-8">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
