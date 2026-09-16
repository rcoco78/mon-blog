import { pickArticleDoor } from '../lib/article-door.js'

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL', msg)
    process.exit(1)
  }
  console.log('ok', msg)
}

assert(pickArticleDoor({ title: 'Scraping Airbnb, scripts et listes' }) === 'datareacher', 'scraping → datareacher')
assert(pickArticleDoor({ title: 'Campagne Lemlist et outbound' }) === 'outreacher', 'lemlist → outreacher')
assert(pickArticleDoor({ title: 'Prospection, campagne outbound' }) === 'outreacher', 'prospection → outreacher')
assert(pickArticleDoor({ title: 'Notes du week-end' }) === 'datareacher', 'défaut → datareacher')
assert(
  pickArticleDoor({ title: 'Scraping LinkedIn pour une campagne Lemlist' }) === 'outreacher',
  'mixte lemlist → outreacher'
)
assert(
  pickArticleDoor({ tags: ['scraping'], metaDescription: 'extraction de données' }) === 'datareacher',
  'tags scraping → datareacher'
)

console.log('all article-door tests passed')
