'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { formatAmount } from '@/lib/stripe';

interface PaymentButtonProps {
  courseId?: string;
  companyId?: string;
  amount: number;
  currency?: string;
  courseName?: string;
  planName?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

interface PaymentStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}

export default function PaymentButton({
  courseId,
  companyId,
  amount,
  currency = 'SEK',
  courseName,
  planName,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
}: PaymentButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });

  const handlePayment = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setPaymentStatus({ status: 'processing' });

    try {
      const paymentType = courseId ? 'course' : 'company_plan';
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: paymentType,
          courseId,
          companyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment failed',
      });

      // Reset status after 5 seconds
      setTimeout(() => {
        setPaymentStatus({ status: 'idle' });
      }, 5000);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600 hover:border-primary-700';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 hover:border-gray-400';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700';
      default:
        return 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600 hover:border-primary-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getIcon = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      default:
        return <CreditCardIcon className="w-5 h-5" />;
    }
  };

  const getButtonText = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return 'Bearbetar...';
      case 'success':
        return 'Betalning lyckades';
      case 'error':
        return 'Försök igen';
      default:
        if (courseId && courseName) {
          return `Köp kurs - ${formatAmount(amount * 100, currency)}`;
        } else if (companyId && planName) {
          return `Uppgradera till ${planName} - ${formatAmount(amount * 100, currency)}`;
        }
        return `Betala ${formatAmount(amount * 100, currency)}`;
    }
  };

  const isDisabled = disabled || paymentStatus.status === 'processing' || paymentStatus.status === 'success';

  return (
    <div className="space-y-2">
      <button
        onClick={handlePayment}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center space-x-2 rounded-lg border font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getVariantClasses()}
          ${getSizeClasses()}
          ${className}
        `}
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </button>

      {paymentStatus.message && (
        <div className={`
          text-sm p-2 rounded-lg
          ${paymentStatus.status === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-blue-50 text-blue-700 border border-blue-200'
          }
        `}>
          {paymentStatus.message}
        </div>
      )}

      {/* Payment security info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Säker betalning via Stripe</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Automatisk fakturering via Fortnox</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
          </svg>
          <span>Stöder kort, Klarna, Swish</span>
        </div>
      </div>
    </div>
  );
}
