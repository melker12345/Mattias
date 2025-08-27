'use client';

import React from 'react';
import { useCart, CartItem } from '@/contexts/CartContext';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const Cart: React.FC = () => {
  const { state, removeItem, closeCart, getTotalPrice, getItemCount } = useCart();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price);
  };

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeCart}
          />
          
          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-6 w-6 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Kundvagn ({getItemCount()})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {state.items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Din kundvagn är tom</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {item.type === 'course' ? 'Kurs' : 'Företagskonto'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Totalt:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Gå till kassan
                </button>
                
                <button
                  onClick={closeCart}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Fortsätt handla
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
