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
import MarketplaceViewCounter from '../../../components/MarketplaceViewCounter'
import { isIadOrSafti, PACK_IAD_SAFTI, shouldNoindexDatabase } from '../../../lib/marketplace-catalog'
import { formatEuros, marketplaceScopeText, marketplaceSeoTitle, priceHT, priceTTC } from '../../../lib/marketplace-display'
import DatabasePurchasePanel from '../../../components/marketplace/DatabasePurchasePanel'
import { generatePageSEO } from '../../../lib/seo'
import { siteConfig } from '../../../lib/config'
import { categoryToSlug } from '../../../lib/marketplace-helpers'
import { shortMarketplaceTitle } from '../../../lib/marketplace-display'
import { getPosthogIdentityHeaders, captureCta } from '../../../lib/posthog-client'
import { FLOW } from '../../../lib/posthog-events'

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
  notFound,
  noindex = false,
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
    priceHT: priceHT(database.price),
    priceTTC: priceTTC(database.price),
    priceLabel: `${formatEuros(priceTTC(database.price))} €`,
    priceLabelHT: `${formatEuros(priceHT(database.price))} € HT`,
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

    captureCta({
      flow: FLOW.marketplace,
      source: 'database',
      cta: 'checkout',
      tool_id: database.slug,
    })

    setIsLoading(true)
    setLoadingStep('Redirection vers le paiement...')

    try {
      const response = await fetch('/api/tools/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getPosthogIdentityHeaders(),
        },
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
      ? `${formatEuros(priceTTC(totalWithDiscount))} €`
      : toolData.priceLabel

  const categorySlug = categoryToSlug(database.category)
  const volumeLabel = `${database.rowCount.toLocaleString('fr-FR')} entrées`
  const seoTitle = marketplaceSeoTitle(database.name, database.rowCount, database.headers, database.slug)
  const scopeText = marketplaceScopeText({
    name: database.name,
    slug: database.slug,
    rowCount: database.rowCount,
    headers: database.headers,
    date: toolData.lastUpdate,
    category: database.category,
  })
  const seoDescription = scopeText.length > 160 ? `${scopeText.slice(0, 157).trim()}…` : scopeText
  const pageSEO = generatePageSEO({
    title: seoTitle,
    description: seoDescription,
    path: `/marketplace/${categorySlug}/${database.slug}`,
    keywords: database.enrichedData?.keywords || [database.name, 'base de données', 'prospection'],
  })

  const faqItems = [
    {
      question: 'Qu’est-ce qu’il y a dedans ?',
      answer: `${volumeLabel}, ${database.headers.length} champs. Colonnes : ${database.headers.slice(0, 6).join(', ')}${database.headers.length > 6 ? '…' : ''}.`,
    },
    {
      question: 'De quand date le fichier ?',
      answer: `Le snapshot date du ${toolData.lastUpdate}. L’achat livre ce fichier, pas une mise à jour automatique.`,
    },
    {
      question: 'Comment le Sheet arrive ?',
      answer:
        'Après le paiement Stripe, un bouton sur cette page copie la base dans votre Google Drive. Vous pouvez ensuite exporter en CSV ou Excel.',
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
    priceLabelHT: `${formatEuros(totalWithDiscount)} € HT`,
    pack: isIadOrSafti(database.slug) ? PACK_IAD_SAFTI : null,
  }

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

  const PREVIEW_COLUMNS_MAX = 5
  const allSampleKeys =
    database.enrichedData?.sampleData?.[0]
      ? Object.keys(database.enrichedData.sampleData[0])
      : database.headers
  const priorityHints = ['name', 'nom', 'title', 'email', 'ville', 'city', 'website', 'url', 'phone', 'téléphone']
  const sampleKeys = [...allSampleKeys]
    .sort((a, b) => {
      const ai = priorityHints.findIndex((p) => a.toLowerCase().includes(p))
      const bi = priorityHints.findIndex((p) => b.toLowerCase().includes(p))
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    .slice(0, PREVIEW_COLUMNS_MAX)

  return (
    <>
      <SEOHead {...pageSEO} ogType="product" noindex={noindex} />

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
            price: priceTTC(database.price).toString(),
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: getPriceValidUntil(),
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: priceTTC(database.price).toString(),
              priceCurrency: 'EUR',
              valueAddedTaxIncluded: true,
            },
          },
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

        <header className="mb-8">
          <h1 className="font-semibold text-2xl md:text-3xl tracking-tighter text-neutral-900 dark:text-neutral-100 mb-3">
            {toolData.displayName}, {volumeLabel}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
            {[
              database.category,
              `${database.rowCount.toLocaleString('fr-FR')} entrées`,
              `${database.headers.length} champs`,
              `MAJ ${toolData.lastUpdate}`,
            ].join(' · ')}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
            {scopeText}
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
            <MarketplaceViewCounter
              slug={database.slug}
              category={database.category}
              increment={true}
            />
          </div>
        </header>

        <div className="min-w-0 space-y-10">
          {toolData.isPaid && toolData.unlockType === 'payment' && (
            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <DatabasePurchasePanel {...purchasePanelProps} />
            </section>
          )}

            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <h2 className="font-semibold text-xl tracking-tighter mb-3">Vidéo</h2>
              {embedVideoUrl ? (
                <div className="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full border-0"
                    src={embedVideoUrl}
                    allowFullScreen
                    title={`Présentation ${toolData.displayName}`}
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <img
                    src={siteConfig.profileImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_28%] blur-md"
                  />
                  <div
                    className="absolute inset-0 bg-white/55 dark:bg-neutral-950/60"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      Vidéo en cours de création
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h2 className="font-semibold text-xl tracking-tighter">Aperçu</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 shrink-0">
                  {sampleKeys.length} colonnes clés
                </p>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                Exemple anonymisé — {database.rowCount.toLocaleString('fr-FR')} lignes au complet.
              </p>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[18rem] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                      {sampleKeys.map((key) => (
                        <th
                          key={key}
                          className="pr-4 py-2 text-left text-xs font-medium text-neutral-500 dark:text-neutral-500 whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {database.enrichedData?.sampleData?.length > 0
                      ? database.enrichedData.sampleData.slice(0, 5).map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="border-b border-neutral-100 dark:border-neutral-900"
                          >
                            {sampleKeys.map((key) => (
                              <td
                                key={key}
                                className="pr-4 py-2.5 text-neutral-800 dark:text-neutral-200 whitespace-nowrap max-w-[10rem] truncate"
                              >
                                {anonymizeValue(row[key] || '', key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      : [1, 2, 3].map((rowIdx) => (
                          <tr key={rowIdx} className="border-b border-neutral-100 dark:border-neutral-900">
                            {sampleKeys.map((header) => (
                              <td
                                key={header}
                                className="pr-4 py-2.5 text-neutral-400 dark:text-neutral-600"
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

            {!paymentVerified && toolData.isPaid && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center px-5 py-3.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
                >
                  {isLoading ? loadingStep || 'Redirection…' : 'Acheter et recevoir le Sheet'}
                </button>
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
                      <span className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors min-w-0">
                        {shortMarketplaceTitle(related.name)}
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-500 tabular-nums whitespace-nowrap shrink-0">
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

  const relatedDatabases = await getRelatedDatabases(params.slug, 2)
  const addonDatabases = await getAddonDatabases(params.slug)
  const { getDatabasesAsTools } = await import('../../../lib/marketplace-databases')
  const siblings = await getDatabasesAsTools()
  const noindex = shouldNoindexDatabase(database, siblings)

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
      noindex,
    },
  }
}
