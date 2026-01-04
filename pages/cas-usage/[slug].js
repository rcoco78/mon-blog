import { useRouter } from 'next/router'
import Link from 'next/link'
import SEOHead from '../../components/seo/SEOHead'
import StructuredData from '../../components/seo/StructuredData'
import FAQ from '../../components/FAQ'
import { generatePageSEO } from '../../lib/seo'
import { siteConfig } from '../../lib/config'
import { caseStudies, getCaseStudyBySlug, getRelatedCaseStudies } from '../../lib/case-studies'

export default function CaseStudy({ caseStudy, relatedCaseStudies }) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Chargement...</div>
  }

  if (!caseStudy) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold mb-4">Cas d'usage non trouvé</h1>
        <Link href="/cas-usage" className="text-blue-600 hover:underline">
          ← Retour aux cas d'usage
        </Link>
      </div>
    )
  }

  const pageSEO = generatePageSEO({
    title: `${caseStudy.title} | Corentin Robert`,
    description: `${caseStudy.description} ${caseStudy.useCase}. Données extractibles : ${caseStudy.dataExtracted.slice(0, 3).join(', ')}.`,
    path: `/cas-usage/${caseStudy.slug}`,
    keywords: caseStudy.keywords
  })

  const serviceStructuredData = {
    '@type': 'Service',
    name: caseStudy.title,
    description: caseStudy.description,
    provider: {
      '@type': 'Person',
      name: 'Corentin Robert',
      url: siteConfig.url
    },
    areaServed: {
      '@type': 'Country',
      name: 'France'
    },
    serviceType: 'Scraping et Automatisation',
    category: caseStudy.sector
  }

  const faqItems = [
    {
      question: `Comment fonctionne le scraping pour ${caseStudy.sector.toLowerCase()} ?`,
      answer: `Le scraping permet d'extraire automatiquement toutes les données disponibles sur les sites web de ${caseStudy.examples.slice(0, 3).join(', ')} et autres sources. Les données sont structurées et livrées dans le format de votre choix (CSV, Excel, JSON, API). Le processus est automatisé et peut être programmé pour des mises à jour régulières.`
    },
    {
      question: `Quelles données exactes sont extractibles ?`,
      answer: `Pour ${caseStudy.sector.toLowerCase()}, voici les principales données extractibles : ${caseStudy.dataExtracted.join(', ')}. La liste complète dépend des sources disponibles et peut être adaptée selon vos besoins spécifiques.`
    },
    {
      question: `Combien de temps pour obtenir les données ?`,
      answer: `Le délai moyen est de 7 jours pour un scraping complet. Cela inclut l'analyse des sources, le développement du scraper, l'extraction des données, la structuration et la livraison. Pour des volumes très importants, le délai peut être légèrement plus long.`
    },
    {
      question: `Dans quel format recevrai-je les données ?`,
      answer: `Les données sont livrées dans le format de votre choix : Google Sheets (recommandé pour la facilité d'utilisation), CSV, Excel, JSON ou via une API. Si vous avez besoin d'un format spécifique, je peux l'adapter.`
    },
    {
      question: `Les données sont-elles mises à jour régulièrement ?`,
      answer: `Oui, je peux mettre en place un système de mise à jour automatique. Les données peuvent être rafraîchies quotidiennement, hebdomadairement ou mensuellement selon vos besoins. Un abonnement annuel permet d'avoir des mises à jour automatiques.`
    },
    {
      question: `Puis-je avoir un scraping sur-mesure pour mon secteur ?`,
      answer: `Absolument ! Si votre besoin spécifique n'est pas couvert par ce cas d'usage, je développe des solutions sur-mesure. Discutons de votre projet lors d'un appel de 20 minutes gratuit pour définir la meilleure approche.`
    }
  ]

  return (
    <>
      <SEOHead {...pageSEO} />
      
      <StructuredData type="Service" data={serviceStructuredData} />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col min-h-screen mt-8 sm:mt-8">
          <div>
            <main className="flex-auto min-w-0 mt-6 flex flex-col">
              {/* Breadcrumb */}
              <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-500">
                <Link href="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Accueil
                </Link>
                <span className="mx-2">/</span>
                <Link href="/cas-usage" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Cas d'usage
                </Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-900 dark:text-white">{caseStudy.sector}</span>
                <span className="mx-2">/</span>
                <span className="text-neutral-900 dark:text-white">{caseStudy.title}</span>
              </nav>

              {/* Header */}
              <section className="mb-8">
                <div className="mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {caseStudy.sector}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter mb-4">
                  {caseStudy.title}
                </h1>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                  {caseStudy.description}
                </p>
              </section>

              {/* Cas d'usage concret */}
              <section className="mb-8 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h2 className="text-xl font-semibold mb-3 tracking-tighter">
                  Cas d'usage concret
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {caseStudy.useCase}
                </p>
              </section>

              {/* Données extractibles */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 tracking-tighter">
                  Données extractibles
                </h2>
                <ul className="space-y-2">
                  {caseStudy.dataExtracted.map((data, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-neutral-400 dark:text-neutral-600 mt-1">•</span>
                      <span className="text-neutral-700 dark:text-neutral-300">{data}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Bénéfices */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 tracking-tighter">
                  Bénéfices pour votre business
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caseStudy.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                    >
                      <p className="text-neutral-700 dark:text-neutral-300">{benefit}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Exemples de sources */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 tracking-tighter">
                  Exemples de sources
                </h2>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.examples.map((example, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <section className="mb-12 p-6 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900">
                <h2 className="text-xl font-semibold mb-3 tracking-tighter">
                  Intéressé par ce cas d'usage ?
                </h2>
                <p className="text-neutral-200 dark:text-neutral-700 mb-4 leading-relaxed">
                  Discutons de votre projet lors d'un appel de 20 minutes gratuit. 
                  Je vous expliquerai comment adapter cette solution à vos besoins spécifiques.
                </p>
                <a
                  href="https://calendly.com/corentinrobert/20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                >
                  Réserver un appel gratuit
                </a>
              </section>

              {/* FAQ */}
              <section className="mb-12">
                <FAQ faqData={faqItems} />
              </section>

              {/* Cas d'usage similaires */}
              {relatedCaseStudies.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 tracking-tighter">
                    Cas d'usage similaires
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedCaseStudies.map(related => (
                      <Link
                        key={related.slug}
                        href={`/cas-usage/${related.slug}`}
                        className="block p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                            {related.title}
                          </h3>
                          <span className="px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 whitespace-nowrap flex-shrink-0">
                            {related.sector}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                          {related.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Retour */}
              <section className="mb-16">
                <Link
                  href="/cas-usage"
                  className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  ← Retour à tous les cas d'usage
                </Link>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const paths = caseStudies.map(cs => ({
    params: { slug: cs.slug }
  }))

  return {
    paths,
    fallback: true
  }
}

export async function getStaticProps({ params }) {
  const caseStudy = getCaseStudyBySlug(params.slug)
  
  if (!caseStudy) {
    return {
      notFound: true
    }
  }

  const relatedCaseStudies = getRelatedCaseStudies(params.slug, 4)

  return {
    props: {
      caseStudy,
      relatedCaseStudies
    },
    revalidate: 3600 // Revalider toutes les heures
  }
}

