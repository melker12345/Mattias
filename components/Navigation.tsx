'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSupabaseAuth } from '@/app/providers'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCart } from '@/contexts/CartContext'


export function Navigation() {
  const { user, signOut } = useSupabaseAuth()
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
    } bg-[#18374c] shadow-soft border-b border-[#18374c]/20`}>
      {({ open }) => (
        <>
          <div className="mn-container">
            <div className="flex justify-between items-center h-16 sm:h-20">
              {/* Left Side - Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center group">
                  <img 
                    src="/logos/MN_Utbildning.png"
                    alt="MN Utbildning Logo" 
                    className="h-10 sm:h-16 w-auto transition-all duration-300 group-hover:scale-105"
                  />
                </Link>
              </div>
              
              {/* Center - Navigation Links */}
              <div className="hidden lg:flex lg:items-center lg:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 font-open-sans hover:bg-white/10 relative group text-white hover:text-white/90"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 transition-all duration-300 group-hover:w-full group-hover:left-0 bg-white"></span>
                  </Link>
                ))}
              </div>
              
              {/* Right Side - Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Cart Button */}
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-lg transition-all duration-200 group text-white hover:text-white/90 hover:bg-white/10"
                >
                  <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform duration-200" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-medium animate-pulse">
                      {getItemCount()}
                    </span>
                  )}
                </button>
                
                {user ? (
                  <Menu as="div" className="relative">
                    <div>
                      <Menu.Button className="rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 p-2 transition-all duration-200 bg-white/10 hover:bg-white/20 focus:ring-white">
                        <span className="sr-only">Öppna användarmenyn</span>
                        <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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
                      <Menu.Items className="absolute right-0 mt-3 w-48 bg-[#18374c] rounded-xl shadow-strong py-2 z-50 border border-[#18374c]/20">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={`${
                                active ? 'bg-white/10 text-white' : 'text-white'
                              } block px-4 py-3 text-sm font-open-sans transition-colors duration-200`}
                            >
                              Dashboard
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={`${
                                active ? 'bg-white/10 text-white' : 'text-white'
                              } block px-4 py-3 text-sm font-open-sans transition-colors duration-200`}
                            >
                              Min Profil
                            </Link>
                          )}
                        </Menu.Item>
                        {(user as any)?.role === 'ADMIN' && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/admin"
                                className={`${
                                  active ? 'bg-white/10 text-white' : 'text-white'
                                } block px-4 py-3 text-sm font-open-sans transition-colors duration-200`}
                              >
                                Admin Panel
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => signOut()}
                              className={`${
                                active ? 'bg-red-500/20 text-red-300' : 'text-red-300'
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
                  <div className="hidden sm:flex items-center space-x-2">
                    <Link
                      href="/auth/signin"
                      className="px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 border text-sm bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-primary-700 border-white/30"
                    >
                      Logga in
                    </Link>
                    
                    <div className="relative group">
                      <button className="px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-primary-700">
                        Registrera
                      </button>
                      <div className="absolute right-0 mt-2 w-48 rounded-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 border bg-[#18374c] border-[#18374c]/20">
                        <Link
                          href="/auth/signup"
                          className="block px-4 py-3 text-sm font-open-sans transition-colors duration-200 text-white hover:bg-white/10"
                        >
                          Privatperson
                        </Link>
                        <Link
                          href="/register/company"
                          className="block px-4 py-3 text-sm font-open-sans transition-colors duration-200 text-white hover:bg-white/10"
                        >
                          Företag
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mobile menu button */}
                <div className="lg:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset transition-all duration-200 text-white hover:text-white/90 hover:bg-white/10 focus:ring-white">
                    <span className="sr-only">Öppna huvudmeny</span>
                    {open ? (
                      <XMarkIcon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden">
            <div className="px-4 pt-4 pb-6 space-y-2 border-t bg-[#18374c] border-white/20">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className="block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans text-white hover:text-white/90 hover:bg-white/10"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              
              {/* Mobile menu items for logged in users */}
              {user && (
                <div className="pt-4 space-y-3 border-t border-white/20">
                  {(user as any)?.role === 'ADMIN' && (
                    <Disclosure.Button
                      as={Link}
                      href="/admin"
                      className="block w-full px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans text-center bg-white/20 text-white hover:bg-white hover:text-primary-700 border border-white/30"
                    >
                      Admin Panel
                    </Disclosure.Button>
                  )}
                </div>
              )}

              {/* Mobile auth buttons */}
              {!user && (
                <div className="pt-4 space-y-3 border-t border-white/20">
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signin"
                    className="block w-full px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans text-center bg-white/20 text-white hover:bg-white hover:text-primary-700 border border-white/30"
                  >
                    Logga in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signup"
                    className="block w-full px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans text-center bg-white/20 text-white hover:bg-white hover:text-primary-700 border border-white/30"
                  >
                    Registrera (Privatperson)
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/register/company"
                    className="block w-full px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 font-open-sans text-center bg-white/20 text-white hover:bg-white hover:text-primary-700 border border-white/30"
                  >
                    Registrera (Företag)
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
