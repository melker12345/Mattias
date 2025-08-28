'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Course {
  id?: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  isPublished?: boolean;
  passingScore?: number;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  onSave: (course: Course) => void;
  isSaving: boolean;
}

const categories = [
  { id: 'arbete-pa-vag', name: 'Arbete på Väg' },
  { id: 'sakerhet-miljo', name: 'Säkerhet & Miljö' },
  { id: 'kompetensutveckling', name: 'Kompetensutveckling' },
];

export default function CourseModal({ isOpen, onClose, course, onSave, isSaving }: CourseModalProps) {
  const [formData, setFormData] = useState<Course>({
    title: '',
    description: '',
    price: 0,
    duration: 0,
    category: '',
    image: '',
    isPublished: false,
    passingScore: 80
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({
        title: '',
        description: '',
        price: 0,
        duration: 0,
        category: '',
        image: '',
        isPublished: false,
        passingScore: 80
      });
    }
    setErrors({});
  }, [course, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel är obligatorisk';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Beskrivning är obligatorisk';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Pris måste vara större än 0';
    }
    if (formData.duration <= 0) {
      newErrors.duration = 'Varaktighet måste vara större än 0';
    }
    if (!formData.category) {
      newErrors.category = 'Kategori är obligatorisk';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {course ? 'Redigera Kurs' : 'Skapa Ny Kurs'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Kursnamn *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="Ange kursnamn"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivning *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Beskriv kursen..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Price and Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Pris (SEK) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`input-field ${errors.price ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                      Varaktighet (minuter) *
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="1"
                      className={`input-field ${errors.duration ? 'border-red-500' : ''}`}
                      placeholder="120"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                    )}
                  </div>
                </div>

                {/* Passing Score */}
                <div>
                  <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-2">
                    Godkänd poäng (%) *
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      type="number"
                      id="passingScore"
                      name="passingScore"
                      value={formData.passingScore}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className={`input-field w-full sm:w-24 ${errors.passingScore ? 'border-red-500' : ''}`}
                      placeholder="80"
                    />
                    <span className="text-sm text-gray-500">% av totala frågor</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Användaren måste få minst denna procent av frågorna rätt för att godkänna kursen
                  </p>
                  {errors.passingScore && (
                    <p className="mt-1 text-sm text-red-600">{errors.passingScore}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">Välj kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                    Bild URL (valfritt)
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Published Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                    Publicera kursen (gör den tillgänglig för köp)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sparar...
                      </>
                    ) : (
                      course ? 'Uppdatera Kurs' : 'Skapa Kurs'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
