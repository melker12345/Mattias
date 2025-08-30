'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCart } from '@/contexts/CartContext'

export function Navigation() {
  const { data: session } = useSession()
  const { toggleCart, getItemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const navigation = [
    { name: 'Hem', href: '/' },
    { name: 'Kurser', href: '/courses' },
    { name: 'Företagskonto', href: '/company-account' },
    { name: 'Om Oss', href: '/about' },
    { name: 'Kontakt', href: '/contact' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Check if scrolled
      setIsScrolled(currentScrollY > 10)
      
      // Show/hide navigation based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navigation
        setIsVisible(false)
      } else {
        // Scrolling up - show navigation
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <Disclosure as="nav" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    } ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-soft border-b border-gray-200' 
        : 'bg-transparent'
    }`}>
      {({ open }) => (
        <>
          <div className="mn-container">
            <div className="flex justify-between items-center h-20">
              {/* Left Side - Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center group">
                  <img 
                    src={isScrolled ? "/logos/MN_Utbildning.png" : "/logos/MN_Utbildning-dark.jpeg"}
                    alt="MN Utbildning Logo" 
                    className="h-16 w-auto transition-all duration-300 group-hover:scale-105"
                  />
                </Link>
              </div>
              
              {/* Center - Navigation Links */}
              <div className="hidden lg:flex lg:items-center lg:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 font-open-sans hover:bg-white/10 relative group ${
                      isScrolled ? 'text-primary-700 hover:text-primary-600' : 'text-white hover:text-white/90'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-0 left-1/2 w-0 h-0.5 transition-all duration-300 group-hover:w-full group-hover:left-0 ${
                      isScrolled ? 'bg-gradient-to-r from-accent-500 to-warning-500' : 'bg-white'
                    }`}></span>
                  </Link>
                ))}
              </div>
              
              {/* Right Side - Actions */}
              <div className="flex items-center space-x-3">
                {/* Cart Button */}
                <button
                  onClick={toggleCart}
                  className={`relative p-2 rounded-lg transition-all duration-200 group ${
                    isScrolled 
                      ? 'text-primary-700 hover:text-primary-600 hover:bg-primary-50' 
                      : 'text-white hover:text-white/90 hover:bg-white/10'
                  }`}
                >
                  <ShoppingCartIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-medium animate-pulse">
                      {getItemCount()}
                    </span>
                  )}
                </button>
                
                {session ? (
                  <Menu as="div" className="relative">
                    <div>
                      <Menu.Button className={`rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 p-2 transition-all duration-200 ${
                        isScrolled 
                          ? 'bg-primary-50 hover:bg-primary-100 focus:ring-primary-500' 
                          : 'bg-white/10 hover:bg-white/20 focus:ring-white'
                      }`}>
                        <span className="sr-only">Öppna användarmenyn</span>
                        <UserCircleIcon className={`h-6 w-6 ${
                          isScrolled ? 'text-primary-700' : 'text-white'
                        }`} />
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-150"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-strong py-2 z-50 border border-gray-200">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={`${
                                active ? 'bg-primary-50 text-primary-700' : 'text-primary-700'
                              } block px-4 py-3 text-sm font-open-sans transition-colors duration-200`}
                            >
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => signOut()}
                              className={`${
                                active ? 'bg-error-50 text-error-700' : 'text-error-600'
                              } block w-full text-left px-4 py-3 text-sm font-open-sans transition-colors duration-200`}
                            >
                              Logga ut
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/auth/signin"
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 border text-sm ${
                        isScrolled 
                          ? 'bg-accent-50 text-accent-700 hover:bg-accent-100 border-accent-200 hover:border-accent-300' 
                          : 'bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-primary-700 border-white/30'
                      }`}
                    >
                      Logga in
                    </Link>
                    
                    <div className="relative group">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
                        isScrolled 
                          ? 'bg-gradient-primary text-white hover:shadow-medium' 
                          : 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-primary-700'
                      }`}>
                        Registrera
                      </button>
                      <div className={`absolute right-0 mt-2 w-48 rounded-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border ${
                        isScrolled ? 'bg-white shadow-strong border-gray-200' : 'bg-white/10 backdrop-blur-md border-white/20'
                      }`}>
                        <Link
                          href="/auth/signup"
                          className={`block px-4 py-3 text-sm font-open-sans transition-colors duration-200 ${
                            isScrolled ? 'text-primary-700 hover:bg-primary-50' : 'text-white hover:bg-white/10'
                          }`}
                        >
                          Privatperson
                        </Link>
                        <Link
                          href="/register/company"
                          className={`block px-4 py-3 text-sm font-open-sans transition-colors duration-200 ${
                            isScrolled ? 'text-primary-700 hover:bg-primary-50' : 'text-white hover:bg-white/10'
                          }`}
                        >
                          Företag
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mobile menu button */}
                <div className="lg:hidden">
                  <Disclosure.Button className={`inline-flex items-center justify-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset transition-all duration-200 ${
                    isScrolled 
                      ? 'text-primary-700 hover:text-primary-600 hover:bg-primary-50 focus:ring-primary-500' 
                      : 'text-white hover:text-white/90 hover:bg-white/10 focus:ring-white'
                  }`}>
                    <span className="sr-only">Öppna huvudmeny</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 border-t ${
              isScrolled ? 'bg-white border-gray-200' : 'bg-white/10 backdrop-blur-md border-white/20'
            }`}>
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans ${
                    isScrolled 
                      ? 'text-primary-700 hover:text-primary-600 hover:bg-primary-50' 
                      : 'text-white hover:text-white/90 hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              {!session && (
                <>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signup"
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans ${
                      isScrolled 
                        ? 'text-primary-700 hover:text-primary-600 hover:bg-primary-50' 
                        : 'text-white hover:text-white/90 hover:bg-white/10'
                    }`}
                  >
                    Registrera (Privatperson)
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/register/company"
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans ${
                      isScrolled 
                        ? 'text-primary-700 hover:text-primary-600 hover:bg-primary-50' 
                        : 'text-white hover:text-white/90 hover:bg-white/10'
                    }`}
                  >
                    Registrera (Företag)
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signin"
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans ${
                      isScrolled 
                        ? 'text-primary-700 hover:text-primary-600 hover:bg-primary-50' 
                        : 'text-white hover:text-white/90 hover:bg-white/10'
                    }`}
                  >
                    Logga in
                  </Disclosure.Button>
                </>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
