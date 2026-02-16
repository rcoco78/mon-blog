import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function Contact() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.contact.title,
    description: siteConfig.seo.pages.contact.description,
    path: '/contact',
    keywords: siteConfig.seo.pages.contact.keywords
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
          bookingUrl: 'https://calendly.com/corentinrobert/20min'
        }}
      />

      <div className="flex-auto min-w-0 mt-6 flex flex-col">
        <section className="mb-16">
          <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Contact</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-0 tracking-tight">
            Réservez un créneau pour discuter de vos projets de scraping, d'automatisation ou d'outbound marketing.
          </p>
        </section>

        {/* Section Ma méthode de travail */}
        <section className="mb-12 p-4 md:p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="font-semibold text-xl mb-6 tracking-tighter">Ma méthode de travail</h2>
          <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
            <div>
              <p className="mb-2"><strong className="text-neutral-900 dark:text-neutral-100">1. Appel de 20 minutes</strong> pour comprendre vos besoins et votre contexte.</p>
            </div>
            <div>
              <p className="mb-2"><strong className="text-neutral-900 dark:text-neutral-100">2. Proposition</strong> détaillée avec approche technique et délais.</p>
            </div>
            <div>
              <p className="mb-2"><strong className="text-neutral-900 dark:text-neutral-100">3. Validation</strong> de votre côté, puis démarrage du projet.</p>
            </div>
            <div>
              <p className="mb-2"><strong className="text-neutral-900 dark:text-neutral-100">4. Livraison</strong> en moins d'une semaine, avec aller-retour si nécessaire.</p>
            </div>
            <div>
              <p><strong className="text-neutral-900 dark:text-neutral-100">5. Suivi</strong> — on se reparle si besoin d'ajustements ou d'évolutions.</p>
            </div>
          </div>
        </section>

        <div className="h-[600px] rounded-lg overflow-hidden">
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