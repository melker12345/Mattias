'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface APVSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: APVSubmissionData) => Promise<void>;
  course: {
    id: string;
    title: string;
    passingScore: number;
  };
  userScore: number;
  isSubmitting: boolean;
}

interface APVSubmissionData {
  fullName: string;
  personalNumber: string;
  address: string;
  postalCode: string;
  city: string;
  phone?: string;
  courseId: string;
  finalScore: number;
  passingScore: number;
}

export default function APVSubmissionModal({
  isOpen,
  onClose,
  onSubmit,
  course,
  userScore,
  isSubmitting
}: APVSubmissionModalProps) {
  const [formData, setFormData] = useState<APVSubmissionData>({
    fullName: '',
    personalNumber: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    courseId: course.id,
    finalScore: userScore,
    passingScore: course.passingScore
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSworn, setHasSworn] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Fullständigt namn krävs';
    }

    if (!formData.personalNumber.trim()) {
      newErrors.personalNumber = 'Personnummer krävs';
    } else if (!/^\d{12}$/.test(formData.personalNumber.replace(/[-\s]/g, ''))) {
      newErrors.personalNumber = 'Personnummer måste vara i formatet ÅÅÅÅMMDD-XXXX';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Adress krävs';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postnummer krävs';
    } else if (!/^\d{5}$/.test(formData.postalCode.replace(/\s/g, ''))) {
      newErrors.postalCode = 'Postnummer måste vara 5 siffror';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Ort krävs';
    }

    if (!hasSworn) {
      newErrors.sworn = 'Du måste svära på heder och samvete';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting APV:', error);
    }
  };

  const formatPersonalNumber = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length <= 8) {
      return cleaned;
    }
    return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}`;
  };

  const handlePersonalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPersonalNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      personalNumber: formatted
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-white mr-3" />
                    <h3 className="text-lg font-semibold text-white">
                      APV Submission - {course.title}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        Grattis! Du har slutfört kursen med {userScore}% rätt svar
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      Godkänd poäng: {course.passingScore}%
                    </p>
                  </div>

                  <p className="text-gray-700 mb-4">
                    För att få ditt certifikat registrerat i ID06-systemet behöver du fylla i följande information 
                    och svära på heder och samvete att du har slutfört kursen.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Fullständigt namn *
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Förnamn Efternamn"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="personalNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Personnummer *
                      </label>
                      <input
                        type="text"
                        id="personalNumber"
                        name="personalNumber"
                        value={formData.personalNumber}
                        onChange={handlePersonalNumberChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.personalNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="ÅÅÅÅMMDD-XXXX"
                        maxLength={13}
                      />
                      {errors.personalNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.personalNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Adress *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Gatuadress"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="123 45"
                        maxLength={6}
                      />
                      {errors.postalCode && (
                        <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        Ort *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Stockholm"
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon (valfritt)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="070-123 45 67"
                    />
                  </div>

                  {/* Oath Section */}
                  <div className="border-t pt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-yellow-800 font-medium mb-2">
                            Svära på heder och samvete
                          </h4>
                          <p className="text-yellow-700 text-sm mb-3">
                            Jag, {formData.fullName || '[Ditt namn]'}, svär på heder och samvete att:
                          </p>
                          <ul className="text-yellow-700 text-sm space-y-1 mb-3">
                            <li>• Jag har slutfört kursen &quot;{course.title}&quot;</li>
                            <li>• Jag har fått godkänt resultat ({userScore}%)</li>
                            <li>• All information jag angett är korrekt</li>
                            <li>• Jag förstår att falska uppgifter kan leda till återkallande av certifikat</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          id="sworn"
                          checked={hasSworn}
                          onChange={(e) => setHasSworn(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="sworn" className="ml-2 text-sm text-yellow-800">
                          Jag svär på heder och samvete att ovanstående är sant
                        </label>
                      </div>
                      {errors.sworn && (
                        <p className="mt-1 text-sm text-red-600">{errors.sworn}</p>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Skickar...' : 'Skicka APV Submission'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
