import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Analytics from '../components/GoogleAnalytics'
import '../styles/globals.css'
import Layout from '../components/Layout'
import { QuietRoutePlaceholder } from '../components/QuietSkeleton'
import StructuredData from '../components/seo/StructuredData'
import { siteConfig } from '../lib/config'
import { initPostHog } from '../lib/posthog-client'
import { preventSameUrlHardNavigationNoise } from '../lib/sentry-filters'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

function RouteBody({ Component, pageProps }) {
  const router = useRouter()
  const [pendingPath, setPendingPath] = useState(null)

  useEffect(() => {
    const onStart = (href) => {
      const path = href.split('#')[0].split('?')[0]
      const current = router.asPath.split('#')[0].split('?')[0]
      if (path === current) return
      setPendingPath(path)
    }
    const clear = () => setPendingPath(null)
    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', clear)
    router.events.on('routeChangeError', clear)
    return () => {
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', clear)
      router.events.off('routeChangeError', clear)
    }
  }, [router])

  if (pendingPath) {
    const placeholder = QuietRoutePlaceholder({ path: pendingPath })
    if (placeholder) return placeholder
  }

  return <Component {...pageProps} />
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initPostHog()
    return preventSameUrlHardNavigationNoise()
  }, [])

  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      <div className={`${inter.variable} ${inter.className} font-sans`}>
      {/* SEOHead est fourni par chaque page — pas de défaut global (évite meta dupliquées) */}
      <StructuredData type="WebSite" />
      <StructuredData 
        type="Organization" 
        data={{
          description: siteConfig.seo.defaultDescription,
          email: siteConfig.email,
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.github,
            'https://apify.com?fpr=0n7ukq'
          ]
        }} 
      />
      <StructuredData 
        type="Person" 
        data={{
          name: 'Corentin Robert',
          jobTitle: 'Expert Freelance en Scraping et Automatisation',
          description: siteConfig.seo.defaultDescription,
          knowsAbout: ['Web Scraping', 'Data Automation', 'Outbound Marketing', 'Growth Hacking', 'Freelance'],
          sameAs: [
            siteConfig.social.linkedin,
            siteConfig.social.malt,
            siteConfig.social.fiverr,
            siteConfig.social.github,
            'https://apify.com?fpr=0n7ukq'
          ]
        }} 
      />
      <Layout>
        <RouteBody Component={Component} pageProps={pageProps} />
      </Layout>
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      </div>
    </ThemeProvider>
  )
}

export default MyApp
