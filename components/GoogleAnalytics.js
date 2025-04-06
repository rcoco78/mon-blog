import { GoogleAnalytics } from '@next/third-parties/google'

export default function Analytics({ gaId }) {
  return <GoogleAnalytics gaId={gaId} />
} 