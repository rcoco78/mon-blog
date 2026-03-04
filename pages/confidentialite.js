import SEOHead from '../components/seo/SEOHead'
import { generatePageSEO } from '../lib/seo'
import { siteConfig } from '../lib/config'

export default function Confidentialite() {
  const pageSEO = generatePageSEO({
    title: siteConfig.seo.pages.confidentialite.title,
    description: siteConfig.seo.pages.confidentialite.description,
    path: '/confidentialite',
    keywords: siteConfig.seo.pages.confidentialite.keywords
  })

  return (
    <>
      <SEOHead {...pageSEO} />
      <main className="min-w-0 mt-6 flex flex-col">
        <section className="mb-12">
          <h1 className="font-semibold text-2xl mb-6 tracking-tighter">Politique de confidentialité</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
            Dernière mise à jour : mars 2025.
          </p>

          <div className="space-y-8 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <section>
              <h2 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-white">Responsable du traitement</h2>
              <p>
                Le site {siteConfig.url} est édité par Corentin Robert. Contact : contact@corentinrobert.fr
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-white">Données collectées</h2>
              <p>
                Les données personnelles que nous pouvons collecter comprennent : adresse email (newsletter, formulaire de contact), nom, prénom, coordonnées professionnelles lorsque vous nous contactez ou déposez un avis sur la marketplace. Les données de navigation (pages vues, durée) sont agrégées via Umami Analytics, sans tracking individuel ni cookies publicitaires.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-white">Finalités</h2>
              <p>
                Les données sont utilisées pour : répondre à vos demandes de contact, gérer vos inscriptions newsletter, afficher les avis clients sur la marketplace, améliorer le site et mesurer l&apos;audience de manière anonymisée.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-white">Cookies</h2>
              <p>
                Le site utilise des cookies essentiels (préférence de thème), Google Tag Manager pour l&apos;analyse d&apos;audience et Umami Analytics (hébergé en UE, sans cookies tiers). Calendly peut déposer des cookies lors de la réservation d&apos;un rendez-vous.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-white">Vos droits</h2>
              <p>
                Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez contact@corentinrobert.fr. Vous pouvez également introduire une réclamation auprès de la CNIL.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-white">Conservation</h2>
              <p>
                Les données sont conservées le temps nécessaire aux finalités indiquées. Les données de contact et d&apos;avis sont conservées tant que vous ne demandez pas leur suppression.
              </p>
            </section>
          </div>
        </section>
      </main>
    </>
  )
}
