/**
 * Crée un coupon et un code promo dans Stripe via l'API
 *
 * Usage:
 *   node scripts/create-stripe-coupon.js
 *   node scripts/create-stripe-coupon.js --code PROMO10 --percent 10
 *   node scripts/create-stripe-coupon.js --code BIENVENUE --amount 20
 *
 * Options:
 *   --code CODE     Code promo affiché au client (défaut: PROMO10)
 *   --percent N     Remise en % (ex: 10 pour -10%)
 *   --amount N      Remise fixe en € (ex: 20 pour -20€)
 *   --dry-run       Affiche sans créer
 */

const path = require('path')
require('dotenv').config()
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
const Stripe = require('stripe')

const args = process.argv.slice(2)
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}
const isDryRun = args.includes('--dry-run')

const code = getArg('code', 'PROMO10')
const percent = parseInt(getArg('percent', '10'), 10)
const amount = parseInt(getArg('amount', '0'), 10)

const colors = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
function log(msg, c = 'reset') {
  console.log(`${colors[c]}${msg}${colors.reset}`)
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    log('❌ STRIPE_SECRET_KEY manquant dans .env.local', 'red')
    process.exit(1)
  }

  if (percent <= 0 && amount <= 0) {
    log('❌ Spécifiez --percent N ou --amount N', 'red')
    process.exit(1)
  }
  if (percent > 0 && amount > 0) {
    log('❌ Utilisez soit --percent soit --amount, pas les deux', 'red')
    process.exit(1)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })

  const couponParams = {
    name: `Code ${code}`,
    duration: 'once',
    ...(percent > 0 ? { percent_off: percent } : { amount_off: amount * 100, currency: 'eur' }),
  }

  if (isDryRun) {
    log('🔍 [DRY-RUN] Création prévue:', 'cyan')
    log(`   Coupon: ${JSON.stringify(couponParams, null, 2)}`)
    log(`   Code promo: ${code}`)
    return
  }

  try {
    const coupon = await stripe.coupons.create(couponParams)
    log(`✅ Coupon créé: ${coupon.id}`, 'green')

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(),
    })
    log(`✅ Code promo créé: ${promo.code}`, 'green')
    const isTest = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
    log(`   Mode Stripe: ${isTest ? 'TEST (localhost)' : 'LIVE (prod)'}`, 'cyan')
    log('')
    log('Le champ "Ajouter un code promo" apparaît dans Stripe Checkout (uniquement marketplace).', 'cyan')
    log(`Scroll vers le bas de la page paiement et cliquez sur "Ajouter un code promo" pour taper: ${promo.code}`, 'cyan')
  } catch (err) {
    if (err.code === 'resource_already_exists' || err.message?.includes('already exists')) {
      log(`⚠️ Un code promo "${code}" existe déjà. Créez-en un nouveau avec --code AUTREPROMO`, 'yellow')
    } else {
      log(`❌ Erreur Stripe: ${err.message}`, 'red')
    }
    process.exit(1)
  }
}

main()
