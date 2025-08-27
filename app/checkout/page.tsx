'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  organizationNumber: string;
  address: string;
  city: string;
  postalCode: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
  cardholderName: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

export default function CheckoutPage() {
  const { state, clearCart, getTotalPrice, isLoaded } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    organizationNumber: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cardholderName: '',
    acceptTerms: false,
    acceptMarketing: false
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // TODO: Implement actual payment processing here
    console.log('Processing payment for:', state.items);
    console.log('Form data:', formData);

    setIsProcessing(false);
    setIsSuccess(true);
    clearCart();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };



  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar kundvagn...</p>
        </div>
      </div>
    );
  }

  if (state.items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Din kundvagn är tom</h1>
          <p className="text-gray-600 mb-8">Lägg till produkter i din kundvagn för att fortsätta.</p>
          <Link href="/courses" className="btn-primary">
            Bläddra kurser
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tack för din beställning!</h1>
          <p className="text-gray-600 mb-8">
            Din betalning har behandlats framgångsrikt. Du kommer att få en bekräftelse via e-post inom kort.
          </p>
          <div className="space-y-3">
            <Link href="/dashboard" className="btn-primary w-full">
              Gå till dashboard
            </Link>
            <Link href="/courses" className="btn-secondary w-full">
              Fortsätt handla
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Tillbaka till startsidan
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Kassa</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6 sticky top-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Din beställning</h2>
              
              <div className="space-y-4 mb-6">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.type === 'course' ? 'Kurs' : 'Företagskonto'}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(item.price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Totalt</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Inklusive moms
                </p>
              </div>
            </motion.div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Kontaktinformation
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Förnamn *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Efternamn *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-postadress *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefonnummer *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  Företagsinformation
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Företagsnamn *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="organizationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Organisationsnummer *
                    </label>
                    <input
                      type="text"
                      id="organizationNumber"
                      name="organizationNumber"
                      value={formData.organizationNumber}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="123456-7890"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Adress *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Stad *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postnummer *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Betalningsinformation
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 mb-1">
                      Kortinnehavare *
                    </label>
                    <input
                      type="text"
                      id="cardholderName"
                      name="cardholderName"
                      value={formData.cardholderName}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Kortnummer *
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value);
                        setFormData(prev => ({ ...prev, cardNumber: formatted }));
                      }}
                      required
                      className="input-field"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                        Utgångsdatum *
                      </label>
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={(e) => {
                          const formatted = formatExpiry(e.target.value);
                          setFormData(prev => ({ ...prev, cardExpiry: formatted }));
                        }}
                        required
                        className="input-field"
                        placeholder="MM/ÅÅ"
                        maxLength={5}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cardCVC" className="block text-sm font-medium text-gray-700 mb-1">
                        CVC *
                      </label>
                      <input
                        type="text"
                        id="cardCVC"
                        name="cardCVC"
                        value={formData.cardCVC}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                      Jag accepterar <a href="/terms" className="text-primary-600 hover:text-primary-500">användarvillkoren</a> och <a href="/privacy" className="text-primary-600 hover:text-primary-500">integritetspolicyn</a> *
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="acceptMarketing"
                      name="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptMarketing" className="ml-2 text-sm text-gray-700">
                      Jag vill få e-post om nya kurser och erbjudanden
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  type="submit"
                  disabled={isProcessing || !formData.acceptTerms}
                  className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Bearbetar betalning...
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-5 w-5 mr-2" />
                      Betala {formatPrice(getTotalPrice())}
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Din betalning är säker och krypterad
                </p>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}
