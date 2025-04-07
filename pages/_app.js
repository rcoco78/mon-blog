import { ThemeProvider } from 'next-themes'
import Analytics from '../components/GoogleAnalytics'
import '../styles/globals.css'
import Layout from '../components/Layout'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Blog de Corentin Robert - Développement web, voyages et découvertes technologiques" />
        <meta name="keywords" content="développement web, voyages, technologie, blog, Corentin Robert" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://corentinrobert.com" />
        <meta property="og:title" content="Corentin Robert - Blog" />
        <meta property="og:description" content="Blog de Corentin Robert - Développement web, voyages et découvertes technologiques" />
        <meta property="og:image" content="https://corentinrobert.com/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://corentinrobert.com" />
        <meta property="twitter:title" content="Corentin Robert - Blog" />
        <meta property="twitter:description" content="Blog de Corentin Robert - Développement web, voyages et découvertes technologiques" />
        <meta property="twitter:image" content="https://corentinrobert.com/og-image.jpg" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <title>Corentin Robert - Blog</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </ThemeProvider>
  )
}

export default MyApp 