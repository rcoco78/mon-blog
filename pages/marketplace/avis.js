/**
 * Page formulaire avis marketplace — accès uniquement via lien privé ?ref=SECRET
 * Non référencée, pas de lien depuis le site.
 */
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { siteConfig } from '../../lib/config'

const MAX_SUGGESTIONS = 8

function normalizeLinkedInUrl(val) {
  const v = (val || '').trim()
  if (!v) return ''
  if (v.startsWith('http')) return v
  return `https://${v}`
}

function ProductAutocomplete({ products, value, onChange, onSelect, id, disabled }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef(null)

  const selected = value ? products.find((p) => p.slug === value) : null
  const filtered = query.trim().length >= 2
    ? products.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, MAX_SUGGESTIONS)
    : products.slice(0, MAX_SUGGESTIONS)

  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [])

  const handleSelect = (p) => {
    onChange(p.slug)
    onSelect(p.name)
    setQuery('')
    setOpen(false)
    setHighlight(0)
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Backspace') setOpen(true)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      setHighlight(0)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
      return
    }
    if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault()
      handleSelect(filtered[highlight])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          disabled={disabled}
          value={selected ? selected.name : query}
          onChange={(e) => {
            const v = e.target.value
            if (selected) {
              onChange('')
              onSelect('')
            }
            setQuery(v)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une base (ex: dentistes, immobilier...)"
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 disabled:opacity-60 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        {selected && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              onSelect('')
              setQuery('')
              setOpen(false)
            }}
            className="flex-shrink-0 px-3 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg"
            aria-label="Effacer la sélection"
          >
            ✕
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg py-1"
          role="listbox"
        >
          {filtered.map((p, i) => (
            <li
              key={p.slug}
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => handleSelect(p)}
              className={`px-4 py-2.5 text-sm cursor-pointer ${
                i === highlight
                  ? 'bg-neutral-100 dark:bg-neutral-800'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <span className="font-medium">{p.name}</span>
              {p.category && (
                <span className="ml-2 text-neutral-500 dark:text-neutral-400 text-xs">({p.category})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const MAX_REVIEW_LENGTH = 2000

const FIELD_ERROR_MESSAGES = {
  authorName: 'Nom ou nom d\'entreprise requis',
  linkedinUrl: 'Profil LinkedIn requis (ex: linkedin.com/in/votre-profil)',
  productSlug: 'Sélectionnez le produit acheté',
  rating: 'Choisissez une note (1 à 5 étoiles)',
  reviewBody: 'Votre avis est requis',
  reviewBodyMaxLength: `Maximum ${MAX_REVIEW_LENGTH} caractères`
}

function getErrorField(msg) {
  if (!msg) return null
  if (/nom|avis/.test(msg)) return msg.includes('Nom') ? 'authorName' : 'reviewBody'
  if (/LinkedIn|linkedin/i.test(msg)) return 'linkedinUrl'
  if (/produit|Produit/.test(msg)) return 'productSlug'
  if (/note|étoile/.test(msg)) return 'rating'
  if (/Maximum|caractères/.test(msg)) return 'reviewBody'
  return null
}

export default function MarketplaceAvis({ valid, marketplaceProducts = [], reviewCount = 0, initialProductSlug = null, initialProductName = null }) {
  const router = useRouter()
  const ref = router.query.ref
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [errorField, setErrorField] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [hoverRating, setHoverRating] = useState(0)
  const errorRef = useRef(null)
  const formRef = useRef(null)
  const [form, setForm] = useState({
    authorName: '',
    email: '',
    linkedinUrl: '',
    productSlug: initialProductSlug || '',
    rating: 0,
    reviewBody: '',
    productName: initialProductName || ''
  })

  // Scroll vers l'erreur (ou premier champ en erreur) quand une erreur apparaît
  const fieldIdMap = { authorName: 'authorName', linkedinUrl: 'linkedinUrl', productSlug: 'productSearch', rating: 'rating-group', reviewBody: 'reviewBody' }
  useEffect(() => {
    if (!error) return
    if (errorField) {
      const id = fieldIdMap[errorField]
      if (id) {
        const el = formRef.current?.querySelector(`#${id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          if (el.focus) el.focus()
          return
        }
      }
    }
    if (errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error, errorField])

  const validateField = (name, value) => {
    switch (name) {
      case 'authorName':
        return !(value || '').trim() ? FIELD_ERROR_MESSAGES.authorName : null
      case 'linkedinUrl': {
        const v = normalizeLinkedInUrl(value)
        if (!v) return FIELD_ERROR_MESSAGES.linkedinUrl
        if (!/linkedin\.com\/(in|company)\//i.test(v)) return FIELD_ERROR_MESSAGES.linkedinUrl
        return null
      }
      case 'productSlug':
        return !value ? FIELD_ERROR_MESSAGES.productSlug : null
      case 'rating':
        return value < 1 || value > 5 ? FIELD_ERROR_MESSAGES.rating : null
      case 'reviewBody': {
        const trimmed = (value || '').trim()
        if (!trimmed) return FIELD_ERROR_MESSAGES.reviewBody
        if (trimmed.length > MAX_REVIEW_LENGTH) return FIELD_ERROR_MESSAGES.reviewBodyMaxLength
        return null
      }
      default:
        return null
    }
  }

  const handleBlur = (name) => {
    const value = form[name]
    const err = validateField(name, value)
    setFieldErrors((prev) => (err ? { ...prev, [name]: err } : { ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const errs = {}
    const authorErr = validateField('authorName', form.authorName)
    if (authorErr) errs.authorName = authorErr
    const linkedinErr = validateField('linkedinUrl', form.linkedinUrl)
    if (linkedinErr) errs.linkedinUrl = linkedinErr
    const productErr = validateField('productSlug', form.productSlug)
    if (productErr) errs.productSlug = productErr
    const ratingErr = validateField('rating', form.rating)
    if (ratingErr) errs.rating = ratingErr
    const bodyErr = validateField('reviewBody', form.reviewBody)
    if (bodyErr) errs.reviewBody = bodyErr

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setError('Veuillez corriger les champs indiqués.')
      setErrorField(Object.keys(errs)[0])
      return
    }

    setSubmitting(true)
    setError(null)
    setErrorField(null)
    setFieldErrors({})
    const linkedinNormalized = normalizeLinkedInUrl(form.linkedinUrl)
    try {
      const res = await fetch('/api/marketplace-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          authorName: form.authorName.trim() || undefined,
          email: form.email.trim() || undefined,
          linkedinUrl: linkedinNormalized,
          reviewBody: form.reviewBody.trim(),
          productSlug: form.productSlug || undefined,
          productName: form.productName || undefined,
          rating: form.rating
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const field = getErrorField(data.error)
        if (field) {
          setFieldErrors((prev) => ({ ...prev, [field]: data.error }))
          setErrorField(field)
        }
        throw new Error(data.error || 'Erreur')
      }
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!valid) {
    return (
      <>
        <Head>
          <title>Lien invalide | {siteConfig.name}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-w-0 mt-6 flex flex-col">
          <h1 className="font-semibold text-2xl mb-4 tracking-tighter">Lien invalide</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Ce lien n&apos;est pas valide ou a expiré.
          </p>
        </div>
      </>
    )
  }

  if (done) {
    return (
      <>
        <Head>
          <title>Merci pour votre avis | {siteConfig.name}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-w-0 mt-6 flex flex-col max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-2xl tracking-tighter">C&apos;est envoyé !</h1>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">Merci infiniment</p>
            </div>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Votre avis sera visible sur la marketplace prochainement. Merci !
          </p>
          <a
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors group"
          >
            <span>Voir la marketplace</span>
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Laisser un avis | Marketplace | {siteConfig.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-w-0 mt-6 flex flex-col max-w-xl">
        <h1 className="font-semibold text-2xl mb-2 tracking-tighter">Merci pour votre confiance</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
          Votre avis aide d&apos;autres professionnels à choisir en confiance. Prenez 2 minutes pour partager votre expérience — ça compte vraiment pour nous.
        </p>
        {reviewCount > 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
            {reviewCount === 1
              ? 'Rejoignez le client qui a déjà laissé un avis.'
              : `Rejoignez les ${reviewCount} clients qui ont déjà laissé un avis.`}
          </p>
        )}
        {reviewCount === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
            Soyez le premier à laisser un avis !
          </p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-500 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            1. Qui êtes-vous ?
          </p>
          <div>
            <label htmlFor="authorName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nom ou nom d&apos;entreprise *
            </label>
            <input
              id="authorName"
              type="text"
              required
              disabled={submitting}
              value={form.authorName}
              onChange={(e) => {
                setForm((f) => ({ ...f, authorName: e.target.value }))
                if (fieldErrors.authorName) setFieldErrors((p) => ({ ...p, authorName: null }))
              }}
              onBlur={() => handleBlur('authorName')}
              placeholder="Jean Dupont ou Acme SARL"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                fieldErrors.authorName
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-400 dark:focus:ring-red-500'
                  : 'border-neutral-200 dark:border-neutral-800 focus:ring-neutral-400 dark:focus:ring-neutral-600'
              }`}
              aria-invalid={!!fieldErrors.authorName}
              aria-describedby={fieldErrors.authorName ? 'authorName-error' : undefined}
            />
            {fieldErrors.authorName && (
              <p id="authorName-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.authorName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Email (privé, non affiché)
            </label>
            <input
              id="email"
              type="email"
              disabled={submitting}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="jean@exemple.fr"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="linkedinUrl" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Profil LinkedIn *
            </label>
            <input
              id="linkedinUrl"
              type="text"
              inputMode="url"
              required
              disabled={submitting}
              value={form.linkedinUrl}
              onChange={(e) => {
                setForm((f) => ({ ...f, linkedinUrl: e.target.value }))
                if (fieldErrors.linkedinUrl) setFieldErrors((p) => ({ ...p, linkedinUrl: null }))
              }}
              onBlur={() => handleBlur('linkedinUrl')}
              placeholder="linkedin.com/in/votre-profil ou linkedin.com/company/votre-entreprise"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                fieldErrors.linkedinUrl
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-400 dark:focus:ring-red-500'
                  : 'border-neutral-200 dark:border-neutral-800 focus:ring-neutral-400 dark:focus:ring-neutral-600'
              }`}
              aria-invalid={!!fieldErrors.linkedinUrl}
              aria-describedby={fieldErrors.linkedinUrl ? 'linkedinUrl-error' : undefined}
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
              Pas besoin de https:// — profil (linkedin.com/in/...) ou page entreprise (linkedin.com/company/...)
            </p>
            {fieldErrors.linkedinUrl && (
              <p id="linkedinUrl-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.linkedinUrl}</p>
            )}
          </div>

          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-500 pb-2 border-b border-neutral-200 dark:border-neutral-800 pt-4">
            2. Votre expérience
          </p>
          <div>
            <label htmlFor="productSearch" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Quel produit avez-vous acheté ? *
            </label>
            <ProductAutocomplete
              id="productSearch"
              products={marketplaceProducts}
              value={form.productSlug}
              onChange={(slug) => {
                setForm((f) => ({ ...f, productSlug: slug }))
                if (fieldErrors.productSlug) setFieldErrors((p) => ({ ...p, productSlug: null }))
              }}
              onSelect={(name) => setForm((f) => ({ ...f, productName: name }))}
              disabled={submitting}
            />
            {fieldErrors.productSlug && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.productSlug}</p>
            )}
          </div>

          <div>
            <label id="rating-label" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Votre note (1 à 5 étoiles) *
            </label>
            <div
              id="rating-group"
              role="group"
              aria-labelledby="rating-label"
              className="flex gap-1"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const displayRating = hoverRating || form.rating
                const isFilled = displayRating >= n
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setForm((f) => ({ ...f, rating: n }))
                      if (fieldErrors.rating) setFieldErrors((p) => ({ ...p, rating: null }))
                    }}
                    onMouseEnter={() => setHoverRating(n)}
                    className={`p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed ${
                      isFilled ? 'text-amber-500' : 'text-neutral-300 dark:text-neutral-600'
                    } ${!submitting ? 'hover:text-amber-400' : ''}`}
                    aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    aria-pressed={form.rating >= n}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
              Honnêteté appréciée — votre avis aide vraiment les autres.
            </p>
            {fieldErrors.rating && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.rating}</p>
            )}
          </div>

          <div>
            <label htmlFor="reviewBody" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Qu&apos;en avez-vous pensé ? *
            </label>
            <textarea
              id="reviewBody"
              required
              rows={4}
              maxLength={MAX_REVIEW_LENGTH}
              disabled={submitting}
              value={form.reviewBody}
              onChange={(e) => {
                const v = e.target.value
                if (v.length <= MAX_REVIEW_LENGTH) {
                  setForm((f) => ({ ...f, reviewBody: v }))
                  if (fieldErrors.reviewBody) setFieldErrors((p) => ({ ...p, reviewBody: null }))
                }
              }}
              onBlur={() => handleBlur('reviewBody')}
              placeholder="Ex : Livraison rapide, données exploitables tout de suite. Je recommande vivement !"
              className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-white dark:bg-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 resize-y disabled:opacity-60 disabled:cursor-not-allowed ${
                fieldErrors.reviewBody
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-400 dark:focus:ring-red-500'
                  : 'border-neutral-200 dark:border-neutral-800 focus:ring-neutral-400 dark:focus:ring-neutral-600'
              }`}
              aria-invalid={!!fieldErrors.reviewBody}
              aria-describedby={fieldErrors.reviewBody ? 'reviewBody-error' : undefined}
            />
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">
              Quelques mots suffisent. Écrivez comme vous parlez — authenticité &gt; perfection.
              {form.reviewBody.length > 0 && (
                <span className="ml-1">
                  ({form.reviewBody.length}/{MAX_REVIEW_LENGTH})
                </span>
              )}
            </p>
            {fieldErrors.reviewBody && (
              <p id="reviewBody-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.reviewBody}</p>
            )}
          </div>

          {error && (
            <div ref={errorRef} role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !(form.authorName || '').trim() ||
              !(form.linkedinUrl || '').trim() ||
              !form.productSlug ||
              form.rating < 1 ||
              !(form.reviewBody || '').trim()
            }
            className="w-full sm:w-auto px-8 py-3 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {submitting ? 'Envoi en cours...' : 'Partager mon expérience'}
          </button>
        </form>
      </div>
    </>
  )
}

export async function getServerSideProps({ query }) {
  const ref = query.ref
  const secret = process.env.MARKETPLACE_REVIEW_REF
  const valid = !!(secret && ref && ref === secret)

  let marketplaceProducts = []
  let reviewCount = 0
  let initialProductSlug = null
  let initialProductName = null
  if (valid) {
    try {
      const [{ getDatabasesAsTools }, { getMarketplaceReviews }] = await Promise.all([
        import('../../lib/marketplace-databases'),
        import('../../lib/marketplace-reviews')
      ])
      const [tools, reviews] = await Promise.all([
        getDatabasesAsTools(),
        getMarketplaceReviews()
      ])
      marketplaceProducts = tools
        .map((t) => ({ slug: t.slug, name: t.name, category: t.category }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      reviewCount = reviews.length
      const productSlug = (query.product || '').trim()
      if (productSlug) {
        const match = marketplaceProducts.find((p) => p.slug === productSlug)
        if (match) {
          initialProductSlug = match.slug
          initialProductName = match.name
        }
      }
    } catch (err) {
      console.warn('Erreur chargement données avis:', err?.message)
    }
  }

  return { props: { valid, marketplaceProducts, reviewCount, initialProductSlug, initialProductName } }
}
