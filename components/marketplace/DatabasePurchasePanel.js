/**
 * Panneau d’achat / livraison pour une fiche base de données marketplace.
 */

function resolvePurchasedDb(toolId, database, addonDatabases = [], relatedDatabases = []) {
  if (toolId === database.slug) return database
  return (
    addonDatabases.find((a) => a.slug === toolId) ||
    relatedDatabases?.find((r) => r.slug === toolId) ||
    null
  )
}

function DeliverySuccess({
  purchasedToolIds,
  database,
  addonDatabases = [],
  relatedDatabases = [],
  deliveryUrls = {},
}) {
  const ids = purchasedToolIds.length > 0 ? purchasedToolIds : [database.slug]

  return (
    <div className="p-4 rounded-md bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Paiement confirmé. Copiez {ids.length > 1 ? 'vos bases' : 'la base'} sur Google Sheets :
      </p>
      <div className="space-y-2">
        {ids.map((toolId) => {
          const db = resolvePurchasedDb(toolId, database, addonDatabases, relatedDatabases)
          const name = db?.name || toolId
          const copyUrl = deliveryUrls[toolId] || null
          if (copyUrl) {
            return (
              <a
                key={toolId}
                href={copyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors w-full sm:w-fit"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {ids.length > 1 ? `Copier « ${name} »` : 'Copier sur Google Sheets'}
              </a>
            )
          }
          return (
            <a
              key={toolId}
              href={`mailto:corentinrobert648@gmail.com?subject=${encodeURIComponent(`Demande de base de données - ${name}`)}&body=${encodeURIComponent(`Hey je viens d'acheter la base "${name}" — peux-tu m'envoyer le lien Sheets ? Merci`)}`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors w-full sm:w-fit"
            >
              Demander le lien — {name}
            </a>
          )
        })}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Un clic ouvre une copie dans votre Drive. Export CSV / Excel depuis Sheets ensuite.
      </p>
    </div>
  )
}

export default function DatabasePurchasePanel({
  database,
  addonDatabases = [],
  relatedDatabases = [],
  paymentVerified,
  purchasedToolIds = [],
  deliveryUrls = {},
  subscriptionType,
  setSubscriptionType,
  selectedAddons,
  setSelectedAddons,
  isLoading,
  loadingStep,
  onUnlock,
  totalPriceLabel,
  priceLabel,
  priceLabelHT,
  compact = false,
}) {
  if (paymentVerified) {
    return (
      <DeliverySuccess
        purchasedToolIds={purchasedToolIds}
        database={database}
        addonDatabases={addonDatabases}
        relatedDatabases={relatedDatabases}
        deliveryUrls={deliveryUrls}
      />
    )
  }

  const buttonClass = compact
    ? 'w-full px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium relative overflow-hidden'
    : 'w-full px-6 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium relative overflow-hidden'

  return (
    <div className="space-y-4" id="acheter">
      <div className="flex items-center justify-between p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setSubscriptionType('one-time')}
          disabled={isLoading}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            subscriptionType === 'one-time'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          } disabled:opacity-50`}
        >
          Google Sheets
        </button>
        <button
          type="button"
          onClick={() => setSubscriptionType('api')}
          disabled={isLoading}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
            subscriptionType === 'api'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
          } disabled:opacity-50`}
        >
          API (Apify)
        </button>
      </div>

      {subscriptionType === 'one-time' && addonDatabases.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Bundle : 2 bases −10 %, 3+ bases −15 %
          </p>
          <div className="space-y-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50">
            {addonDatabases.map((addon) => (
              <label
                key={addon.slug}
                className="flex items-center justify-between gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedAddons.includes(addon.slug)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAddons((prev) => [...prev, addon.slug])
                    } else {
                      setSelectedAddons((prev) => prev.filter((s) => s !== addon.slug))
                    }
                  }}
                  className="rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 focus:ring-neutral-500"
                />
                <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                  {addon.name}
                </span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  +{addon.price}€
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onUnlock}
        disabled={isLoading}
        className={buttonClass}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {loadingStep || 'Redirection...'}
          </span>
        ) : (
          <div className="text-center">
            <div className="font-semibold">
              {subscriptionType === 'api'
                ? 'Demander l’accès API'
                : `Acheter — ${totalPriceLabel.replace(' TTC', '')}`}
            </div>
            <div className="text-xs opacity-70 mt-0.5">
              {subscriptionType === 'api'
                ? 'Mises à jour continues via Apify'
                : 'Accès immédiat · Google Sheets'}
            </div>
          </div>
        )}
      </button>

      <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
        {subscriptionType === 'api' ? (
          <>
            <p>
              <strong className="text-neutral-700 dark:text-neutral-300">API Apify :</strong>{' '}
              script qui récupère et met à jour les données régulièrement.
            </p>
            <p className="text-neutral-500 dark:text-neutral-500">
              Idéal si vous avez besoin d’un flux à jour, pas d’un export ponctuel.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong className="text-neutral-700 dark:text-neutral-300">Achat unique :</strong>{' '}
              après paiement, lien pour copier la base complète dans votre Google Drive.
            </p>
            <p className="text-neutral-500 dark:text-neutral-500">
              Snapshot à la date indiquée. Export CSV / Excel depuis Sheets.
            </p>
            {selectedAddons.length > 0 && (
              <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm font-medium">
                Code promo au checkout : <span className="text-neutral-900 dark:text-neutral-100">PROMO10</span> (−10 %)
              </p>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 text-sm pt-1 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-neutral-500 dark:text-neutral-500 block">Google Sheets</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Snapshot à l’achat</span>
          </div>
          <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
            <div>{priceLabel}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500">{priceLabelHT}</div>
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-neutral-500 dark:text-neutral-500 block">API Apify</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Mises à jour continues</span>
          </div>
          <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">
            Sur devis
          </span>
        </div>
      </div>
    </div>
  )
}
