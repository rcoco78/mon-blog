import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'
import { useEffect } from 'react'
import { trackInlineCalendly } from '../lib/calendly'

export default function Contact() {
  useEffect(() => {
    trackInlineCalendly('contact_page')
  }, [])
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.contact.title,
    description: siteConfig.seo.pages.contact.description,
    path: '/contact',
    keywords: siteConfig.seo.pages.contact.keywords,
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <StructuredData
        type="ContactPage"
        data={{
          url: `${siteConfig.url}/contact`,
          name: siteConfig.seo.pages.contact.title,
          description: siteConfig.seo.pages.contact.description,
          email: 'contact@corentinrobert.fr',
          bookingUrl: 'https://calendly.com/corentinrobert/20min',
        }}
      />

      <div className="flex-auto min-w-0 mt-6 flex flex-col pb-16">
        <header className="mb-10">
          <h1 className="font-semibold text-2xl mb-3 tracking-tighter">Contact</h1>
          <p className="text-neutral-600 dark:text-neutral-400 tracking-tight">
            Réservez un créneau pour discuter de scraping, automatisation ou outbound.
          </p>
        </header>

        <section className="mb-10 border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <h2 className="font-semibold text-xl mb-4 tracking-tighter">Méthode</h2>
          <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">1.</span> Appel
              de 20 minutes pour comprendre le besoin.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">2.</span>{' '}
              Proposition technique et délais.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">3.</span>{' '}
              Validation, puis démarrage.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">4.</span> Livraison
              en moins d’une semaine, avec allers-retours si besoin.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">5.</span> Suivi
              après livraison.
            </li>
          </ol>
        </section>

        <div className="h-[600px] overflow-hidden border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <iframe
            src="https://calendly.com/corentinrobert/20min?embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&hide_cookie_banner=1"
            width="100%"
            height="100%"
            frameBorder="0"
            title="Calendly Scheduling"
          />
        </div>
      </div>
    </>
  )
}
