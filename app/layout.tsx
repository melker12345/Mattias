import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Utbildningsplattform - Professionella onlinekurser',
  description: 'Sveriges ledande plattform för professionella onlinekurser inom säkerhet, arbete på väg och kompetensutveckling.',
  keywords: 'onlinekurser, utbildning, säkerhet, arbete på väg, kompetens, certifiering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}
