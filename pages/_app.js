import { ThemeProvider } from 'next-themes'
import Analytics from '../components/GoogleAnalytics'
import '../styles/globals.css'
import Layout from '../components/Layout'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class">
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </ThemeProvider>
  )
}

export default MyApp 