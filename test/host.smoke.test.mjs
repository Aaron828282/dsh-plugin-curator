/**
 * Host smoke test: boot the plugin against a stub Cordis context and drive the
 * HTTP surface the Client tab uses. No DSH runtime is required, so this runs in
 * plain node and catches API-shape regressions early.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const home = await mkdtemp(join(tmpdir(), 'curator-'))
process.env.DSH_HOME = home

const { apply, normalizeConfig } = await import('../index.js')

function stubContext({ bundles = [], prompts = [] } = {}) {
  const routes = []
  const tools = []
  const listeners = new Map()
  const effects = []
  const ctx = {
    logger: { info() {}, warn() {} },
    effect(fn) {
      const dispose = fn()
      if (typeof dispose === 'function') effects.push(dispose)
    },
    on(event, handler) {
      listeners.set(event, [...(listeners.get(event) ?? []), handler])
      return () => {}
    },
    inject(deps, callback) {
      if (deps.includes('tools')) callback({ tools: { register: (definition) => tools.push(definition) } })
      return { then() {} }
    },
    interval() {
      return () => {}
    },
    timeout() {
      return () => {}
    },
    get(name) {
      if (name === 'pluginManager') {
        return {
          listBundles: async () => bundles,
          installBundle: async (spec) => ({ application: 'applied', spec }),
          removeBundle: async () => ({ application: 'applied' }),
          setBundleEnabled: async () => ({ application: 'applied' }),
        }
      }
      if (name === 'sessionQuery' && prompts.length > 0) {
        return {
          listSessions: async () => [{ header: { id: 's1', updatedAt: Date.now(), createdAt: Date.now() } }],
          filterEvents: async () => prompts.map((text, index) => ({ seq: index, text })),
        }
      }
      return undefined
    },
    webServer: {
      register(route) {
        routes.push(route)
        return () => {}
      },
    },
    listeners,
    routes,
    tools,
    effects,
  }
  return ctx
}

function fakeResponse() {
  const chunks = []
  const response = {
    status: 0,
    headers: {},
    writeHead(status, headers) {
      response.status = status
      response.headers = headers ?? {}
    },
    end(body) {
      if (body !== undefined) chunks.push(String(body))
    },
    body() {
      return chunks.join('')
    },
  }
  return response
}

async function waitFor(predicate, timeoutMs = 15_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return true
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return false
}

test('config normalization clamps and defaults', () => {
  const config = normalizeConfig({ dailyHour: 99, idleDays: 1, autoInstall: 'yes' })
  assert.equal(config.dailyHour, 23)
  assert.equal(config.idleDays, 3)
  assert.equal(config.autoInstall, false)
  assert.deepEqual(config.sources.length > 0, true)
})

test('apply registers a loopback state route, the tool and the timer', async () => {
  const ctx = stubContext({
    bundles: [
      { name: 'dsh-ops', installed: true, enabled: true, removable: true, version: '0.4.1', rows: [{ rowId: 'ops-shell' }] },
      { name: 'dshmarket', installed: true, enabled: true, removable: true, version: '1.66.47', rows: [{ rowId: 'dsh-market' }] },
    ],
  })
  apply(ctx, { npmSearch: false, githubSearch: false, sources: [] })

  assert.equal(ctx.routes.length, 1)
  assert.equal(ctx.routes[0].kind, 'prefix')
  assert.equal(ctx.routes[0].path, '/plugin-curator/api')
  assert.equal(ctx.tools.length, 1)
  assert.equal(ctx.tools[0].name, 'plugin_curator_status')
  assert.ok(ctx.listeners.has('tools/result'))

  const response = fakeResponse()
  ctx.routes[0].handler({ method: 'GET', url: '/plugin-curator/api/state', headers: { host: '127.0.0.1:49414' } }, response)
  assert.ok(await waitFor(() => response.status !== 0))
  assert.equal(response.status, 200)
  const payload = JSON.parse(response.body())
  assert.equal(payload.ok, true)
  assert.equal(Array.isArray(payload.value.installed), true)
  assert.equal(payload.value.settings.autoInstall, false)
  assert.equal(payload.value.today.length, 10)
})

test('refresh action builds the report from the manager inventory', async () => {
  const ctx = stubContext({
    bundles: [
      { name: 'dsh-ops', installed: true, enabled: true, removable: true, version: '0.4.1', rows: [{ rowId: 'ops-shell' }] },
      { name: 'dshmarket', installed: true, enabled: true, removable: true, version: '1.66.47', rows: [{ rowId: 'dsh-market' }] },
      { name: '@deepseek-ai/dsh-base', installed: true, enabled: true, removable: false },
    ],
  })
  apply(ctx, { npmSearch: false, githubSearch: false, sources: [], dailyHour: 0 })

  const response = fakeResponse()
  // Feed the JSON body the handler reads from the request stream.
  const request = (async function* () {
    yield Buffer.from(JSON.stringify({ action: 'refresh' }))
  })()
  request.method = 'POST'
  request.url = '/plugin-curator/api/action'
  request.headers = { host: '127.0.0.1:49414', 'content-type': 'application/json' }
  ctx.routes[0].handler(request, response)
  assert.ok(await waitFor(() => response.status !== 0, 20_000))
  assert.equal(response.status, 200)
  const payload = JSON.parse(response.body())
  assert.equal(payload.ok, true)
  assert.equal(payload.value.installed.length, 3)
  assert.deepEqual(payload.value.installed.map((item) => item.name).includes('@deepseek-ai/dsh-base'), true)
})

test('a foreign host is refused before any work runs', async () => {
  const ctx = stubContext()
  apply(ctx, {})
  const response = fakeResponse()
  ctx.routes[0].handler({ method: 'GET', url: '/plugin-curator/api/state', headers: { host: 'evil.example:49414' } }, response)
  assert.equal(response.status, 403)
  assert.equal(JSON.parse(response.body()).ok, false)
})

test('usage events feed the work profile', async () => {
  const ctx = stubContext()
  apply(ctx, { npmSearch: false, githubSearch: false, sources: [], dailyHour: 0 })
  const refresh = async () => {
    const response = fakeResponse()
    const request = (async function* () {
      yield Buffer.from(JSON.stringify({ action: 'refresh' }))
    })()
    request.method = 'POST'
    request.url = '/plugin-curator/api/action'
    request.headers = { host: '127.0.0.1:49414' }
    ctx.routes[0].handler(request, response)
    assert.ok(await waitFor(() => response.status !== 0, 20_000))
    return JSON.parse(response.body())
  }
  await refresh()
  for (const name of ['read', 'read', 'bash', 'office_docx']) {
    for (const handler of ctx.listeners.get('tools/result') ?? []) handler({ name })
  }
  await refresh()
  const tool = await ctx.tools[0].execute({})
  assert.equal(tool.topTools.includes('read (2)'), true)
  assert.equal(tool.topTools.length >= 2, true)
})
test('repeated capability asks become an open gap', async () => {
  const ctx = stubContext({
    bundles: [{ name: 'dsh-ops', installed: true, enabled: true, removable: true, version: '0.4.1', rows: [] }],
    prompts: [
      'Harness 当前是否有这个会话记忆自进化的能力？就是全局会话记忆自进化的能力？',
      '我希望它能记住上次的项目约定，不用每次重新说一遍',
    ],
  })
  apply(ctx, { npmSearch: false, githubSearch: false, sources: [], dailyHour: 0 })
  const response = fakeResponse()
  const request = (async function* () {
    yield Buffer.from(JSON.stringify({ action: 'refresh' }))
  })()
  request.method = 'POST'
  request.url = '/plugin-curator/api/action'
  request.headers = { host: '127.0.0.1:49414' }
  ctx.routes[0].handler(request, response)
  assert.ok(await waitFor(() => response.status !== 0, 20_000))
  const payload = JSON.parse(response.body())
  assert.equal(payload.ok, true)
  const tags = (payload.value.gaps ?? []).map((gap) => gap.tag)
  assert.ok(tags.includes('memory'), 'expected a memory gap, got ' + JSON.stringify(tags))
  const gap = payload.value.gaps.find((item) => item.tag === 'memory')
  assert.ok(gap.sessions >= 1)
  assert.ok(gap.evidence.length > 0)
})
test('every gap is attributable and every recommendation explains itself', async () => {
  const ctx = stubContext({
    bundles: [{ name: 'dsh-ops', installed: true, enabled: true, removable: true, version: '0.4.1', rows: [] }],
  })
  apply(ctx, { npmSearch: false, githubSearch: false, sources: [], dailyHour: 0 })
  const response = fakeResponse()
  const request = (async function* () {
    yield Buffer.from(JSON.stringify({ action: 'refresh' }))
  })()
  request.method = 'POST'
  request.url = '/plugin-curator/api/action'
  request.headers = { host: '127.0.0.1:49414' }
  ctx.routes[0].handler(request, response)
  assert.ok(await waitFor(() => response.status !== 0, 20_000))
  const payload = JSON.parse(response.body())
  const tags = (payload.value.gaps ?? []).map((gap) => gap.tag)
  assert.ok(tags.includes('memory'), 'baseline memory gap expected, got ' + JSON.stringify(tags))
  const memory = payload.value.gaps.find((gap) => gap.tag === 'memory')
  assert.equal(memory.source, 'baseline')
  assert.ok(memory.evidence.length > 0)
})
