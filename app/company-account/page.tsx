'use client';

import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const CompanyAccountPage: React.FC = () => {
  const { addItem } = useCart();

  const companyAccount = {
    id: 'company_account',
    type: 'company_account' as const,
    title: 'Företagskonto',
    price: 2995,
    description: 'Komplett företagslösning för att hantera anställda och kurser',
    image: '/images/company-account.jpg'
  };

  const features = [
    {
      icon: UserGroupIcon,
      title: 'Anställdshantering',
      description: 'Bjud in, hantera och övervaka dina anställdas framsteg'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Säkerhet & Compliance',
      description: 'Säkerställ att alla anställda har rätt certifieringar'
    },
    {
      icon: ChartBarIcon,
      title: 'Rapporter & Analys',
      description: 'Få detaljerade rapporter om kursframsteg och slutförande'
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Företagsadministration',
      description: 'Enkel administration av företagsinformation och inställningar'
    }
  ];

  const benefits = [
    'Obegränsat antal anställda',
    'Automatiska påminnelser för förfallna kurser',
    'ID06-certifiering för anställda',
    '24/7 support',
    'Lifetime-åtkomst',
    'Enkel integration med befintliga system'
  ];

  const handleAddToCart = () => {
    addItem(companyAccount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <BuildingOfficeIcon className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Företagskonto
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                Komplett lösning för företag som vill hantera sina anställdas utbildning och certifiering
              </p>
              <div className="text-3xl font-bold mb-8">
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK'
                }).format(companyAccount.price)}
                <span className="text-lg font-normal ml-2">engångsbetalning</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Allt du behöver för att hantera företagsutbildning
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vårt företagskonto ger dig alla verktyg du behöver för att säkerställa att dina anställda har rätt kompetens och certifieringar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fördelar med företagskonto
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Redo att komma igång?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Börja hantera dina anställdas utbildning redan idag
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Lägg till i kundvagn</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              
              <button className="bg-gray-100 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Kontakta oss
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAccountPage;
