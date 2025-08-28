'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlayIcon, PhotoIcon, DocumentTextIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contentData: any) => void;
}

const contentTypes = [
  {
    id: 'video',
    name: 'Video',
    description: 'Lägg till en videolektion',
    icon: PlayIcon,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'image',
    name: 'Bild',
    description: 'Lägg till en bild med beskrivning',
    icon: PhotoIcon,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Lägg till textinnehåll',
    icon: DocumentTextIcon,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'question',
    name: 'Fråga',
    description: 'Lägg till en quizfråga',
    icon: QuestionMarkCircleIcon,
    color: 'bg-orange-100 text-orange-600'
  }
];

export default function AddContentModal({ isOpen, onClose, onAdd }: AddContentModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    videoUrl: '',
    imageUrl: '',
    questionOptions: ['', '', '', ''],
    correctAnswer: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !formData.title) {
      alert('Välj typ och ange titel');
      return;
    }

    const contentData = {
      title: formData.title,
      type: selectedType,
      content: formData.content || null,
      videoUrl: formData.videoUrl || null,
      imageUrl: formData.imageUrl || null,
      questionOptions: selectedType === 'question' ? formData.questionOptions : null,
      correctAnswer: selectedType === 'question' ? formData.correctAnswer : null
    };

    onAdd(contentData);
    resetForm();
  };

  const resetForm = () => {
    setSelectedType(null);
    setFormData({
      title: '',
      content: '',
      videoUrl: '',
      imageUrl: '',
      questionOptions: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderFormFields = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL *
              </label>
              <input
                type="url"
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="input-field"
                placeholder="https://example.com/video.mp4"
                required
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivning (valfritt)
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className="input-field"
                placeholder="Beskriv videon..."
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Bild URL *
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="input-field"
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivning (valfritt)
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className="input-field"
                placeholder="Beskriv bilden..."
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Innehåll *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              className="input-field"
              placeholder="Skriv ditt innehåll här..."
              required
            />
          </div>
        );

      case 'question':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Fråga *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className="input-field"
                placeholder="Ställ din fråga här..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Svarsalternativ *
              </label>
              <div className="space-y-3">
                {formData.questionOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="correctAnswer"
                      id={`option-${index}`}
                      checked={formData.correctAnswer === index}
                      onChange={() => setFormData(prev => ({ ...prev, correctAnswer: index }))}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor={`option-${index}`} className="text-sm font-medium text-gray-700">
                      Alternativ {index + 1}:
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.questionOptions];
                        newOptions[index] = e.target.value;
                        setFormData(prev => ({ ...prev, questionOptions: newOptions }));
                      }}
                      className="flex-1 input-field"
                      placeholder={`Alternativ ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Välj det korrekta svaret genom att klicka på radioknappen bredvid alternativet.
              </p>
            </div>
          </div>
        );

      default:
        return null;
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
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Lägg till innehåll
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {!selectedType ? (
                  // Content Type Selection
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Välj innehållstyp
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contentTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${type.color}`}>
                              <type.icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{type.name}</h4>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Content Form
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Titel *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="input-field"
                        placeholder="Ange titel för innehållet"
                        required
                      />
                    </div>

                    {renderFormFields()}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSelectedType(null)}
                        className="btn-secondary"
                      >
                        Tillbaka
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                      >
                        Lägg till innehåll
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
