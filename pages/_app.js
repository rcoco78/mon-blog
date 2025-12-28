import { ThemeProvider } from 'next-themes'
import Analytics from '../components/GoogleAnalytics'
import '../styles/globals.css'
import Layout from '../components/Layout'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { siteConfig } from '../lib/config'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      <SEOHead
        title={siteConfig.title}
        description={siteConfig.description}
        keywords="développement web, outils, projets open source, blog, Corentin Robert"
      />
      <StructuredData type="WebSite" />
      <StructuredData type="Organization" />
      <StructuredData type="Person" />
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </ThemeProvider>
  )
}

export default MyApp 