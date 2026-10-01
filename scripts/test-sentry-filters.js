/**
 * Tests des filtres Sentry (CJS loader : lib/sentry-filters.js est en ESM).
 */
const fs = require('fs')
const path = require('path')
const Module = require('module')
const test = require('node:test')
const assert = require('node:assert/strict')

function loadFilters() {
  const filename = path.resolve(__dirname, '../lib/sentry-filters.js')
  const src =
    fs.readFileSync(filename, 'utf8').replace(/^export /gm, '') +
    '\nmodule.exports = { isNativeWebViewBridgeNoise, isNextSameUrlNavigationNoise, isNextSameUrlNavigationMessage, shouldDropSentryEvent }'
  const m = new Module(filename)
  m.filename = filename
  m.paths = Module._nodeModulePaths(path.dirname(filename))
  m._compile(src, filename)
  return m.exports
}

const {
  isNativeWebViewBridgeNoise,
  isNextSameUrlNavigationNoise,
  isNextSameUrlNavigationMessage,
  shouldDropSentryEvent,
} = loadFilters()

function exceptionEvent(value, type = 'Error') {
  return { exception: { values: [{ type, value }] } }
}

test('drop Instagram Android Java-bridge noise', () => {
  assert.equal(
    shouldDropSentryEvent(
      exceptionEvent('Error invoking postMessage: Java object is gone')
    ),
    true
  )
  assert.equal(isNativeWebViewBridgeNoise(exceptionEvent('Java object is gone')), true)
})

test('drop Next same-URL hard navigation (CORENTIN-BLOG-A)', () => {
  const value =
    'Invariant: attempted to hard navigate to the same URL /?utm_source=ig https://www.example.com/?utm_source=ig'
  assert.equal(isNextSameUrlNavigationMessage(value), true)
  assert.equal(isNextSameUrlNavigationNoise(exceptionEvent(value)), true)
  assert.equal(shouldDropSentryEvent(exceptionEvent(value)), true)
})

test('keep a real application error', () => {
  assert.equal(shouldDropSentryEvent(exceptionEvent('TypeError: x is not a function')), false)
  assert.equal(isNativeWebViewBridgeNoise(exceptionEvent('TypeError: x is not a function')), false)
})
