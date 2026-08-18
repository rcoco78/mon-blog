import { Html, Head, Main, NextScript } from 'next/document'
import { siteConfig } from '../lib/config'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="utf-8" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WPCV4F5G');`
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Umami Analytics */}
        <script defer src="https://cloud.umami.is/script.js" data-website-id="34057468-2b5a-4874-82ba-3e8b93514c2e"></script>
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href={siteConfig.profileImage} />
        
        {/* Theme */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        
        {/* Preconnect pour performance - Domaines externes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.tella.tv" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://cloud.umami.is" />
        <link rel="preconnect" href="https://eu.i.posthog.com" />
        <link rel="dns-prefetch" href="https://eu-assets.i.posthog.com" />
        
        {/* Sitemap - Référence explicite pour Google Search Console */}
        <link rel="sitemap" type="application/xml" href="https://www.corentinrobert.fr/sitemap.xml" />
        {/* Flux RSS pour découverte par agrégateurs */}
        <link rel="alternate" type="application/rss+xml" title="RSS - Corentin Robert" href="https://www.corentinrobert.fr/feed.xml" />
        
        {/* Robots */}
        <meta name="robots" content="index, follow" />
      </Head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WPCV4F5G"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 