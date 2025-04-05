import '../styles/globals.css'
import Layout from '../components/Layout'
import GoogleAnalytics from '../components/GoogleAnalytics'

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_ID} />
      )}
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp 