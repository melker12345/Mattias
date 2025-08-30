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
      <section className="relative bg-cover bg-center bg-no-repeat text-white overflow-hidden" style={{
        background: `
          linear-gradient(135deg, #0c283b 0%, #1a3a4f 25%, #27404f 50%, #20313e 75%, #19222d 100%),
          radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.2) 0%, transparent 50%),
          linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%),
          linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)
        `,
        backgroundSize: '100% 100%, 60% 60%, 60% 60%, 40% 40%, 200% 200%, 200% 200%',
        backgroundPosition: 'center, center, center, center, 0% 0%, 100% 100%'
      }}>
        {/* Animated geometric overlay */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-10 left-10 w-16 h-16 sm:w-32 sm:h-32 border border-white/20 rounded-full"></div>
            <div className="absolute top-20 right-20 w-12 h-12 sm:w-24 sm:h-24 border border-white/15 rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-20 h-20 sm:w-40 sm:h-40 border border-white/10 rounded-full"></div>
            <div className="absolute bottom-10 right-1/3 w-8 h-8 sm:w-16 sm:h-16 border border-white/25 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-20 sm:h-20 border border-white/20 rotate-45"></div>
          </div>
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-20 h-20 sm:w-40 sm:h-40 bg-accent-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-30 h-30 sm:w-60 sm:h-60 bg-success-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 sm:w-32 sm:h-32 bg-warning-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-12 h-12 sm:w-24 sm:h-24 bg-primary-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="relative z-10">
          <div className="mn-container py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="text-center px-4 sm:px-0 sm:mt-8">
             
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-6 sm:mb-6 md:mb-8"
              >
                <BuildingOfficeIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-accent-400" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-montserrat leading-tight">
                  Företagskonto
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-lg sm:text-xl md:text-2xl mb-10 sm:my-16 md:mb-12 max-w-4xl mx-auto text-white font-open-sans leading-relaxed px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Komplett lösning för företag som vill hantera sina anställdas utbildning och certifiering med <span className="text-accent-300 font-semibold">ID06-certifiering</span> och BankID-verifiering.
              </motion.p>
              
              <motion.div 
                className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 font-montserrat text-accent-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {new Intl.NumberFormat('sv-SE', {
                  style: 'currency',
                  currency: 'SEK'
                }).format(companyAccount.price)}
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8 sm:mb-12 md:mb-16 px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <button
                  onClick={handleAddToCart}
                  className="group bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans shadow-medium hover:shadow-strong transform hover:scale-105 border border-accent-400/30 text-sm sm:text-base"
                >
                  <span className="flex items-center justify-center">
                    Lägg till i kundvagn
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                <button className="group bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans hover:shadow-medium transform hover:scale-105 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Kontakta oss
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

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
