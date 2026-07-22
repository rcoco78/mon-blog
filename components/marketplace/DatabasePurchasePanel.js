/**
 * Panneau d’achat — minimal, aligné sur l’identité du blog.
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
    <div className="space-y-3" id="acheter">
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        Paiement confirmé. Copiez {ids.length > 1 ? 'vos bases' : 'la base'} sur Google Sheets.
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
                className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:no-underline text-neutral-900 dark:text-neutral-100"
              >
                {ids.length > 1 ? `Copier « ${name} »` : 'Copier sur Google Sheets'} →
              </a>
            )
          }
          return (
            <a
              key={toolId}
              href={`mailto:corentinrobert648@gmail.com?subject=${encodeURIComponent(`Demande de base de données - ${name}`)}&body=${encodeURIComponent(`Hey je viens d'acheter la base "${name}" — peux-tu m'envoyer le lien Sheets ? Merci`)}`}
              className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:no-underline"
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

  return (
    <div className="space-y-5" id="acheter">
      <div className="flex gap-4 text-sm">
        <button
          type="button"
          onClick={() => setSubscriptionType('one-time')}
          disabled={isLoading}
          className={`pb-1 border-b-2 transition-colors ${
            subscriptionType === 'one-time'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-neutral-100 font-medium'
              : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          } disabled:opacity-50`}
        >
          Google Sheets
        </button>
        <button
          type="button"
          onClick={() => setSubscriptionType('api')}
          disabled={isLoading}
          className={`pb-1 border-b-2 transition-colors ${
            subscriptionType === 'api'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-neutral-100 font-medium'
              : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          } disabled:opacity-50`}
        >
          API Apify
        </button>
      </div>

      {subscriptionType === 'one-time' && addonDatabases.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Bundle : 2 bases −10 %, 3+ bases −15 %
          </p>
          <ul className="space-y-2">
            {addonDatabases.map((addon) => (
              <li key={addon.slug}>
                <label className="flex items-start gap-2 cursor-pointer text-sm">
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
                    className="mt-1 rounded border-neutral-300 dark:border-neutral-600"
                  />
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300">
                    {addon.name}
                  </span>
                  <span className="tabular-nums text-neutral-900 dark:text-neutral-100">
                    +{addon.price}€
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onUnlock}
        disabled={isLoading}
        className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? loadingStep || 'Redirection…'
          : subscriptionType === 'api'
            ? 'Demander l’accès API'
            : `Acheter — ${totalPriceLabel.replace(' TTC', '')}`}
      </button>

      <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
        {subscriptionType === 'api' ? (
          <p>
            Accès récurrent via Apify, données mises à jour automatiquement.
          </p>
        ) : (
          <>
            <p>
              Après paiement : lien pour copier la base dans votre Drive.
              Snapshot à la date indiquée — export CSV / Excel depuis Sheets.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              {priceLabel}
              {priceLabelHT ? ` · ${priceLabelHT}` : ''}
            </p>
            {selectedAddons.length > 0 && (
              <p className="text-xs">
                Code promo au checkout : <span className="font-medium text-neutral-900 dark:text-neutral-100">PROMO10</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
