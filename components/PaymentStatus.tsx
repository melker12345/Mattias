'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface PaymentStatusProps {
  className?: string;
}

type PaymentResult = 'success' | 'canceled' | 'error' | null;

export default function PaymentStatus({ className = '' }: PaymentStatusProps) {
  const searchParams = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<PaymentResult>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const payment = searchParams.get('payment');
    
    if (payment) {
      setPaymentResult(payment as PaymentResult);
      setIsVisible(true);

      // Auto-hide success/canceled messages after 10 seconds
      if (payment === 'success' || payment === 'canceled') {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remove payment parameter from URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    window.history.replaceState({}, '', url.toString());
  };

  if (!isVisible || !paymentResult) {
    return null;
  }

  const getStatusConfig = () => {
    switch (paymentResult) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          title: 'Betalning lyckades!',
          message: 'Din betalning har behandlats och du har nu tillgång till innehållet.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
        };
      case 'canceled':
        return {
          icon: XCircleIcon,
          title: 'Betalning avbruten',
          message: 'Du avbröt betalningen. Du kan försöka igen när som helst.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Betalningsfel',
          message: 'Ett fel uppstod under betalningen. Vänligen försök igen eller kontakta support.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
        };
      default:
        return {
          icon: ClockIcon,
          title: 'Bearbetar betalning...',
          message: 'Din betalning behandlas. Detta kan ta några minuter.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-md w-full mx-4
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-lg shadow-lg p-4
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${className}
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">
            {config.title}
          </h4>
          <p className="text-sm opacity-90">
            {config.message}
          </p>
          
          {paymentResult === 'success' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-xs opacity-75">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                <span>Faktura skickas automatiskt</span>
              </div>
              <div className="flex items-center text-xs opacity-75">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                <span>Tillgång aktiverad omedelbart</span>
              </div>
            </div>
          )}
          
          {paymentResult === 'canceled' && (
            <div className="mt-3">
              <button 
                onClick={() => window.location.reload()}
                className="text-xs underline hover:no-underline"
              >
                Försök betala igen
              </button>
            </div>
          )}
          
          {paymentResult === 'error' && (
            <div className="mt-3 space-y-1">
              <button 
                onClick={() => window.location.reload()}
                className="block text-xs underline hover:no-underline"
              >
                Försök igen
              </button>
              <a 
                href="/contact"
                className="block text-xs underline hover:no-underline"
              >
                Kontakta support
              </a>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Stäng meddelande"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {(paymentResult === 'success' || paymentResult === 'canceled') && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all duration-[10000ms] ease-linear"
              style={{ width: isVisible ? '0%' : '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
