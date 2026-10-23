/**
 * Client smoke test: load the browser half without a browser. A tiny React
 * stand-in lets the factory run, the slot registration be observed, and the tab
 * component be rendered once so an API drift throws here instead of blanking
 * the settings dialog.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')

function reactStub() {
  const createElement = (type, props, ...children) => ({ type, props: props ?? {}, children })
  const React = {
    createElement,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useRef: (value) => ({ current: value }),
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  }
  React.default = React
  return React
}

function loadFactory() {
  let captured = null
  const window = { __ModuleLoader__: { load: (registration) => { captured = registration } } }
  runInNewContext(source, { window, console, fetch: async () => ({ ok: false, status: 0, json: async () => null }) })
  assert.ok(captured, 'the factory registered with the module loader')
  assert.equal(captured.id, 'dsh-plugin-curator')
  return captured.factory
}

test('the factory registers under the module loader id', () => {
  const factory = loadFactory()
  const exports = factory((name) => {
    if (name === 'react') return reactStub()
    throw new Error('unexpected require: ' + name)
  })
  assert.equal(Array.from(exports.inject).join(','), 'slots,locale')
  assert.equal(typeof exports.apply, 'function')
})

test('apply registers one tab into the plugins settings section', () => {
  const factory = loadFactory()
  const exports = factory((name) => (name === 'react' ? reactStub() : undefined))

  const registrations = []
  const slotsInjected = []
  const ctx = {
    effect: (fn) => { fn() },
    locale: {
      register: () => () => {},
      bind: (ns) => (key) => ns + ':' + key,
      subscribe: () => () => {},
      getSnapshot: () => ({ active: 'zh-CN' }),
    },
    slots: {
      inject: (slot, register) => { slotsInjected.push(slot); register() },
      register: (meta, component) => {
        registrations.push({ meta, component })
        return () => {}
      },
    },
  }
  exports.apply(ctx)

  assert.deepEqual(slotsInjected.sort(), ['settings.plugins.tab', 'sidebar.panellist'])

  const tab = registrations.find((entry) => entry.meta.name === 'settings.plugins.tab')
  const row = registrations.find((entry) => entry.meta.name === 'sidebar.panellist')
  const page = registrations.find((entry) => entry.meta.name === 'main')
  assert.ok(tab && row && page, 'tab, sidebar row and main panel must all register')
  assert.equal(tab.meta.id, 'plugin-curator')
  assert.equal(tab.meta.order, 55)
  assert.equal(row.meta.id, 'plugin-curator')
  assert.equal(typeof row.meta.label(), 'string')
  assert.equal(page.meta.key, 'plugin-curator')

  const injected = tab.meta.inject()
  assert.equal(typeof injected.t, 'function')

  // Render once: the component must not throw on an empty snapshot.
  const tree = tab.component(injected)
  assert.ok(tree && typeof tree === 'object')
  assert.ok(JSON.stringify(tree, (key, value) => (typeof value === 'function' ? '[fn]' : value)).length > 0)
})
