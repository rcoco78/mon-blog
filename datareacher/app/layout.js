import { Baloo_Tamma_2, Bitter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

const sans = Bitter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const display = Baloo_Tamma_2({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'Datareacher',
    template: '%s · Datareacher',
  },
  description: 'Tu prends ton shoot de data. Tu repars.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans min-h-screen antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
