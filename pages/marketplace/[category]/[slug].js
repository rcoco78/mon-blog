/**
 * Page dynamique pour les bases de données marketplace
 * Générée automatiquement à partir des Google Sheets enrichis
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SEOHead from '../../../components/seo/SEOHead'
import StructuredData from '../../../components/seo/StructuredData'
import FAQ from '../../../components/FAQ'
import Toast, { useToast } from '../../../components/Toast'
import DownloadCounter from '../../../components/DownloadCounter'
import MarketplaceViewCounter from '../../../components/MarketplaceViewCounter'
import DatabasePurchasePanel from '../../../components/marketplace/DatabasePurchasePanel'
import { generatePageSEO } from '../../../lib/seo'
import { siteConfig } from '../../../lib/config'
import { categoryToSlug } from '../../../lib/marketplace-helpers'
import { shortMarketplaceTitle } from '../../../lib/marketplace-display'

const getPriceValidUntil = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
}

const isContactField = (header) => {
  const headerLower = header.toLowerCase()
  return (
    headerLower.includes('email') ||
    headerLower.includes('téléphone') ||
    headerLower.includes('telephone') ||
    headerLower.includes('phone') ||
    headerLower.includes('whatsapp') ||
    headerLower.includes('contact') ||
    (headerLower.includes('url') &&
      (headerLower.includes('linkedin') ||
        headerLower.includes('profil') ||
        headerLower.includes('profile')))
  )
}

export default function MarketplaceDatabase({
  database,
  relatedDatabases,
  addonDatabases = [],
  pageTestimonials = [],
  notFound,
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [subscriptionType, setSubscriptionType] = useState('one-time')
  const [selectedAddons, setSelectedAddons] = useState([])
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [purchasedToolIds, setPurchasedToolIds] = useState([])
  const [deliveryUrls, setDeliveryUrls] = useState({})
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    if (notFound || !database) return
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')

    if (paymentStatus === 'success' && sessionId) {
      ;(async () => {
        try {
          const response = await fetch('/api/tools/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          const data = await response.json()
          if (data.paid) {
            setPaymentVerified(true)
            setPurchasedToolIds(data.toolIds || [data.toolId].filter(Boolean))
            setDeliveryUrls(data.deliveryUrls || {})
            showToast('Paiement confirmé — copiez la base sur Google Sheets.', 'success')
          }
        } catch (error) {
          console.error('Erreur vérification paiement:', error)
        }
      })()
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [notFound, database?.slug])

  if (notFound || !database) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-semibold mb-4">Base de données non trouvée</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Cette base de données n&apos;existe pas ou a été supprimée.
        </p>
        <Link href="/marketplace" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Retour à la marketplace
        </Link>
      </div>
    )
  }

  const anonymizeValue = (value, key) => {
    if (!value) return '-'
    const strValue = String(value).trim()
    const lowerKey = key.toLowerCase()
    const lowerValue = strValue.toLowerCase()

    if (
      lowerKey.includes('nom') ||
      lowerKey.includes('name') ||
      lowerKey.includes('prénom') ||
      lowerKey.includes('firstname') ||
      lowerKey.includes('lastname')
    ) {
      const words = strValue.split(/\s+/)
      if (words.length > 1) {
        return words.map((word) => (word.length > 0 ? word[0] + '**' : '**')).join(' ')
      }
      if (strValue.length > 2) return strValue.substring(0, 2) + '**'
      return '**'
    }

    if (lowerKey.includes('email') || lowerKey.includes('mail') || strValue.includes('@')) {
      const [localPart, domain] = strValue.split('@')
      if (!domain) return strValue
      const blurredLocal = localPart.length > 1 ? localPart[0] + '***' : '***'
      const domainParts = domain.split('.')
      const blurredDomain =
        domainParts.length > 0
          ? domainParts[0].substring(0, 2) + '***.' + domainParts.slice(1).join('.')
          : domain
      return `${blurredLocal}@${blurredDomain}`
    }

    if (
      lowerKey.includes('phone') ||
      lowerKey.includes('téléphone') ||
      lowerKey.includes('tel') ||
      lowerKey.includes('whatsapp') ||
      lowerKey.includes('mobile') ||
      lowerKey.includes('contact') ||
      /^[\+]?[\d\s\-\(\)]{8,}$/.test(strValue.replace(/\s/g, ''))
    ) {
      const digits = strValue.replace(/\D/g, '')
      if (digits.length >= 4) {
        return `+${digits.substring(0, 2)}***${digits.substring(digits.length - 2)}`
      }
      return '***'
    }

    if (
      lowerValue.includes('linkedin.com/in/') ||
      lowerValue.includes('linkedin.com/company/') ||
      (lowerKey.includes('url') &&
        (lowerValue.includes('profile') ||
          lowerValue.includes('contact') ||
          lowerValue.includes('agent') ||
          lowerValue.includes('real-estate-agent') ||
          lowerValue.includes('linkedin')))
    ) {
      const urlParts = strValue.split('/')
      if (urlParts.length > 0) {
        const lastPart = urlParts[urlParts.length - 1].split('?')[0]
        if (lastPart.length > 3) {
          return urlParts.slice(0, -1).join('/') + '/' + lastPart.substring(0, 3) + '***'
        }
      }
      return strValue
    }

    if ((lowerKey.includes('adresse') || lowerKey.includes('address')) && strValue.length > 10) {
      const parts = strValue.split(',')
      if (parts.length > 0) {
        return parts[0].substring(0, 5) + '***' + (parts.length > 1 ? ', ' + parts[parts.length - 1] : '')
      }
      return strValue.substring(0, 5) + '***'
    }

    return strValue
  }

  const contactCompleteness =
    database.enrichedData?.contactCompleteness ||
    (() => {
      const sampleData = database.enrichedData?.sampleData || []
      if (sampleData.length === 0) return {}

      const contactFields = database.headers.filter(isContactField)
      const completeness = {}

      contactFields.forEach((field) => {
        const filled = sampleData.filter((row) => {
          const value = row[field]
          return value && String(value).trim() !== '' && String(value).trim() !== '-'
        }).length
        const percentage = sampleData.length > 0 ? Math.round((filled / sampleData.length) * 100) : 0
        completeness[field] = { filled, total: sampleData.length, percentage, isEstimate: true }
      })

      return completeness
    })()

  const hasRealContactData =
    database.enrichedData?.contactCompleteness &&
    Object.keys(database.enrichedData.contactCompleteness).length > 0

  const topContactSignals = hasRealContactData
    ? database.headers
        .filter(isContactField)
        .map((field) => ({ field, ...contactCompleteness[field] }))
        .filter((c) => c && !c.isEstimate && c.filled > 0)
        .sort((a, b) => b.filled - a.filled)
        .slice(0, 3)
    : []

  const toolData = {
    name: database.name,
    displayName: shortMarketplaceTitle(database.name),
    description: database.shortDescription || database.description,
    fullDescription: database.description,
    category: database.category,
    price: database.price,
    priceHT: Math.round((database.price / 1.2) * 100) / 100,
    priceLabel: `${database.price} €`,
    priceLabelHT: `${Math.round((database.price / 1.2) * 100) / 100} € HT`,
    formats: ['Google Sheets'],
    lastUpdate: new Date(database.lastEnriched).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    rows: `${database.rowCount.toLocaleString('fr-FR')} entrées`,
    isPaid: database.isPaid,
    unlockType: 'payment',
    problem: database.enrichedData?.problem || [],
    solution: database.enrichedData?.solution || [],
    useCases: database.enrichedData?.useCases || [],
    howToSteps: [
      {
        name: 'Payer en ligne',
        text: `Paiement sécurisé Stripe pour accéder aux ${database.rowCount.toLocaleString('fr-FR')} entrées.`,
      },
      {
        name: 'Copier sur Google Sheets',
        text: 'Un clic ouvre une copie de la base dans votre Drive.',
      },
      {
        name: 'Prospecter ou analyser',
        text: 'Utilisez le Sheet tel quel, ou exportez en CSV / Excel vers votre CRM.',
      },
    ],
  }

  const handleUnlock = async (e) => {
    e.preventDefault()

    if (!(toolData.isPaid && toolData.unlockType === 'payment')) return

    if (subscriptionType === 'api') {
      setIsLoading(true)
      setLoadingStep('Redirection vers Apify...')
      window.location.href = 'https://apify.com?fpr=0n7ukq'
      return
    }

    setIsLoading(true)
    setLoadingStep('Redirection vers le paiement...')

    try {
      const response = await fetch('/api/tools/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: database.slug,
          subscriptionType: 'one-time',
          ...(selectedAddons.length > 0 && { addonIds: selectedAddons }),
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        showToast(data.error || 'Une erreur est survenue. Veuillez réessayer.', 'error')
        setIsLoading(false)
        setLoadingStep('')
      }
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error)
      showToast('Une erreur est survenue. Veuillez réessayer.', 'error')
      setIsLoading(false)
      setLoadingStep('')
    }
  }

  const addonsTotal = addonDatabases
    .filter((a) => selectedAddons.includes(a.slug))
    .reduce((sum, a) => sum + a.price, 0)
  const baseCount = 1 + (addonsTotal > 0 ? selectedAddons.length : 0)
  const bundleDiscount = baseCount >= 3 ? 0.15 : baseCount >= 2 ? 0.1 : 0
  const totalBeforeDiscount = toolData.price + addonsTotal
  const totalWithDiscount = Math.round(totalBeforeDiscount * (1 - bundleDiscount) * 100) / 100
  const totalPriceLabel =
    bundleDiscount > 0
      ? `${totalWithDiscount} € TTC (${Math.round(bundleDiscount * 100)}% de remise bundle)`
      : toolData.priceLabel

  const categorySlug = categoryToSlug(database.category)
  const seoTitle = database.metaTitle || `${toolData.name} - Base de Données | ${database.price}€`
  const seoDescription =
    database.metaDescription ||
    `${toolData.fullDescription} ${database.rowCount.toLocaleString('fr-FR')} entrées, format Google Sheets.`
  const pageSEO = generatePageSEO({
    title: seoTitle,
    description: seoDescription,
    path: `/marketplace/${categorySlug}/${database.slug}`,
    keywords: database.enrichedData?.keywords || [database.name, 'base de données', 'prospection'],
  })

  const faqItems =
    database.enrichedData?.faq && database.enrichedData.faq.length > 0
      ? database.enrichedData.faq
      : [
          {
            question: 'Quelles données sont incluses ?',
            answer: `La base contient ${database.rowCount.toLocaleString('fr-FR')} entrées et ${database.headers.length} champs. Colonnes principales : ${database.headers.slice(0, 5).join(', ')}${database.headers.length > 5 ? '…' : ''}.`,
          },
          {
            question: 'Comment recevoir la base après paiement ?',
            answer:
              'Après le paiement Stripe, un bouton « Copier sur Google Sheets » apparaît sur cette page. Un clic crée une copie dans votre Drive. Vous pouvez ensuite exporter en CSV ou Excel.',
          },
          {
            question: 'Quelle est la différence entre Google Sheets et l’API Apify ?',
            answer:
              'Google Sheets = achat unique, snapshot à la date indiquée, accès immédiat. API Apify = accès récurrent avec mises à jour automatiques, idéal si vous avez besoin de données fraîches en continu.',
          },
          {
            question: 'Les données sont-elles à jour ?',
            answer: `La date de dernière mise à jour affichée est le ${toolData.lastUpdate}. L’achat unique livre le snapshot de cette date.`,
          },
        ]

  const purchasePanelProps = {
    database,
    addonDatabases,
    relatedDatabases,
    paymentVerified,
    purchasedToolIds,
    deliveryUrls,
    subscriptionType,
    setSubscriptionType,
    selectedAddons,
    setSelectedAddons,
    isLoading,
    loadingStep,
    onUnlock: handleUnlock,
    totalPriceLabel,
    priceLabel: toolData.priceLabel,
    priceLabelHT: toolData.priceLabelHT,
  }

  const avgTestimonialRating =
    pageTestimonials.length > 0
      ? (
          pageTestimonials.reduce((sum, t) => sum + (t.ratingValue || 5), 0) /
          pageTestimonials.length
        ).toFixed(1)
      : null

  const embedVideoUrl = (() => {
    const videoUrl = database.enrichedData?.videoUrl
    if (!videoUrl) return null
    if (videoUrl.includes('/embed')) return videoUrl
    const tellaMatch = videoUrl.match(/tella\.tv\/video\/([^\/\?]+)/)
    if (tellaMatch) {
      return `https://www.tella.tv/video/${tellaMatch[1]}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
    }
    return `${videoUrl}/embed?b=1&title=1&a=1&loop=0&t=0&muted=0&wt=0`
  })()

  const sortedHeaders = [...database.headers].sort((a, b) => {
    if (!hasRealContactData) return 0
    const aIsContact = isContactField(a)
    const bIsContact = isContactField(b)
    if (aIsContact && !bIsContact) return -1
    if (!aIsContact && bIsContact) return 1
    return 0
  })

  const sampleKeys =
    database.enrichedData?.sampleData?.[0]
      ? Object.keys(database.enrichedData.sampleData[0])
      : database.headers

  return (
    <>
      <SEOHead {...pageSEO} ogType="product" />

      <StructuredData
        type="Product"
        data={{
          name: toolData.name,
          description: toolData.fullDescription,
          url: `${siteConfig.url}/marketplace/${categorySlug}/${database.slug}`,
          image: siteConfig.ogImage || `${siteConfig.url}/og-image.jpg`,
          brand: {
            '@type': 'Brand',
            name: siteConfig.author,
            url: siteConfig.url,
          },
          offers: {
            '@type': 'Offer',
            price: database.price.toString(),
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: getPriceValidUntil(),
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: database.price.toString(),
              priceCurrency: 'EUR',
              valueAddedTaxIncluded: true,
            },
          },
          ...(avgTestimonialRating
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: avgTestimonialRating,
                  reviewCount: String(pageTestimonials.length),
                  bestRating: '5',
                  worstRating: '1',
                },
              }
            : {}),
        }}
      />

      <StructuredData
        type="Dataset"
        data={{
          name: toolData.name,
          description: database.description,
          url: `${siteConfig.url}/marketplace/${categorySlug}/${database.slug}`,
          datePublished: database.date,
          dateModified: database.lastEnriched,
          keywords: database.enrichedData?.keywords || [],
          license: 'https://creativecommons.org/licenses/by/4.0/',
        }}
      />

      {embedVideoUrl && (
        <StructuredData
          type="VideoObject"
          data={{
            name: `${toolData.name} - Présentation vidéo`,
            description: toolData.description,
            thumbnailUrl:
              database.enrichedData?.videoThumbnail ||
              `${siteConfig.url}/images/video-thumbnail-default.jpg`,
            uploadDate: database.lastEnriched,
            duration: database.enrichedData?.videoDuration || 'PT3M',
            contentUrl: database.enrichedData.videoUrl.replace('/embed', '').split('?')[0],
            embedUrl: embedVideoUrl,
            publisher: {
              '@type': 'Person',
              name: siteConfig.author,
            },
          }}
        />
      )}

      <StructuredData
        type="HowTo"
        data={{
          name: `Comment utiliser ${toolData.name}`,
          description: `Recevoir et utiliser la base en 3 étapes`,
          steps: toolData.howToSteps,
        }}
      />

      {toast && <Toast {...toast} onClose={hideToast} />}

      <article className="min-w-0 mt-6 flex flex-col">
        <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-500" aria-label="Fil d'Ariane">
          <Link href="/marketplace" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Marketplace
          </Link>
          <span className="mx-1.5 text-neutral-300 dark:text-neutral-700">/</span>
          <Link
            href={`/marketplace/${categorySlug}`}
            className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            {database.category}
          </Link>
        </nav>

        <StructuredData
          type="BreadcrumbList"
          data={{
            items: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Marketplace',
                item: `${siteConfig.url}/marketplace`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: database.category,
                item: `${siteConfig.url}/marketplace/${categorySlug}`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: toolData.displayName,
                item: `${siteConfig.url}/marketplace/${categorySlug}/${database.slug}`,
              },
            ],
          }}
        />

        <header className="mb-10">
          <h1 className="font-semibold text-2xl md:text-3xl tracking-tighter text-neutral-900 dark:text-neutral-100 mb-3">
            {toolData.displayName}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
            {[
              database.category,
              `${database.rowCount.toLocaleString('fr-FR')} entrées`,
              `${database.headers.length} champs`,
              'Google Sheets',
              `MAJ ${toolData.lastUpdate}`,
              toolData.priceLabel,
            ].join(' · ')}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mb-4">
            {toolData.description}
          </p>
          {topContactSignals.length > 0 && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Contacts :{' '}
              {topContactSignals.map((c, i) => (
                <span key={c.field}>
                  {i > 0 ? ' · ' : ''}
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium tabular-nums">
                    {c.filled.toLocaleString('fr-FR')}
                  </span>{' '}
                  {c.field}
                </span>
              ))}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-500">
            <span>Payer → copier le Sheet → prospecter</span>
            <MarketplaceViewCounter
              slug={database.slug}
              category={database.category}
              increment={true}
            />
            <DownloadCounter toolId={database.slug} />
          </div>
        </header>

        <div className="md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:gap-12 md:items-start">
          <div className="min-w-0 space-y-12">
            <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 pt-8">
              {toolData.isPaid && toolData.unlockType === 'payment' && (
                <DatabasePurchasePanel {...purchasePanelProps} />
              )}
            </div>

            {embedVideoUrl && (
              <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <div className="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full border-0"
                    src={embedVideoUrl}
                    allowFullScreen
                    title={`Présentation ${toolData.displayName}`}
                  />
                </div>
              </section>
            )}

            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl tracking-tighter mb-2">Aperçu</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                Exemple anonymisé — {database.rowCount.toLocaleString('fr-FR')} lignes au complet.
              </p>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      {sampleKeys.map((key) => (
                        <th
                          key={key}
                          className="px-2 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-500 whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {database.enrichedData?.sampleData?.length > 0
                      ? database.enrichedData.sampleData.slice(0, 3).map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="border-b border-neutral-100 dark:border-neutral-900"
                          >
                            {sampleKeys.map((key) => (
                              <td
                                key={key}
                                className="px-2 py-2 text-neutral-800 dark:text-neutral-200 whitespace-nowrap max-w-[180px] truncate"
                              >
                                {anonymizeValue(row[key] || '', key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      : [1, 2, 3].map((rowIdx) => (
                          <tr key={rowIdx} className="border-b border-neutral-100 dark:border-neutral-900">
                            {database.headers.map((header) => (
                              <td
                                key={header}
                                className="px-2 py-2 text-neutral-400 dark:text-neutral-600"
                              >
                                —
                              </td>
                            ))}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl tracking-tighter mb-4">
                Colonnes ({database.headers.length})
              </h2>
              <ul className="columns-1 sm:columns-2 gap-x-8 text-sm text-neutral-700 dark:text-neutral-300">
                {sortedHeaders.map((header) => {
                  const completeness = contactCompleteness[header]
                  const showCount =
                    hasRealContactData &&
                    isContactField(header) &&
                    completeness &&
                    !completeness.isEstimate &&
                    completeness.filled > 0

                  return (
                    <li key={header} className="break-inside-avoid py-1">
                      {header}
                      {showCount && (
                        <span className="text-neutral-400 dark:text-neutral-500">
                          {' '}
                          · {completeness.filled.toLocaleString('fr-FR')}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            {(toolData.problem?.length > 0 || toolData.solution?.length > 0) && (
              <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8 space-y-8">
                {toolData.problem?.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-xl tracking-tighter mb-3">Sans cette base</h2>
                    <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {toolData.problem.map((item, index) => (
                        <li key={index}>— {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {toolData.solution?.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-xl tracking-tighter mb-3">Avec cette base</h2>
                    <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {toolData.solution.map((item, index) => (
                        <li key={index}>→ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {toolData.useCases?.length > 0 && (
              <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <h2 className="font-semibold text-xl tracking-tighter mb-3">Cas d&apos;usage</h2>
                <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {toolData.useCases.slice(0, 4).map((useCase) => (
                    <li key={useCase}>→ {useCase}</li>
                  ))}
                </ul>
              </section>
            )}

            {pageTestimonials.length > 0 && (
              <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <div className="flex items-baseline justify-between gap-3 mb-4">
                  <h2 className="font-semibold text-xl tracking-tighter">Clients</h2>
                  <Link
                    href="/temoignages"
                    className="text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Tous →
                  </Link>
                </div>
                <div className="space-y-6">
                  {pageTestimonials.map((testimonial, index) => (
                    <blockquote
                      key={index}
                      className="border-l border-neutral-200 dark:border-neutral-800 pl-4"
                    >
                      <p className="text-neutral-800 dark:text-neutral-200">
                        « {testimonial.reviewBody} »
                      </p>
                      <footer className="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
                        {testimonial.authorName}
                        {testimonial.authorJob ? ` — ${testimonial.authorJob}` : ''}
                        {testimonial.source ? ` · ${testimonial.source}` : ''}
                      </footer>
                      <StructuredData
                        type="Review"
                        data={{
                          author: {
                            '@type': 'Person',
                            name: testimonial.authorName,
                          },
                          datePublished: testimonial.datePublished,
                          reviewBody: testimonial.reviewBody,
                          ratingValue: testimonial.ratingValue,
                          itemReviewed: {
                            '@type': 'Product',
                            name: toolData.name,
                            url: `${siteConfig.url}/marketplace/${categorySlug}/${database.slug}`,
                          },
                        }}
                      />
                    </blockquote>
                  ))}
                </div>
              </section>
            )}

            {!paymentVerified && toolData.isPaid && (
              <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <a
                  href="#acheter"
                  className="inline-flex text-sm font-medium underline underline-offset-4 hover:no-underline"
                >
                  Acheter — {toolData.priceLabel} →
                </a>
              </div>
            )}

            {relatedDatabases?.length > 0 && (
              <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <h2 className="font-semibold text-xl tracking-tighter mb-2">Bases proches</h2>
                <div>
                  {relatedDatabases.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/marketplace/${categoryToSlug(related.category)}/${related.slug}`}
                      className="group flex items-baseline justify-between gap-4 py-3 border-b border-neutral-200 dark:border-neutral-800"
                    >
                      <span className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {shortMarketplaceTitle(related.name)}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-500 tabular-nums whitespace-nowrap">
                        {related.price ? `${related.price} €` : ''}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8 mb-16">
              <h2 className="font-semibold text-xl tracking-tighter mb-4">Questions</h2>
              <FAQ items={faqItems} />
              <StructuredData type="FAQPage" data={{ questions: faqItems }} />
            </section>
          </div>

          <aside className="hidden md:block sticky top-24 self-start border-t border-neutral-200 dark:border-neutral-800 pt-8">
            {toolData.isPaid && toolData.unlockType === 'payment' && (
              <DatabasePurchasePanel {...purchasePanelProps} />
            )}
          </aside>
        </div>
      </article>
    </>
  )
}

export async function getServerSideProps({ params }) {
  const { getDatabaseBySlug, getRelatedDatabases, getAddonDatabases } = await import(
    '../../../lib/marketplace-databases'
  )
  const { slugToCategory, categoryToSlug, validateCategory } = await import(
    '../../../lib/marketplace-helpers'
  )

  const category = slugToCategory(params.category)

  if (!category) {
    return { notFound: true }
  }

  const database = await getDatabaseBySlug(params.slug)

  if (!database) {
    return { notFound: true }
  }

  const normalizedUrlCategory = validateCategory(category)
  const normalizedDbCategory = validateCategory(database.category)

  if (normalizedDbCategory !== normalizedUrlCategory) {
    const correctCategorySlug = categoryToSlug(normalizedDbCategory)
    return {
      redirect: {
        destination: `/marketplace/${correctCategorySlug}/${database.slug}`,
        permanent: true,
      },
    }
  }

  if (database.category !== normalizedDbCategory) {
    database.category = normalizedDbCategory
  }

  const relatedDatabases = await getRelatedDatabases(params.slug, 3)
  const addonDatabases = await getAddonDatabases(params.slug)

  const { getRelevantTestimonials } = await import('../../../lib/testimonials')
  const pageTestimonials = getRelevantTestimonials(normalizedDbCategory, 3)

  const { getVideoUrlForDatabase } = await import('../../../lib/marketplace-videos')
  const videoUrlFromTella = await getVideoUrlForDatabase(params.slug)
  if (videoUrlFromTella && !database.enrichedData?.videoUrl) {
    database.enrichedData = database.enrichedData || {}
    database.enrichedData.videoUrl = videoUrlFromTella
  }

  // Ne pas exposer les URLs Sheets côté client avant paiement
  const stripDeliverySecrets = (db) => {
    if (!db) return db
    const { sheetUrl, sheetId, ...publicDb } = db
    return publicDb
  }

  return {
    props: {
      database: stripDeliverySecrets(database),
      relatedDatabases: relatedDatabases.map(stripDeliverySecrets),
      addonDatabases: addonDatabases.map(stripDeliverySecrets),
      pageTestimonials,
    },
  }
}
