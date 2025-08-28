'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Question {
  id: string;
  question: string;
  type: string;
  options: string;
  correctAnswer: string;
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'image' | 'text' | 'question';
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  order: number;
  questions?: Question[];
}

interface LessonEditorProps {
  lesson: Lesson;
  onClose: () => void;
  onSave: () => void;
}

export default function LessonEditor({ lesson, onClose, onSave }: LessonEditorProps) {
  const [formData, setFormData] = useState({
    title: lesson.title,
    content: lesson.content || '',
    videoUrl: lesson.videoUrl || '',
    imageUrl: lesson.imageUrl || '',
    questionOptions: ['', '', '', ''],
    correctAnswer: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [questionData, setQuestionData] = useState<Question | null>(null);

  // Fetch question data if this is a question lesson
  useEffect(() => {
    if (lesson.type === 'question' && lesson.id) {
      fetchQuestionData();
    }
  }, [lesson.id, lesson.type]);

  const fetchQuestionData = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${lesson.id.split('_')[0]}/lessons/${lesson.id}/questions`);
      if (response.ok) {
        const questions = await response.json();
        if (questions.length > 0) {
          const question = questions[0];
          setQuestionData(question);
          setFormData(prev => ({
            ...prev,
            content: question.question,
            questionOptions: JSON.parse(question.options),
            correctAnswer: JSON.parse(question.correctAnswer)
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching question data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Titel är obligatorisk');
      return;
    }

    // Validate question data if it's a question lesson
    if (lesson.type === 'question') {
      if (!formData.content) {
        alert('Frågetext är obligatorisk');
        return;
      }
      if (!formData.questionOptions.every(option => option.trim())) {
        alert('Alla svarsalternativ måste fyllas i');
        return;
      }
    }

    setIsSaving(true);
    try {
      // Save lesson data
      const lessonResponse = await fetch(`/api/admin/courses/${lesson.id.split('_')[0]}/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...lesson,
          ...formData
        }),
      });

      if (!lessonResponse.ok) {
        const error = await lessonResponse.json();
        alert(error.message || 'Ett fel uppstod vid sparande av lektion');
        return;
      }

      // Save question data if it's a question lesson
      if (lesson.type === 'question' && questionData) {
        const questionResponse = await fetch(`/api/admin/courses/${lesson.id.split('_')[0]}/lessons/${lesson.id}/questions/${questionData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: formData.content,
            type: 'multiple_choice',
            options: JSON.stringify(formData.questionOptions),
            correctAnswer: JSON.stringify(formData.correctAnswer)
          }),
        });

        if (!questionResponse.ok) {
          const error = await questionResponse.json();
          alert(error.message || 'Ett fel uppstod vid sparande av fråga');
          return;
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Ett fel uppstod vid sparande av lektion');
    } finally {
      setIsSaving(false);
    }
  };

  const renderFormFields = () => {
    switch (lesson.type) {
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
              rows={8}
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

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'image':
        return 'Bild';
      case 'text':
        return 'Text';
      case 'question':
        return 'Fråga';
      default:
        return type;
    }
  };

  return (
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
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Redigera {getContentTypeLabel(lesson.type)}
              </h2>
              <p className="text-sm text-gray-600">{lesson.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  'Spara ändringar'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
