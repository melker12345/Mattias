'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'

export function Navigation() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: 'Hem', href: '/' },
    { name: 'Kurser', href: '/courses' },
    { name: 'Om Oss', href: '/about' },
    { name: 'Kontakt', href: '/contact' },
  ]

  return (
    <Disclosure as="nav" className="bg-white shadow-lg">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary-600">
                  Utbildningsplattform
                </Link>
              </div>
              
              {/* Center Navigation Links */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* Right Side - User Menu */}
              <div className="hidden sm:flex sm:items-center">
                {session ? (
                  <Menu as="div" className="ml-3 relative">
                    <div>
                      <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span className="sr-only">Öppna användarmenyn</span>
                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
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
                      <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={(session?.user as any)?.role === 'COMPANY_ADMIN' ? '/dashboard/company' : '/dashboard'}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
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
                                  active ? 'bg-gray-100' : ''
                                } block px-4 py-2 text-sm text-gray-700`}
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
                                active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
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
                                active ? 'bg-gray-100' : ''
                              } block w-full text-left px-4 py-2 text-sm text-gray-700`}
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
                      className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                      Logga in
                    </Link>
                    <div className="relative group">
                      <button className="btn-primary">
                        Registrera
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <Link
                          href="/auth/signup"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Privatperson
                        </Link>
                        <Link
                          href="/register/company"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Företag
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
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
                  className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              {session ? (
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href={(session?.user as any)?.role === 'COMPANY_ADMIN' ? '/dashboard/company' : '/dashboard'}
                    className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    {(session?.user as any)?.role === 'COMPANY_ADMIN' ? 'Företagsdashboard' : 'Mina Kurser'}
                  </Disclosure.Button>
                  {(session?.user as any)?.role === 'ADMIN' && (
                    <Disclosure.Button
                      as={Link}
                      href="/admin"
                      className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    >
                      Admin Panel
                    </Disclosure.Button>
                  )}
                  <Disclosure.Button
                    as={Link}
                    href="/profile"
                    className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Profil
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={() => signOut()}
                    className="text-gray-900 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Logga ut
                  </Disclosure.Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signin"
                    className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Logga in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signup"
                    className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Registrera (Privatperson)
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/register/company"
                    className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
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
