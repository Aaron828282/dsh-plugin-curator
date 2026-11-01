/**
 * Client smoke test: load the browser half without a browser. A tiny React
 * stand-in lets the factory run, the slot registration be observed, and the tab
 * component be rendered once so an API drift throws here instead of blanking
 * the settings dialog.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const clientSource = source

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

/**
 * The panel is the product: render it once against a realistic snapshot and
 * check that every cv-* class it emits has a stylesheet rule. This catches a
 * redesign that ships unstyled markup or a layout that still depends on a
 * component the rewrite deleted.
 */
test('the panel renders structured markup with no unstyled classes', () => {
  const seeded = reactStub()
  const snapshot = {
    version: '0.2.0',
    enabled: true,
    today: '2026-11-01',
    generatedAt: Date.now(),
    nextRunAt: Date.now() + 3600_000,
    busy: false,
    settings: { llmEnabled: true, runsPerDay: 3, model: { provider: 'buddy', model: 'deepseek-v4.1-flash' } },
    profile: { windowDays: 7, totalCalls: 794, topTools: [{ name: 'ops_bash', calls: 620 }] },
    recommendations: Array.from({ length: 8 }, (_, index) => ({
      id: 'r' + index,
      name: 'dsh-sample-' + index,
      spec: 'dsh-sample-' + index,
      title: '示例插件 ' + index,
      description: '一段说明',
      score: 70 - index * 4,
      tier: 'proven',
      reasons: [{ code: 'term', zh: '命中你的常用词' }],
      modelPick: index < 3,
    })),
    installed: Array.from({ length: 17 }, (_, index) => ({
      name: 'plugin-' + index,
      title: '插件 ' + index,
      enabled: true,
      calls: index,
      tools: [],
      status: index === 0 ? 'active' : index < 8 ? 'watching' : 'unused',
    })),
    idle: [],
    gaps: [{ tag: 'session', label: '会话管理与检索', evidence: '默认关闭', suggestions: [] }],
    diff: { added: [], dropped: [], installed: [], removed: [] },
    conflicts: [],
    intents: [],
    modelStatus: { ok: true, reason: '' },
    events: [],
    coverage: { unique: 12030, verified: 41, sources: [{ id: 'official', kind: 'official', fetched: 8, total: 8, status: 'ok' }] },
    totals: { installed: 17, recommendations: 8, idle: 0, calls7: 794 },
  }

  // CuratorTab keeps its snapshot in the first state slot, so every slot
  // returns its own initial value except the first.
  let seen = 0
  seeded.useState = (initial) => {
    seen += 1
    if (seen === 1) return [snapshot, () => {}]
    return [typeof initial === 'function' ? initial() : initial, () => {}]
  }
  seeded.default = seeded

  const factory = loadFactory()
  const exports = factory((name) => (name === 'react' ? seeded : undefined))
  const registrations = []
  exports.apply({
    effect: (fn) => { fn() },
    locale: {
      register: () => () => {},
      bind: (ns) => (key) => ns + ':' + key,
      subscribe: () => () => {},
      getSnapshot: () => ({ active: 'zh-CN' }),
    },
    slots: {
      inject: (slot, register) => { register() },
      register: (meta, component) => { registrations.push({ meta, component }); return () => {} },
    },
  })

  const page = registrations.find((entry) => entry.meta.name === 'main')
  assert.ok(page, 'main panel registers')
  const injected = page.meta.inject()
  seen = 0
  const wrapper = page.component({ ...injected, t: (key) => key })
  assert.ok(wrapper && wrapper.children.length === 1, 'the wrapper renders the tab')
  const Tab = wrapper.children[0].type
  seen = 0
  const tree = Tab({ ...wrapper.children[0].props, t: (key) => key })

  const classes = new Set()
  let nodes = 0
  const walk = (node) => {
    if (node === null || node === undefined || node === false) return
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (typeof node !== 'object') return
    nodes += 1
    const className = node.props && node.props.className
    if (typeof className === 'string') {
      className.split(/\s+/).filter(Boolean).forEach((piece) => classes.add(piece))
    }
    walk(node.children)
  }
  walk(tree)

  assert.ok(nodes > 20, 'the panel renders a structure, not a single placeholder, got ' + nodes)
  assert.ok(classes.has('cv'), 'root class present')
  // Custom components stay uncompiled in this shallow render, so assert on
  // the class the panel owns rather than on the KPI children.
  assert.ok(classes.has('cv-grid4'), 'KPI band present')
  assert.ok(classes.has('cv-main'), 'main region present')

  // Every cv-* class the panel emits needs a rule in one of the stylesheet
  // constants. Scanning the whole source is enough: the only place a class
  // name appears with a leading dot is a CSS rule. Cell modifiers are data
  // hooks for the grid, not styling hooks, so they are exempt.
  const cssOnly = [...classes]
    .filter((piece) => piece.startsWith('cv-') && !piece.startsWith('cv-cell-'))
  const missing = cssOnly.filter((piece) => !clientSource.includes('.' + piece))
  assert.deepEqual(missing, [], 'every cv-* class used by the panel has a CSS rule')
})
