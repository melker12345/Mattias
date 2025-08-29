'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Course {
  id: string
  title: string
  description: string
  price: number
  duration: number
  category: string
}

interface CoursePurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId?: string
  employeeName?: string
  companyId: string
  onPurchaseSuccess: () => void
}

export default function CoursePurchaseModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  companyId,
  onPurchaseSuccess
}: CoursePurchaseModalProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [purchaseType, setPurchaseType] = useState<'individual' | 'bulk'>('individual')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch available courses
  useEffect(() => {
    if (isOpen) {
      fetchCourses()
    }
  }, [isOpen])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()

      if (!response.ok) {
        setError('Ett fel uppstod vid hämtning av kurser')
      } else {
        setCourses(data.courses)
      }
    } catch (error) {
      setError('Ett fel uppstod vid hämtning av kurser')
    }
  }

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handlePurchase = async () => {
    if (selectedCourses.length === 0) {
      setError('Välj minst en kurs att köpa')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/companies/course-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          employeeId: purchaseType === 'individual' ? employeeId : undefined,
          courseIds: selectedCourses,
          purchaseType
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Ett fel uppstod vid köp av kurser')
      } else {
        setSuccess(purchaseType === 'individual' 
          ? `Kurser köpta för ${employeeName}!` 
          : 'Kurser köpta för alla anställda!'
        )
        setSelectedCourses([])
        onPurchaseSuccess()
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (error) {
      setError('Ett fel uppstod vid köp av kurser')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalPrice = () => {
    return selectedCourses.reduce((total, courseId) => {
      const course = courses.find(c => c.id === courseId)
      return total + (course?.price || 0)
    }, 0)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price)
  }

  const getBulkDiscount = () => {
    const totalPrice = calculateTotalPrice()
    const discount = totalPrice * 0.15 // 15% bulk discount
    return discount
  }

  const getFinalPrice = () => {
    const totalPrice = calculateTotalPrice()
    if (purchaseType === 'bulk') {
      return totalPrice - getBulkDiscount()
    }
    return totalPrice
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
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
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Köp kurser
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {purchaseType === 'individual' 
                          ? `Välj kurser för ${employeeName}`
                          : 'Välj kurser för alla anställda'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase Type Selection */}
                <div className="mt-6">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={purchaseType === 'individual'}
                        onChange={(e) => setPurchaseType(e.target.value as 'individual' | 'bulk')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Individuellt köp {employeeName && `för ${employeeName}`}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="bulk"
                        checked={purchaseType === 'bulk'}
                        onChange={(e) => setPurchaseType(e.target.value as 'individual' | 'bulk')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Köp för alla anställda <span className="text-green-600 font-medium">(15% rabatt)</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Course Selection */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Tillgängliga kurser</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedCourses.includes(course.id)
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleCourseToggle(course.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900">{course.title}</h5>
                            <p className="text-xs text-gray-500 mt-1">{course.description}</p>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span>{course.duration} min</span>
                              <span>{course.category}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(course.price)}
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course.id)}
                              onChange={() => handleCourseToggle(course.id)}
                              className="mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                {selectedCourses.length > 0 && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Prisöversikt</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Valda kurser ({selectedCourses.length}):</span>
                        <span>{formatPrice(calculateTotalPrice())}</span>
                      </div>
                      {purchaseType === 'bulk' && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Bulkrabatt (15%):</span>
                          <span>-{formatPrice(getBulkDiscount())}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-medium">
                        <span>Totalt:</span>
                        <span>{formatPrice(getFinalPrice())}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-800">{success}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={isLoading || selectedCourses.length === 0}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Köper...
                    </span>
                  ) : (
                    `Köp kurser - ${formatPrice(getFinalPrice())}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Avbryt
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}



