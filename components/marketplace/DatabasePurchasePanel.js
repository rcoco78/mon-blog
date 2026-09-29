/**
 * Panneau d’achat — une colonne, pleine largeur du blog.
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
    <div className="space-y-4" id="acheter">
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        Paiement confirmé
      </p>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
        Copiez {ids.length > 1 ? 'vos bases' : 'la base'} sur Google Sheets, puis Fichier → Créer
        une copie pour l’enregistrer dans votre Drive.
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
                className="flex w-full items-center justify-center px-5 py-3 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                {ids.length > 1 ? `Copier « ${name} »` : 'Copier sur Google Sheets'}
              </a>
            )
          }
          return (
            <a
              key={toolId}
              href={`mailto:hello@corentinrobert.fr?subject=${encodeURIComponent(`Demande de base de données - ${name}`)}&body=${encodeURIComponent(`Hey je viens d'acheter la base "${name}" — peux-tu m'envoyer le lien Sheets ? Merci`)}`}
              className="flex w-full items-center justify-center px-5 py-3 text-sm font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              Demander le lien — {name}
            </a>
          )
        })}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Export CSV / Excel disponible ensuite depuis Sheets.
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
  selectedAddons,
  setSelectedAddons,
  isLoading,
  loadingStep,
  onUnlock,
  totalPriceLabel,
  priceLabel,
  priceLabelHT,
  pack,
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

  const displayPrice = totalPriceLabel || priceLabel

  return (
    <div className="space-y-5" id="acheter">
      <div>
        <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
          {displayPrice}
        </p>
        {priceLabelHT && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500 tabular-nums">
            {priceLabelHT}
          </p>
        )}
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          paiement unique · livré tout de suite
        </p>
      </div>

      {addonDatabases.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Bundle : 2 bases −10 %, 3+ bases −15 %
          </p>
          <ul className="space-y-2">
            {addonDatabases.map((addon) => (
              <li key={addon.slug}>
                <label className="flex items-start gap-2.5 cursor-pointer text-sm">
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
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300 min-w-0">
                    {addon.name}
                  </span>
                  <span className="tabular-nums text-neutral-900 dark:text-neutral-100 whitespace-nowrap text-right">
                    +{addon.price} € HT
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
        className="flex w-full items-center justify-center px-5 py-3.5 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? loadingStep || 'Redirection…' : 'Acheter et recevoir le Sheet'}
      </button>

      {pack?.href && (
        <p className="text-sm">
          <a
            href={pack.href}
            className="underline underline-offset-4 hover:no-underline text-neutral-900 dark:text-neutral-100"
          >
            {pack.label}
          </a>
        </p>
      )}

      <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1.5 leading-relaxed">
        <p>
          Après paiement, un lien copie la base dans votre Drive. Vous exportez ensuite en CSV ou Excel depuis Sheets.
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          pas d’abonnement
        </p>
        {selectedAddons.length > 0 && (
          <p className="text-xs">
            Code promo au checkout :{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">PROMO10</span>
          </p>
        )}
      </div>
    </div>
  )
}
