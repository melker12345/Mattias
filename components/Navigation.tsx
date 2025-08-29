'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCart } from '@/contexts/CartContext'

export function Navigation() {
  const { data: session } = useSession()
  const { toggleCart, getItemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: 'Hem', href: '/' },
    { name: 'Kurser', href: '/courses' },
    { name: 'Företagskonto', href: '/company-account' },
    { name: 'Om Oss', href: '/about' },
    { name: 'Kontakt', href: '/contact' },
  ]

  return (
    <Disclosure as="nav" className="bg-mn-white shadow-lg sticky top-0 z-50 border-b border-mn-light-gray-blue">
      {({ open }) => (
        <>
          <div className="mn-container">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center">
                  <img 
                    src="/logos/MN_Utbildning.png" 
                    alt="MN Utbildning Logo" 
                    className="h-16 w-auto"
                  />
                </Link>
              </div>
              
              {/* Center Navigation Links and Registrera Button */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                  >
                    {item.name}
                  </Link>
                ))}
                {!session && (
                  <div className="relative group">
                    <button className="btn-primary">
                      Registrera
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-mn-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-mn-light-gray-blue">
                      <Link
                        href="/auth/signup"
                        className="block px-4 py-2 text-sm text-mn-dark-blue-green hover:bg-mn-very-light-gray font-open-sans"
                      >
                        Privatperson
                      </Link>
                      <Link
                        href="/register/company"
                        className="block px-4 py-2 text-sm text-mn-dark-blue-green hover:bg-mn-very-light-gray font-open-sans"
                      >
                        Företag
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right Side - Cart and User Menu */}
              <div className="hidden sm:flex sm:items-center space-x-4">
                {/* Cart Button */}
                <button
                  onClick={toggleCart}
                  className="relative p-2 text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-mn-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-open-sans">
                      {getItemCount()}
                    </span>
                  )}
                </button>
                
                {session ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="bg-mn-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mn-dark-blue-green">
                        <span className="sr-only">Öppna användarmenyn</span>
                        <UserCircleIcon className="h-8 w-8 text-mn-dark-blue-green" />
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-mn-white ring-1 ring-mn-light-gray-blue focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={(session?.user as any)?.role === 'COMPANY_ADMIN' ? '/dashboard/company' : '/dashboard'}
                              className={`${
                                active ? 'bg-mn-very-light-gray' : ''
                              } block px-4 py-2 text-sm text-mn-dark-blue-green font-open-sans`}
                            >
                              {(session?.user as any)?.role === 'COMPANY_ADMIN' ? 'Företagsdashboard' : 'Mina Kurser'}
                            </Link>
                          )}
                        </Menu.Item>
                        {(session?.user as any)?.role === 'ADMIN' && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/admin"
                                className={`${
                                  active ? 'bg-mn-very-light-gray' : ''
                                } block px-4 py-2 text-sm text-mn-dark-blue-green font-open-sans`}
                              >
                                Admin Panel
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={`${
                                active ? 'bg-mn-very-light-gray' : ''
                              } block px-4 py-2 text-sm text-mn-dark-blue-green font-open-sans`}
                            >
                              Profil
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => signOut()}
                              className={`${
                                active ? 'bg-mn-very-light-gray' : ''
                              } block w-full text-left px-4 py-2 text-sm text-mn-dark-blue-green font-open-sans`}
                            >
                              Logga ut
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      href="/auth/signin"
                      className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                    >
                      Logga in
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="-mr-2 flex items-center sm:hidden space-x-2">
                {/* Mobile Cart Button */}
                <button
                  onClick={toggleCart}
                  className="relative p-2 text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-mn-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-open-sans">
                      {getItemCount()}
                    </span>
                  )}
                </button>
                
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 hover:bg-mn-very-light-gray focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mn-dark-blue-green">
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

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-mn-light-gray-blue">
              {session ? (
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href={(session?.user as any)?.role === 'COMPANY_ADMIN' ? '/dashboard/company' : '/dashboard'}
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                  >
                    {(session?.user as any)?.role === 'COMPANY_ADMIN' ? 'Företagsdashboard' : 'Mina Kurser'}
                  </Disclosure.Button>
                  {(session?.user as any)?.role === 'ADMIN' && (
                    <Disclosure.Button
                      as={Link}
                      href="/admin"
                      className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                    >
                      Admin Panel
                    </Disclosure.Button>
                  )}
                  <Disclosure.Button
                    as={Link}
                    href="/profile"
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                  >
                    Profil
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={() => signOut()}
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                  >
                    Logga ut
                  </Disclosure.Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signin"
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                  >
                    Logga in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signup"
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
                  >
                    Registrera (Privatperson)
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/register/company"
                    className="text-mn-dark-blue-green hover:text-mn-dark-blue-green/80 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 font-open-sans"
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
