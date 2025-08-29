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
    <div className="min-h-screen bg-mn-very-light-gray">
      {/* Hero Section */}
      <div className="relative bg-cover bg-center bg-no-repeat text-mn-white" style={{ backgroundImage: 'url(/13107746_5134336.jpg)' }}>
        <div className="absolute inset-0 bg-mn-dark-blue-green/60"></div>
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <BuildingOfficeIcon className="h-16 w-16 mx-auto mb-6 text-mn-light-gray-blue" />
                <h1 className="text-4xl md:text-5xl font-bold mb-6 font-montserrat">
                  Företagskonto
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-open-sans">
                  Komplett lösning för företag som vill hantera sina anställdas utbildning och certifiering
                </p>
                <div className="text-3xl font-bold mb-8 font-montserrat">
                  {new Intl.NumberFormat('sv-SE', {
                    style: 'currency',
                    currency: 'SEK'
                  }).format(companyAccount.price)}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-mn-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
              Allt du behöver för att hantera företagsutbildning
            </h2>
            <p className="text-lg text-mn-dark-blue-green max-w-2xl mx-auto font-open-sans">
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
                <div className="bg-mn-light-gray-blue rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-mn-dark-blue-green" />
                </div>
                <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-2 font-montserrat">
                  {feature.title}
                </h3>
                <p className="text-mn-dark-blue-green font-open-sans">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-mn-very-light-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
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
                <CheckCircleIcon className="h-6 w-6 text-mn-dark-blue-green mt-0.5 flex-shrink-0" />
                <span className="text-mn-dark-blue-green font-open-sans">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-mn-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
              Redo att komma igång?
            </h2>
            <p className="text-lg text-mn-dark-blue-green mb-8 font-open-sans">
              Börja hantera dina anställdas utbildning redan idag
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleAddToCart}
                className="bg-mn-dark-blue-green text-mn-white px-8 py-4 rounded-lg font-semibold hover:bg-mn-dark-blue-green/90 transition-colors flex items-center justify-center space-x-2 font-open-sans"
              >
                <span>Lägg till i kundvagn</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              
              <button className="bg-mn-light-gray-blue text-mn-dark-blue-green px-8 py-4 rounded-lg font-semibold hover:bg-mn-light-gray-blue/80 transition-colors font-open-sans">
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
