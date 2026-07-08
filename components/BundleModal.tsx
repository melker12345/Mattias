'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { AdminBundle, AdminCourse } from '@/lib/types/admin';
import { formatPrice } from '@/lib/types/admin';

export interface BundleFormData {
  title: string;
  description: string;
  price: number;
  image?: string;
  isPublished: boolean;
  courseIds: string[];
}

interface BundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle?: AdminBundle | null;
  courses: AdminCourse[];
  onSave: (bundle: BundleFormData) => void;
  isSaving: boolean;
}

const emptyForm: BundleFormData = {
  title: '',
  description: '',
  price: 0,
  image: '',
  isPublished: false,
  courseIds: [],
};

export default function BundleModal({ isOpen, onClose, bundle, courses, onSave, isSaving }: BundleModalProps) {
  const [formData, setFormData] = useState<BundleFormData>(emptyForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (bundle) {
      setFormData({
        title: bundle.title,
        description: bundle.description,
        price: bundle.price,
        image: bundle.image ?? '',
        isPublished: bundle.isPublished,
        courseIds: bundle.courses.map((c) => c.id),
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [bundle, isOpen]);

  const toggleCourse = (courseId: string) => {
    setFormData((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
    if (errors.courseIds) setErrors((prev) => ({ ...prev, courseIds: '' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title.trim()) newErrors.title = 'Titel är obligatorisk';
    if (Number(formData.price) <= 0) newErrors.price = 'Pris måste vara större än 0';
    if (formData.courseIds.length < 2) newErrors.courseIds = 'Välj minst två kurser';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSave({ ...formData, price: Number(formData.price) });
  };

  // Sum of the selected courses' individual prices — helps the admin price the
  // bundle and shows the customer's saving.
  const selectedTotal = courses
    .filter((c) => formData.courseIds.includes(c.id))
    .reduce((sum, c) => sum + Number(c.price), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {bundle ? 'Redigera Paket' : 'Skapa Paket'}
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Paketnamn *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="t.ex. APV-paket 1.1–1.3"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivning
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="Beskriv paketet..."
                  />
                </div>

                {/* Course selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kurser i paketet *
                  </label>
                  <div className={`border rounded-lg divide-y max-h-64 overflow-y-auto ${errors.courseIds ? 'border-red-500' : 'border-gray-200'}`}>
                    {courses.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">Inga kurser tillgängliga</p>
                    ) : (
                      courses.map((course) => (
                        <label key={course.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.courseIds.includes(course.id)}
                            onChange={() => toggleCourse(course.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="flex-1 text-sm text-gray-900">{course.title}</span>
                          <span className="text-sm text-gray-500">{formatPrice(course.price)}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {errors.courseIds && <p className="mt-1 text-sm text-red-600">{errors.courseIds}</p>}
                  {formData.courseIds.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      {formData.courseIds.length} kurser valda · ordinarie pris {formatPrice(selectedTotal)}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Paketpris (SEK) *
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
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                  {formData.courseIds.length > 0 && Number(formData.price) > 0 && Number(formData.price) < selectedTotal && (
                    <p className="mt-1 text-sm text-green-600">
                      Kunden sparar {formatPrice(selectedTotal - Number(formData.price))}
                    </p>
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

                {/* Published */}
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
                    Publicera paketet (gör det tillgängligt för köp)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>
                    Avbryt
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sparar...
                      </>
                    ) : (
                      bundle ? 'Uppdatera Paket' : 'Skapa Paket'
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
