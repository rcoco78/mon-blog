const { createRequire } = require('module')
const vm = require('vm')
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'lib', 'posthog-events.js')
let code = fs.readFileSync(file, 'utf8')
code = code
  .replace(/^export const /gm, 'const ')
  .replace(/^export function /gm, 'function ')
code += '\n;this.result = { FLOW, EVENT, EVENT_FLOW, FUNNELS, enrichEventProperties }'

const sandbox = {}
vm.runInNewContext(code, sandbox)
const catalog = sandbox.result
if (!catalog || !catalog.FUNNELS) {
  throw new Error('Catalogue PostHog illisible')
}

const requiredEvents = [
  'cta_clicked',
  'calendly_opened',
  'calendly_scheduled',
  'newsletter_subscribed',
  'checkout_started',
  'purchase_completed',
  'contact_submitted',
  'faq_opened',
]

for (const name of requiredEvents) {
  const values = Object.values(catalog.EVENT)
  if (!values.includes(name)) {
    throw new Error(`Event manquant: ${name}`)
  }
}

const funnelKeys = catalog.FUNNELS.map((f) => f.key).sort().join(',')
if (funnelKeys !== 'freelance,journal,marketplace,newsletter') {
  throw new Error(`Funnels inattendus: ${funnelKeys}`)
}

for (const funnel of catalog.FUNNELS) {
  if (!funnel.steps.includes(catalog.EVENT.ctaClicked) && funnel.key !== 'journal') {
    // journal n'a que cta_clicked, already includes it
  }
  if (funnel.steps.length < 1) {
    throw new Error(`Funnel vide: ${funnel.key}`)
  }
  const withFlow = catalog.enrichEventProperties(funnel.steps[funnel.steps.length - 1], {})
  if (funnel.key !== 'journal' && withFlow.flow !== funnel.filter.flow && funnel.steps.at(-1) !== catalog.EVENT.ctaClicked) {
    const last = funnel.steps.at(-1)
    const enriched = catalog.enrichEventProperties(last, {})
    if (enriched.flow !== funnel.filter.flow) {
      throw new Error(`Flow mismatch ${funnel.key} event ${last} => ${enriched.flow}`)
    }
  }
}

const freelance = catalog.enrichEventProperties('calendly_scheduled', { source: 'home' })
if (freelance.flow !== 'freelance' || freelance.source !== 'home') {
  throw new Error('enrichEventProperties freelance KO')
}

const cta = catalog.enrichEventProperties('cta_clicked', { flow: 'marketplace', cta: 'checkout' })
if (cta.flow !== 'marketplace') {
  throw new Error('cta_clicked flow override KO')
}

console.log('ok', catalog.FUNNELS.map((f) => `${f.key}:${f.steps.join('>')}`).join(' | '))
