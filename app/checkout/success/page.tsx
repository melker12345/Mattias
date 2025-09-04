'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  EnvelopeIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // You could fetch payment details here if needed
      // For now, just show success
      setIsLoading(false);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifierar din betalning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">
              Betalning lyckades!
            </h1>
            <p className="text-lg text-green-700">
              Tack för din beställning. Din betalning har behandlats framgångsrikt.
            </p>
          </div>

          {/* Details */}
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Bekräftelse skickas</h3>
                <p className="text-sm text-gray-600">
                  En e-postbekräftelse kommer att skickas till dig inom kort med alla detaljer.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Faktura skapas automatiskt</h3>
                <p className="text-sm text-gray-600">
                  En faktura kommer att skapas automatiskt i vårt ekonomisystem och skickas till dig.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Tillgång aktiverad</h3>
                <p className="text-sm text-gray-600">
                  Du har nu tillgång till alla köpta kurser och tjänster. Du kan börja direkt!
                </p>
              </div>
            </div>

            {sessionId && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Betalnings-ID: {sessionId}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/dashboard"
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center font-medium"
            >
              <span>Gå till Dashboard</span>
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
            
            <Link
              href="/courses"
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center font-medium"
            >
              Utforska fler kurser
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
