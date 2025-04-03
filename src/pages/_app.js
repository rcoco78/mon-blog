import { ThemeProvider } from 'next-themes'
import '../styles/globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next"

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} />
      <SpeedInsights />
    </ThemeProvider>
  )
}

export default MyApp 