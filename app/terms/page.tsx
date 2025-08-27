import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Tillbaka till startsidan
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Användarvillkor</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <h2>1. Allmänt</h2>
            <p>
              Dessa användarvillkor gäller för användning av vår utbildningsplattform. Genom att använda tjänsten accepterar du dessa villkor.
            </p>

            <h2>2. Tjänstebeskrivning</h2>
            <p>
              Vi erbjuder onlinekurser och företagslösningar för utbildning inom säkerhet, arbete på väg och kompetensutveckling.
            </p>

            <h2>3. Användarregistrering</h2>
            <p>
              För att använda våra tjänster måste du registrera dig med korrekt information. Du ansvarar för att hålla din information uppdaterad.
            </p>

            <h2>4. Betalning och fakturering</h2>
            <p>
              Kurser debiteras vid köp. Företagskonton debiteras månadsvis. Alla priser anges inklusive moms.
            </p>

            <h2>5. Användning av kursmaterial</h2>
            <p>
              Kursmaterialet är endast för personligt bruk. Du får inte dela, kopiera eller distribuera materialet utan tillstånd.
            </p>

            <h2>6. Certifiering</h2>
            <p>
              Slutförda kurser ger certifiering enligt gällande standarder. Certifikaten är giltiga enligt respektive regelverk.
            </p>

            <h2>7. Uppsägning</h2>
            <p>
              Du kan när som helst avsluta ditt konto. Företagskonton kan sägas upp med 30 dagars uppsägningstid.
            </p>

            <h2>8. Ansvarsfriskrivning</h2>
            <p>
              Vi ansvarar inte för indirekta skador eller följdskador som kan uppstå vid användning av tjänsten.
            </p>

            <h2>9. Ändringar av villkor</h2>
            <p>
              Vi förbehåller oss rätten att ändra dessa villkor. Ändringar meddelas via e-post eller på webbplatsen.
            </p>

            <h2>10. Kontakt</h2>
            <p>
              Vid frågor om dessa villkor, kontakta oss via <a href="/contact" className="text-primary-600 hover:text-primary-500">kontaktsidan</a>.
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
