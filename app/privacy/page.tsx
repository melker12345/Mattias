import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Tillbaka till startsidan
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Integritetspolicy</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <h2>1. Dataskydd</h2>
            <p>
              Vi värnar om din personliga integritet och följer GDPR och svensk dataskyddslagstiftning.
            </p>

            <h2>2. Insamling av personuppgifter</h2>
            <p>
              Vi samlar in följande personuppgifter:
            </p>
            <ul>
              <li>Namn och kontaktinformation</li>
              <li>Företagsinformation</li>
              <li>Betalningsinformation (hanteras säkert av betalningsleverantör)</li>
              <li>Kursframsteg och certifieringar</li>
            </ul>

            <h2>3. Syfte med behandling</h2>
            <p>
              Personuppgifterna används för:
            </p>
            <ul>
              <li>Leverans av kurser och tjänster</li>
              <li>Fakturering och betalningshantering</li>
              <li>Kundservice och support</li>
              <li>Förbättring av våra tjänster</li>
              <li>Efterlevnad av lagar och regler</li>
            </ul>

            <h2>4. Rättslig grund</h2>
            <p>
              Behandling av personuppgifter sker på grund av:
            </p>
            <ul>
              <li>Avtal (när du köper våra tjänster)</li>
              <li>Berättigat intresse (förbättring av tjänster)</li>
              <li>Lagstadgade skyldigheter (bokföring, moms)</li>
            </ul>

            <h2>5. Delning av data</h2>
            <p>
              Vi delar inte dina personuppgifter med tredje part utom:
            </p>
            <ul>
              <li>Betalningsleverantörer (för säker betalning)</li>
              <li>Myndigheter (vid lagstadgade krav)</li>
              <li>Certifieringsorgan (för ID06-certifiering)</li>
            </ul>

            <h2>6. Datasäkerhet</h2>
            <p>
              Vi implementerar tekniska och organisatoriska säkerhetsåtgärder för att skydda dina personuppgifter.
            </p>

            <h2>7. Dina rättigheter</h2>
            <p>
              Du har rätt att:
            </p>
            <ul>
              <li>Få information om vilka uppgifter vi behandlar</li>
              <li>Begära rättelse av felaktiga uppgifter</li>
              <li>Begära radering av uppgifter</li>
              <li>Begränsa behandling</li>
              <li>Ta med dina uppgifter (dataportabilitet)</li>
              <li>Invända mot behandling</li>
            </ul>

            <h2>8. Cookies</h2>
            <p>
              Vi använder cookies för att förbättra användarupplevelsen och analysera webbplatsens användning.
            </p>

            <h2>9. Kontakt</h2>
            <p>
              För frågor om personuppgiftsbehandling, kontakta oss via <a href="/contact" className="text-primary-600 hover:text-primary-500">kontaktsidan</a>.
            </p>

            <h2>10. Datainspektionen</h2>
            <p>
              Du har rätt att klaga till Datainspektionen om du anser att vi behandlar dina personuppgifter felaktigt.
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
