import { ThemeProvider } from 'next-themes'
import Analytics from '../components/GoogleAnalytics'
import '../styles/globals.css'
import Layout from '../components/Layout'
import StructuredData from '../components/seo/StructuredData'
import { siteConfig } from '../lib/config'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      {/* SEOHead est fourni par chaque page — pas de défaut global (évite meta dupliquées) */}
      <StructuredData type="WebSite" />
      <StructuredData 
        type="Organization" 
        data={{
          description: siteConfig.seo.defaultDescription,
          email: 'contact@corentinrobert.fr',
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
        <Component {...pageProps} />
      </Layout>
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </ThemeProvider>
  )
}

export default MyApp
