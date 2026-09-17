import { Baloo_Tamma_2, Bitter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/lib/site'
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
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: '%s · Datareacher',
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans min-h-screen antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-pine focus:px-3 focus:py-2 focus:text-white"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
