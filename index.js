/**
 * dsh-plugin-curator — Host half.
 *
 * Once a day it rebuilds a shortlist from public plugin indexes scored against
 * the last week of tool traffic, checks installed bundles for updates and long
 * idle periods, and persists the result under the DSH home. The Client tab
 * reads it over a loopback JSON route and performs install / enable / remove
 * through the official pluginManager service.
 *
 * Install and remove are user actions: the agent-facing tool is read-only.
 */

import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import {
  DAY_MS,
  DEFAULT_REGISTRIES,
  PROTECTED_BUNDLES,
  buildAttribution,
  buildIdle,
  buildProfile,
  buildSuggestions,
  BASELINE_GAPS,
  attributeToolErrors,
  baselineGaps,
  failingTool,
  capabilityTags,
  groupOverlaps,
  matchesBaseline,
  detectIntents,
  installHint,
  useHint,
  openGaps,
  qualityTier,
  queryTokens,
  searchCatalog,
  clamp,
  dateKey,
  daysBetween,
  isNewerVersion,
  mergeCandidates,
  normalizeGithubSearch,
  normalizeMarketIndex,
  normalizeNpmSearch,
  normalizeRegistry,
  parseDateKey,
  pickText,
  scoreCandidate,
  specKind,
} from './core.js'

export const name = 'plugin-curator'

/** Mandatory seats: the HTTP route and the timer helpers the daily tick uses. */
export const inject = ['webServer', 'timer']

const VERSION = '0.2.0'
const ROUTE_PREFIX = '/plugin-curator/api'
const MAX_BODY_BYTES = 64 * 1024
const USAGE_RETENTION_DAYS = 90
const MAX_EVENTS = 30

const DEFAULTS = {
  dailyHour: 9,
  idleDays: 30,
  maxRecommendations: 8,
  autoInstall: false,
  autoInstallMinScore: 85,
  autoInstallMax: 2,
  npmSearch: true,
  npmPages: 16,
  npmDelayMs: 200,
  npmQueries: ['keywords:dsh-plugin', 'keywords:deepseek-harness'],
  githubSearch: true,
  githubPages: 2,
  githubToken: '',
  validateTop: 40,
  minDownloads: 100,
  minStars: 5,
  newPluginDays: 14,
  emergingMax: 2,
  intentEnabled: true,
  baselineGaps: true,
  llmEnabled: false,
  model: { provider: '', model: '', supportsVision: false, reasoningEffort: '' },
  runsPerDay: 3,
  intentDays: 14,
  intentSessions: 8,
  intentMinHits: 1,
  sources: DEFAULT_REGISTRIES,
  marketIndexes: [],
  excluded: [],
  toolOwners: [],
}

function intOr(value, fallback, min, max) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return clamp(n, min, max)
}

/** Accept both the YAML shape and a raw JSON object; always returns complete settings. */
export function normalizeConfig(value) {
  const raw = value !== null && typeof value === 'object' ? value : {}
  return {
    dailyHour: intOr(raw.dailyHour, DEFAULTS.dailyHour, 0, 23),
    idleDays: intOr(raw.idleDays, DEFAULTS.idleDays, 3, 365),
    maxRecommendations: intOr(raw.maxRecommendations, DEFAULTS.maxRecommendations, 1, 20),
    autoInstall: raw.autoInstall === true,
    autoInstallMinScore: intOr(raw.autoInstallMinScore, DEFAULTS.autoInstallMinScore, 0, 100),
    autoInstallMax: intOr(raw.autoInstallMax, DEFAULTS.autoInstallMax, 0, 5),
    npmSearch: raw.npmSearch !== false,
    npmPages: intOr(raw.npmPages, DEFAULTS.npmPages, 1, 60),
    npmDelayMs: intOr(raw.npmDelayMs, DEFAULTS.npmDelayMs, 0, 5000),
    npmQueries:
      Array.isArray(raw.npmQueries) && raw.npmQueries.length > 0
        ? raw.npmQueries.map(String).filter((item) => item !== '')
        : DEFAULTS.npmQueries,
    githubSearch: raw.githubSearch !== false,
    githubPages: intOr(raw.githubPages, DEFAULTS.githubPages, 1, 3),
    validateTop: intOr(raw.validateTop, DEFAULTS.validateTop, 1, 120),
    minDownloads: intOr(raw.minDownloads, DEFAULTS.minDownloads, 0, 100000),
    minStars: intOr(raw.minStars, DEFAULTS.minStars, 0, 100000),
    newPluginDays: intOr(raw.newPluginDays, DEFAULTS.newPluginDays, 1, 90),
    emergingMax: intOr(raw.emergingMax, DEFAULTS.emergingMax, 0, 10),
    intentEnabled: raw.intentEnabled !== false,
    baselineGaps: raw.baselineGaps !== false,
    llmEnabled: raw.llmEnabled === true,
    model:
      raw.model !== null && typeof raw.model === 'object'
        ? {
          provider: String(raw.model.provider ?? ''),
          model: String(raw.model.model ?? ''),
          supportsVision: raw.model.supportsVision === true,
          reasoningEffort: typeof raw.model.reasoningEffort === 'string' ? raw.model.reasoningEffort : '',
        }
        : { provider: '', model: '', supportsVision: false, reasoningEffort: '' },
    runsPerDay: intOr(raw.runsPerDay, DEFAULTS.runsPerDay, 1, 24),
    intentDays: intOr(raw.intentDays, DEFAULTS.intentDays, 1, 90),
    intentSessions: intOr(raw.intentSessions, DEFAULTS.intentSessions, 1, 40),
    intentMinHits: intOr(raw.intentMinHits, DEFAULTS.intentMinHits, 1, 20),
    githubToken: typeof raw.githubToken === 'string' ? raw.githubToken : '',
    // An absent field means the shipped index; an explicit empty list means none.
    sources: Array.isArray(raw.sources)
      ? raw.sources.map(String).filter((item) => item !== '')
      : DEFAULT_REGISTRIES,
    marketIndexes: Array.isArray(raw.marketIndexes)
      ? raw.marketIndexes.map(String).filter((item) => item !== '')
      : DEFAULTS.marketIndexes,
    excluded: Array.isArray(raw.excluded) ? raw.excluded.map((item) => String(item).toLowerCase()) : [],
    toolOwners: Array.isArray(raw.toolOwners) ? raw.toolOwners : [],
  }
}

/** Standard-schema validator so the Loader validates without a runtime dependency. */
export const Config = {
  '~standard': {
    version: 1,
    vendor: 'dsh-plugin-curator',
    validate(value) {
      try {
        return { value: normalizeConfig(value) }
      } catch (error) {
        return { issues: [{ message: error instanceof Error ? error.message : String(error) }] }
      }
    },
  },
}

function defaultState() {
  return {
    schemaVersion: 1,
    createdAt: Date.now(),
    updatedAt: 0,
    lastRunDate: '',
    lastRunAt: 0,
    lastRunReason: '',
    workProfile: null,
    recommendations: [],
    installed: [],
    idle: [],
    suggestions: {},
    updates: {},
    attribution: {},
    sourceStatus: [],
    firstSeen: {},
    dismissed: {},
    snoozed: {},
    shortlist: [],
    rotationSeen: [],
    usage: { days: {} },
    events: [],
    coverage: null,
    intents: [],
    gaps: [],
    diff: null,
    conflicts: [],
    lastRecommendationIds: [],
    lastInstalledNames: [],
    modelStatus: null,
    modelPicks: [],
    translations: {},
    intentScanned: 0,
    pain: null,
  }
}

/** Model replies name packages loosely: strip scope, "dsh-" and punctuation. */
function normalizePickName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/^@[^/]+\//, '')
    .replace(/^dsh-/, '')
    .replace(/[^a-z0-9]+/g, '')
}

/** Package name of a spec, lowercased, without version or git noise. */
function pkgName(spec) {
  const text = String(spec ?? '').trim().toLowerCase()
  if (text === '') return ''
  const scoped = /^(@[^/]+\/[^@]+)/.exec(text)
  if (scoped !== null) return scoped[1]
  const plain = /^([a-z0-9._-]+)/.exec(text)
  return plain === null ? text : plain[1]
}

/** Pull the first JSON object out of a model reply that may carry prose fences. */
function parseJsonBlock(text) {
  const source = String(text ?? '')
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(source.slice(start, end + 1))
  } catch {
    return null
  }
}

function errorMessage(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

async function fetchJson(url, { timeoutMs = 20_000, headers = {} } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'dsh-plugin-curator/' + VERSION,
        ...headers,
      },
    })
    if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + url)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** npm's search endpoint rate-limits bursts: pace pages and retry a 429 once. */
async function fetchJsonPaced(url, options = {}) {
  try {
    return await fetchJson(url, options)
  } catch (error) {
    if (!String(errorMessage(error)).includes('429')) throw error
    await sleep(3000)
    return fetchJson(url, options)
  }
}

/** Bound a promise that talks to a model or the network: a stuck call must not wedge the plugin. */
function withTimeout(promise, ms, label) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error((label || 'operation') + ' timed out after ' + ms + 'ms')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = new Array(Math.max(1, Math.min(limit, items.length))).fill(null).map(async () => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await mapper(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

export function apply(ctx, rawConfig) {
  const stateDir = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'plugin-curator')
  const stateFile = join(stateDir, 'state.json')
  const catalogFile = join(stateDir, 'catalog.json')
  const reportDir = join(stateDir, 'reports')

  const config = normalizeConfig(rawConfig)
  const userConfig = {}
  let state = defaultState()
  let loaded = false
  let dirty = false
  let saveTimer = null
  let busy = null
  const packumentCache = new Map()
  let lastPool = []
  const gapTagCache = new Map()

  const log = (message) => ctx.logger?.info?.('[plugin-curator] ' + message)
  const warn = (message) => ctx.logger?.warn?.('[plugin-curator] ' + message)
  const settings = () => ({ ...config, ...userConfig })

  /** The manager is optional: the curator still reports without it. */
  function manager() {
    try {
      const engine = ctx.get('pluginManager')
      return engine === null ? undefined : engine
    } catch {
      return undefined
    }
  }

  function note(message) {
    state.events.push({ at: Date.now(), message })
    if (state.events.length > MAX_EVENTS) state.events = state.events.slice(-MAX_EVENTS)
    scheduleSave()
    log(message)
  }

  async function load() {
    try {
      const raw = await readFile(stateFile, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed !== null && typeof parsed === 'object') {
        state = { ...defaultState(), ...parsed }
        state.usage = parsed.usage && typeof parsed.usage === 'object' ? parsed.usage : { days: {} }
        state.usage.days = state.usage.days && typeof state.usage.days === 'object' ? state.usage.days : {}
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') warn('could not read state (' + errorMessage(error) + '); starting fresh')
      state = defaultState()
    } finally {
      loaded = true
    }
    Object.assign(userConfig, await readUserSettings())
    return state
  }

  async function save() {
    if (!loaded) return
    try {
      await mkdir(stateDir, { recursive: true })
      state.updatedAt = Date.now()
      const tmp = stateFile + '.tmp'
      await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8')
      await rename(tmp, stateFile)
      dirty = false
    } catch (error) {
      warn('could not save state: ' + errorMessage(error))
    }
  }

  function scheduleSave() {
    dirty = true
    if (saveTimer !== null) return
    saveTimer = setTimeout(() => {
      saveTimer = null
      void save()
    }, 1500)
    saveTimer.unref?.()
  }

  async function writeDailyReport() {
    try {
      await mkdir(reportDir, { recursive: true })
      const lines = [
        '# Plugin curator — ' + state.lastRunDate,
        '',
        'Generated ' + new Date(state.lastRunAt).toISOString(),
        '',
        '## Open gaps',
        ...(state.gaps.length === 0
          ? ['- (none)']
          : state.gaps.map(
              (gap) =>
                '- ' +
                (gap.label.zh || gap.label.en) +
                ' — ' +
                (gap.source === 'baseline'
                  ? '出厂缺口'
                  : gap.source === 'behavior'
                    ? '行为信号'
                    : gap.source === 'model'
                      ? 'AI 判断'
                      : gap.sessions + ' 个会话 / ' + gap.hits + ' 次提及') +
                (gap.evidence && gap.evidence[0] ? ' ｜ ' + gap.evidence[0] : ''),
            )),
        '',
        '## Recommended',
        ...(state.recommendations.length === 0
          ? ['- (none today)']
          : state.recommendations.flatMap((item) => {
              const tag = item.modelPick === true ? ' [AI 推荐]' : item.forced !== undefined ? ' [能力升级]' : ''
              const why = (item.reasons ?? [])
                .map((reason) => reason.zh || reason.en)
                .filter(Boolean)
                .slice(0, 3)
                .join('；')
              return [
                '- **' + item.name + '**（score ' + item.score + '）' + tag,
                '  - 为什么：' + (why === '' ? '（无）' : why),
                '  - 怎么装：' + ((item.install && item.install.command) || 'dsh plugin add ' + item.spec),
                '  - 怎么用：' + ((item.use && item.use.zh) || '见插件 README'),
              ]
            })),
        '',
        '## Installed',
        ...state.installed.map(
          (item) =>
            '- ' +
            item.name +
            ' v' +
            (item.version || '?') +
            (item.enabled ? '' : ' (disabled)') +
            (item.update ? ' -> ' + item.update.latest : '') +
            ' — ' +
            item.calls +
            ' calls / 30d',
        ),
        '',
        '## Idle',
        ...(state.idle.length === 0
          ? ['- (none)']
          : state.idle.map((item) => '- ' + item.name + ' — ' + item.daysInactive + ' days unused')),
        '',
      ]
      await writeFile(join(reportDir, state.lastRunDate + '.md'), lines.join('\n'), 'utf8')
    } catch (error) {
      warn('could not write daily report: ' + errorMessage(error))
    }
  }

  /**
   * The catalog is the memory of coverage: what we have ever seen, when, and
   * which version. It lives in its own file so a tool-call write never pays to
   * rewrite ten thousand rows.
   */
  async function loadCatalog() {
    try {
      const raw = await readFile(catalogFile, 'utf8')
      const parsed = JSON.parse(raw)
      return parsed !== null && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  async function saveCatalog(catalog) {
    try {
      await mkdir(stateDir, { recursive: true })
      await writeFile(catalogFile, JSON.stringify(catalog), 'utf8')
    } catch (error) {
      warn('could not save catalog: ' + errorMessage(error))
    }
  }

  /**
   * User settings live beside the state, not in the profile patch: the tab
   * writes them, and a YAML value is only the initial default.
   */
  const userSettingsFile = join(stateDir, 'settings.json')

  async function readUserSettings() {
    try {
      const raw = await readFile(userSettingsFile, 'utf8')
      const parsed = JSON.parse(raw)
      return parsed !== null && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  async function writeUserSettings(next) {
    await mkdir(stateDir, { recursive: true })
    await writeFile(userSettingsFile, JSON.stringify(next, null, 2), 'utf8')
    Object.assign(userConfig, next)
  }

  /** Providers and models the harness already knows, for the picker. */
  async function modelCatalog() {
    let llm
    try {
      llm = ctx.get('llm')
    } catch {
      llm = undefined
    }
    if (!llm) return { available: false, providers: [] }
    const providers = (llm.listProviders?.() ?? []).map((provider) => ({
      id: String(provider.id ?? provider.name ?? ''),
      name: String(provider.name ?? provider.id ?? ''),
    })).filter((provider) => provider.id !== '')
    const out = []
    for (const provider of providers) {
      let models = []
      try {
        models = (await llm.listModels(provider.id)).map((model) => ({
          id: model.id,
          name: model.name,
          image: Array.isArray(model.inputModalities) ? model.inputModalities.includes('image') : null,
        }))
      } catch {
        models = []
      }
      out.push({ ...provider, models })
    }
    return { available: true, providers: out }
  }

  /** A compact JSON brief for the model: what we saw, what is installed, what is on offer. */
  function analysisBrief({ gaps, pain, installed, candidates, settings }) {
    const trim = (text, max = 160) => String(text ?? '').replace(/\s+/g, ' ').slice(0, max)
    return {
      signals: {
        gaps: (gaps ?? []).map((gap) => ({ tag: gap.tag, sessions: gap.sessions, hits: gap.hits, evidence: (gap.evidence ?? []).map((e) => trim(e)) })),
        pain: pain ?? {},
      },
      installed: (installed ?? []).map((bundle) => trim(bundle.name, 60)),
      candidates: (candidates ?? []).slice(0, 40).map((item) => ({
        name: trim(item.name, 60),
        category: item.category,
        description: trim(pickText(item.description, 'en'), 140),
        downloads: item.downloads ?? 0,
        stars: item.stars ?? 0,
      })),
      outputFormat: {
        needs: '[{ "label": string, "why": string, "category": "memory|automation|docs|browser|git|ui|notice|data|voice|agents", "confidence": 0-1 }]',
        picks: '[{ "name": "<exact candidate name>", "why": string, "impact": "high|medium" }]',
        note: 'Return JSON only. At most 4 needs and at most 3 picks. Picks must be chosen from candidates by exact name; explain the concrete workflow benefit, not general praise. It is fine to pick something the user never asked for when it would clearly improve their work.',
      },
      ...(settings?.language ? { language: settings.language } : {}),
    }
  }

  /**
   * A compact on-disk copy of the discovered catalog. Chat needs the catalog
   * even when the in-memory pool is empty after a reload, and rewriting ten
   * thousand rows on every refresh must not touch state.json.
   */
  const indexFile = join(stateDir, 'index.json')
  let indexCache = null

  function compactCandidate(item) {
    return {
      id: item.id,
      name: item.name,
      npm: item.npm,
      spec: item.spec,
      category: item.category,
      title: item.title,
      description: item.description,
      descriptionZh: state.translations[item.name] ?? '',
      downloads: item.downloads ?? 0,
      stars: item.stars ?? 0,
      capabilities: (item.capabilities ?? []).slice(0, 10),
      kind: item.kind ?? 'install',
    }
  }

  async function saveIndex(candidates) {
    try {
      await mkdir(stateDir, { recursive: true })
      await writeFile(indexFile, JSON.stringify(candidates.map(compactCandidate)), 'utf8')
      indexCache = null
    } catch (error) {
      warn('could not save index: ' + errorMessage(error))
    }
  }

  async function loadIndex() {
    if (Array.isArray(indexCache)) return indexCache
    try {
      const raw = await readFile(indexFile, 'utf8')
      const parsed = JSON.parse(raw)
      indexCache = Array.isArray(parsed) ? parsed : []
    } catch {
      indexCache = []
    }
    return indexCache
  }

  /** Answer a free-text need from the live catalog, with or without a model. */
  async function chatAbout(text) {
    const query = String(text ?? '').trim()
    if (query === '') throw new Error('empty query')
    let pool = Array.isArray(lastPool) && lastPool.length > 0 ? lastPool : await loadIndex()
    if (pool.length === 0) pool = (state.recommendations ?? []).map((item) => ({ ...item }))
    if (pool.length === 0) {
      // The catalog only lives in memory between refreshes; ask for one and
      // tell the user instead of pretending there is nothing to install.
      if (busy === null) void refresh('chat')
      return { reply: '插件索引还没建立（或刚重启）。正在后台同步，大约一分钟后我再回答你。', picks: [], model: false }
    }
    let matches = searchCatalog(pool, query, { limit: 24 })
    if (matches.length === 0) {
      const tokens = queryTokens(query).slice(0, 4)
      matches = pool.filter((item) => tokens.some((token) => String(item.name).toLowerCase().includes(token))).slice(0, 10)
    }
    const cfg = settings()
    if (!(cfg.llmEnabled === true) || !cfg.model?.provider) {
      return {
        poolSize: pool.length,
        matchCount: matches.length,
        reply: matches.length === 0
          ? '没有找到匹配的插件。可以换个说法，或者先点「刷新」同步最新索引。'
          : '模型未启用，下面是按关键词匹配出来的候选，仅供参考。',
        picks: matches.slice(0, 5).map((item) => ({
          name: item.name,
          spec: item.spec,
          why: '关键词命中：' + pickText(item.description, 'zh').slice(0, 80),
        })),
        model: false,
      }
    }
    const brief = {
      need: query,
      installed: (state.installed ?? []).map((item) => item.name).slice(0, 20),
      gaps: (state.gaps ?? []).map((gap) => gap.tag),
      candidates: matches.slice(0, 24).map((item) => ({
        name: item.name,
        category: item.category,
        description: pickText(item.description, 'zh').slice(0, 160),
        downloads: item.downloads ?? 0,
        stars: item.stars ?? 0,
      })),
      outputFormat: {
        reply: '中文，两三句话，直接回答有没有合适的、为什么',
        picks: '[{ "name": "<候选里的精确 name>", "why": "<中文一句话，说清解决什么>" }]',
        note: '只从 candidates 里挑，最多 3 个；没有合适的就返回空数组并说明原因。只返回 JSON。',
      },
    }
    let text2 = ''
    try {
      const llm = ctx.get('llm')
      for await (const chunk of llm.stream({
        provider: cfg.model.provider,
        model: cfg.model.model,
        ...(cfg.model.reasoningEffort ? { reasoningEffort: cfg.model.reasoningEffort } : {}),
        messages: [{ role: 'user', content: [{ type: 'text', text: JSON.stringify(brief) }] }],
      })) {
        if (chunk?.type === 'text-delta') text2 += chunk.text ?? ''
      }
    } catch (error) {
      return { reply: '模型调用失败：' + errorMessage(error), picks: [], model: true }
    }
    const parsed = parseJsonBlock(text2)
    if (parsed === null) {
      return {
        reply: '模型返回的内容无法解析，下面是关键词匹配到的候选。原始返回：' + text2.slice(0, 160),
        picks: matches.slice(0, 4).map((item) => ({
          name: item.name,
          spec: item.spec,
          why: '关键词命中：' + pickText(item.description, 'zh').slice(0, 80),
        })),
        model: false,
        poolSize: pool.length,
        matchCount: matches.length,
      }
    }
    const byName = new Map(matches.map((item) => [normalizePickName(item.name), item]))
    const picks = []
    for (const pick of Array.isArray(parsed.picks) ? parsed.picks : []) {
      const item = byName.get(normalizePickName(pick?.name))
      if (item === undefined) continue
      picks.push({
        name: item.name,
        spec: item.spec,
        why: String(pick?.why ?? ''),
        id: item.id,
      })
      if (picks.length >= 3) break
    }
    return { reply: String(parsed.reply ?? ''), picks, model: true, poolSize: pool.length, matchCount: matches.length }
  }

  /** Translate a handful of English descriptions once, then cache by package name. */
  async function translateDescriptions(items, model) {
    let llm
    try {
      llm = ctx.get('llm')
    } catch {
      llm = undefined
    }
    if (!llm || typeof llm.stream !== 'function' || !model?.provider || !model?.model) return
    const pending = items.filter((item) => {
      const description = item.description
      const hasZh = description !== null && typeof description === 'object' && typeof description.zh === 'string'
      return !hasZh && state.translations[item.name] === undefined && pickText(description, 'en') !== ''
    })
    if (pending.length === 0) return
    for (let index = 0; index < pending.length; index += 6) {
      const batch = pending.slice(index, index + 6)
      const prompt =
        '把下面每条 text 翻译成简体中文（产品名、包名保持英文原样，不要解释）。只返回 JSON：' +
        '{"translations":[{"name":"<原样>","zh":"<中文>"}]}\n' +
        JSON.stringify(batch.map((item) => ({ name: item.name, text: pickText(item.description, 'en') })))
      let text = ''
      try {
        for await (const chunk of llm.stream({
          provider: model.provider,
          model: model.model,
          ...(model.reasoningEffort ? { reasoningEffort: model.reasoningEffort } : {}),
          messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
        })) {
          if (chunk?.type === 'text-delta') text += chunk.text ?? ''
        }
      } catch (error) {
        warn('translation failed: ' + errorMessage(error))
        return
      }
      const parsed = parseJsonBlock(text)
      if (parsed === null || !Array.isArray(parsed.translations)) continue
      for (const entry of parsed.translations) {
        if (typeof entry?.name === 'string' && typeof entry?.zh === 'string' && entry.zh !== '') {
          state.translations[entry.name] = entry.zh
        }
      }
    }
  }

  async function analyzeWithModel(brief, model) {
    let llm
    try {
      llm = ctx.get('llm')
    } catch {
      llm = undefined
    }
    if (!llm || typeof llm.stream !== 'function') return { ok: false, reason: 'llm-unavailable' }
    if (!model?.provider || !model?.model) return { ok: false, reason: 'model-not-configured' }
    let text = ''
    let finished = false
    try {
      const stream = llm.stream({
        provider: model.provider,
        model: model.model,
        ...(model.reasoningEffort ? { reasoningEffort: model.reasoningEffort } : {}),
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: JSON.stringify(brief) }],
          },
        ],
      })
      for await (const chunk of stream) {
        if (chunk?.type === 'text-delta') text += chunk.text ?? ''
        if (chunk?.type === 'finish') {
          finished = true
          if (chunk.reason?.kind !== 'stop') return { ok: false, reason: 'finish-' + String(chunk.reason?.kind ?? 'unknown') }
        }
      }
    } catch (error) {
      return { ok: false, reason: errorMessage(error) }
    }
    if (!finished) return { ok: false, reason: 'no-finish' }
    const parsed = parseJsonBlock(text)
    if (parsed === null) return { ok: false, reason: 'unparsable' }
    const needs = Array.isArray(parsed.needs) ? parsed.needs.filter((item) => item && typeof item.label === 'string') : []
    const picks = Array.isArray(parsed.picks)
      ? parsed.picks.filter((item) => item && typeof item.name === 'string' && item.name.trim() !== '')
      : []
    return { ok: true, needs: needs.slice(0, 4), picks: picks.slice(0, 3), raw: text.slice(0, 2000) }
  }

  function pruneUsage() {
    const keepAfter = Date.now() - USAGE_RETENTION_DAYS * DAY_MS
    const days = state.usage.days
    for (const key of Object.keys(days)) {
      const at = parseDateKey(key)
      if (at === null || at < keepAfter) delete days[key]
    }
  }

  function recordToolResult(toolName) {
    const tool = String(toolName ?? '')
    if (tool === '' || tool === 'plugin_curator_status') return
    const day = dateKey()
    const bucket = state.usage.days[day] ?? { tools: {} }
    if (bucket.tools === undefined || bucket.tools === null) bucket.tools = {}
    bucket.tools[tool] = (Number(bucket.tools[tool]) || 0) + 1
    state.usage.days[day] = bucket
    pruneUsage()
    scheduleSave()
  }

  function listWorkspaces() {
    let registry
    try {
      registry = ctx.get('workspaceRegistry')
    } catch {
      return []
    }
    if (!registry || typeof registry.list !== 'function') return []
    try {
      const list = registry.list()
      if (!Array.isArray(list)) return []
      return list.slice(0, 12).map((workspace) => ({
        title: String(workspace?.title ?? workspace?.name ?? workspace?.path ?? ''),
        path: String(workspace?.path ?? ''),
      }))
    } catch {
      return []
    }
  }

  /** Locate the profile directory: the host passes it on argv. */
  function profileDir() {
    if (process.env.DSH_PROFILE_DIR) return process.env.DSH_PROFILE_DIR
    const fromArgv = (process.argv ?? []).find((arg) => /[\\/]profiles[\\/][^\\/]+$/.test(String(arg)))
    if (fromArgv !== undefined) return fromArgv
    return join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'profiles', 'desktop')
  }

  /**
   * The activation list from the profile manifest. listBundles() also reports
   * packages that are still npm dependencies but were removed from the profile,
   * so "installed" alone over-reports; the manifest list is authoritative.
   */
  let activeBundlesCache = { at: 0, names: null }
  async function readActiveBundles() {
    try {
      const file = join(profileDir(), 'package.json')
      const info = await stat(file)
      if (activeBundlesCache.names !== null && info.mtimeMs === activeBundlesCache.at) {
        return activeBundlesCache.names
      }
      const raw = JSON.parse(await readFile(file, 'utf8'))
      const names = Array.isArray(raw?.dsh?.profile?.bundles) ? raw.dsh.profile.bundles.map((name) => String(name)) : null
      activeBundlesCache = { at: info.mtimeMs, names }
      return names
    } catch {
      return null
    }
  }

  async function readInventory() {
    const engine = manager()
    if (!engine) return { bundles: [], active: null, available: false }
    try {
      const [bundles, active] = await Promise.all([engine.listBundles(), readActiveBundles()])
      return { bundles: Array.isArray(bundles) ? bundles : [], active, available: true }
    } catch (error) {
      warn('inventory read failed: ' + errorMessage(error))
      return { bundles: [], active: null, available: false }
    }
  }

  function npmLatestUrl(spec) {
    return (
      'https://registry.npmjs.org/' +
      encodeURIComponent(spec).replace(/^%40/, '@').replace(/%2F/gi, '/') +
      '/latest'
    )
  }

  async function checkUpdates(bundles) {
    const updates = {}
    const targets = bundles.filter((bundle) => {
      if (!bundle?.installed) return false
      const spec = bundle.installTarget?.spec
      return typeof spec === 'string' && specKind(spec) === 'npm'
    })
    await mapLimit(targets, 4, async (bundle) => {
      const spec = bundle.installTarget.spec
      try {
        const latest = await fetchJson(npmLatestUrl(spec), { timeoutMs: 6_000 })
        const version = typeof latest?.version === 'string' ? latest.version : ''
        if (version !== '' && isNewerVersion(version, bundle.version)) {
          updates[bundle.name] = { current: bundle.version ?? '', latest: version }
        }
      } catch {
        /* an unreachable registry is not a report failure */
      }
    })
    return updates
  }

  /**
   * Mine what the user keeps asking for from their own prompts. Only
   * user/message events are read: assistant prose would echo every topic back
   * and manufacture gaps that nobody has.
   */
  async function collectIntents(cfg) {
    let query
    try {
      query = ctx.get('sessionQuery')
    } catch {
      query = undefined
    }
    if (!query || typeof query.listSessions !== 'function' || typeof query.filterEvents !== 'function') {
      return { intents: [], scanned: 0 }
    }
    const cutoff = Date.now() - cfg.intentDays * DAY_MS
    const texts = []
    let records = []
    try {
      records = (await query.listSessions()).slice(0, cfg.intentSessions)
    } catch (error) {
      warn('intent mining skipped: ' + errorMessage(error))
      return { intents: [], scanned: 0 }
    }
    let toolCalls = 0
    let toolErrors = 0
    let assistantTurns = 0
    const toolEvents = []
    for (const record of records) {
      const header = record?.header ?? {}
      const id = header.id
      if (typeof id !== 'string') continue
      const at = Number(header.updatedAt ?? header.createdAt ?? 0)
      if (at !== 0 && at < cutoff) continue
      try {
        const docs = await query.filterEvents(id, [
          { kind: 'type', values: ['user/message'] },
          { kind: 'surface', values: ['current'] },
        ])
        for (const doc of docs) {
          const text = String(doc?.text ?? '')
          if (text !== '') texts.push({ sessionId: id, text: text.slice(0, 4000) })
        }
      } catch {
        /* one unreadable or corrupt session must not fail the report */
      }
      try {
        // Behaviour beats prose: a tool that keeps failing is a real gap even
        // when the user never says a word about it. Raw events keep the
        // call/result pairing that the text projection loses.
        let events = []
        try {
          // A very large log can take longer to replay than the whole run is
          // worth: skip its tool attribution rather than stall the report.
          const log = await withTimeout(query.readSession(id), 20_000, 'readSession')
          events = Array.isArray(log) ? log : (log?.events ?? [])
        } catch {
          events = []
        }
        for (const event of events) {
          if (event?.type !== 'tool/call' && event?.type !== 'tool/result') continue
          toolEvents.push(event)
          if (event.type === 'tool/result') {
            toolCalls += 1
            if (event.data?.error !== undefined && event.data?.error !== null) toolErrors += 1
          }
        }
      } catch {
        /* same tolerance as above */
      }
      try {
        const assistant = await query.filterEvents(id, [
          { kind: 'type', values: ['assistant/message'] },
          { kind: 'surface', values: ['current'] },
        ])
        assistantTurns += assistant.length
      } catch {
        /* same tolerance as above */
      }
    }
    return {
      intents: detectIntents(texts, { minHits: cfg.intentMinHits, minSessions: 1 }),
      scanned: texts.length,
      pain: {
        sessions: records.length,
        userPrompts: texts.length,
        assistantTurns,
        toolCalls,
        toolErrors,
        errorRate: toolCalls === 0 ? 0 : Math.round((toolErrors / toolCalls) * 100),
        tools: attributeToolErrors(toolEvents).slice(0, 8),
        failing: failingTool(attributeToolErrors(toolEvents)),
      },
    }
  }

  /** Build a candidate straight from the registry when the model names a plugin our filters dropped. */
  async function candidateFromRegistry(name) {
    const packument = await fetchPackument(name)
    const latest = packument?.['dist-tags']?.latest
    if (latest === undefined) return null
    const manifest = packument?.versions?.[latest]
    if (manifest === null || typeof manifest !== 'object') return null
    const dsh = manifest.dsh
    if (dsh === null || typeof dsh !== 'object' || (dsh.bundle === undefined && dsh.client === undefined)) return null
    const published = packument?.time?.[latest]
    return {
      id: String(name).toLowerCase(),
      name,
      npm: name,
      spec: name,
      title: manifest.name ?? name,
      description: manifest.description ?? '',
      category: 'tools',
      version: latest,
      stars: 0,
      downloads: 0,
      added: typeof published === 'string' ? published.slice(0, 10) : '',
      capabilities: Array.isArray(manifest.keywords) ? manifest.keywords.slice(0, 12) : [],
      risk: false,
      source: 'model',
      kind: 'install',
      packageDsh: dsh,
    }
  }

  /** Read the npm packument for one package; cached per refresh window. */
  async function fetchPackument(name) {
    const cached = packumentCache.get(name)
    if (cached !== undefined) return cached
    const promise = fetchJson(
      'https://registry.npmjs.org/' + encodeURIComponent(name).replace(/^%40/, '@'),
      { timeoutMs: 10_000 },
    ).catch(() => null)
    packumentCache.set(name, promise)
    return promise
  }

  /** Shipped-but-off bundles are one click from working: no download at all. */
  function shippedCandidates(bundles) {
    const out = []
    for (const bundle of bundles) {
      if (bundle?.official !== true || bundle.installed === true) continue
      if (bundle.enabled === true || bundle.availability !== 'installation') continue
      const title = bundle.meta?.title ?? bundle.name
      const description = bundle.meta?.description ?? bundle.description ?? ''
      out.push({
        id: String(bundle.name).toLowerCase(),
        name: bundle.name,
        npm: '',
        spec: bundle.name,
        kind: 'bundled',
        title: pickText(title, 'zh') ? title : bundle.name,
        description,
        category: 'tools',
        version: bundle.version ?? '',
        stars: 0,
        downloads: 0,
        added: '',
        capabilities: [],
        risk: false,
        source: 'official',
      })
    }
    return out
  }

  /**
   * npm's search API wraps around after roughly 5,000 results, so one query
   * cannot see the whole keyword corpus. Several queries return different
   * slices of the same ranking; the merge dedupes them.
   */
  async function collectNpm(cfg) {
    const pages = clamp(Number(cfg.npmPages) || 40, 1, 60)
    const seen = new Set()
    const out = []
    const perQuery = []
    for (const query of cfg.npmQueries) {
      let total = 0
      let fetched = 0
      for (let page = 0; page < pages; page += 1) {
        const from = page * 250
        let payload
        if (page > 0) await sleep(Number(cfg.npmDelayMs) || 300)
        try {
          payload = await fetchJsonPaced(
            'https://registry.npmjs.org/-/v1/search?text=' + encodeURIComponent(query) + '&size=250&from=' + from,
            { timeoutMs: 20_000 },
          )
        } catch (error) {
          perQuery.push({ query, fetched, total, error: errorMessage(error) })
          break
        }
        total = Math.max(total, Number(payload?.total) || 0)
        const list = normalizeNpmSearch(payload)
        let fresh = 0
        for (const candidate of list) {
          if (seen.has(candidate.id)) continue
          seen.add(candidate.id)
          out.push(candidate)
          fresh += 1
        }
        fetched += list.length
        if (list.length === 0 || fresh === 0) break
      }
      if (perQuery.every((entry) => entry.query !== query)) perQuery.push({ query, fetched, total, error: '' })
    }
    return { candidates: out, perQuery }
  }

  async function collectGithub(cfg) {
    const queries = ['topic:dsh-plugin', 'topic:deepseek-harness']
    const pages = clamp(Number(cfg.githubPages) || 2, 1, 3)
    const headers = cfg.githubToken === '' ? {} : { authorization: 'Bearer ' + cfg.githubToken }
    const seen = new Set()
    const out = []
    let total = 0
    for (const query of queries) {
      for (let page = 1; page <= pages; page += 1) {
        const url =
          'https://api.github.com/search/repositories?q=' +
          encodeURIComponent(query) +
          '&sort=updated&order=desc&per_page=100&page=' +
          page
        const payload = await fetchJson(url, { timeoutMs: 20_000, headers })
        total = Math.max(total, Number(payload?.total_count) || 0)
        let fresh = 0
        for (const candidate of normalizeGithubSearch(payload)) {
          if (seen.has(candidate.id)) continue
          seen.add(candidate.id)
          out.push(candidate)
          fresh += 1
        }
        if (fresh === 0) break
      }
    }
    return { candidates: out, total }
  }

  async function collectMarket(cfg) {
    const out = []
    const total = { value: 0 }
    for (const url of cfg.marketIndexes) {
      try {
        const payload = await fetchJson(url, { timeoutMs: 20_000 })
        const list = normalizeMarketIndex(payload, url)
        total.value += list.length
        out.push(...list)
      } catch {
        /* one unreachable index does not fail the run */
      }
    }
    return { candidates: out, total: total.value }
  }

  /**
   * Every candidate the report shows must be a real bundle: npm packages are
   * checked for a dsh.bundle / dsh.client field, git specs for a package.json
   * that declares one, shipped bundles are bundles by construction.
   */
  async function verifyCandidate(candidate) {
    if (candidate.kind === 'bundled') return { verified: true, reason: 'shipped' }
    const kind = specKind(candidate.spec)
    if (kind === 'npm') {
      const packument = await fetchPackument(candidate.spec)
      const latest = packument?.['dist-tags']?.latest
      const manifest = latest === undefined ? undefined : packument?.versions?.[latest]
      const dsh = manifest?.dsh
      if (dsh !== null && typeof dsh === 'object' && (dsh.bundle !== undefined || dsh.client !== undefined)) {
        return { verified: true, reason: 'npm-dsh-field' }
      }
      return { verified: false, reason: 'not-a-bundle' }
    }
    if (kind === 'git') {
      const match = /github\.com[/:]([^/]+)\/([^/#?]+)/i.exec(candidate.spec)
      if (match === null) return { verified: false, reason: 'unchecked-host' }
      const url = 'https://raw.githubusercontent.com/' + match[1] + '/' + match[2].replace(/\.git$/, '') + '/HEAD/package.json'
      const manifest = await fetchJson(url, { timeoutMs: 12_000 }).catch(() => null)
      if (manifest?.dsh !== null && typeof manifest?.dsh === 'object') {
        return { verified: true, reason: 'repo-dsh-field' }
      }
      return { verified: false, reason: 'not-a-bundle' }
    }
    return { verified: false, reason: 'unsupported-spec' }
  }

  async function gatherCandidates() {
    const cfg = settings()
    const sources = []
    const lists = []

    let bundles = []
    const inventory = await readInventory()
    bundles = inventory.bundles

    const shipped = shippedCandidates(bundles)
    lists.push(shipped)
    sources.push({ id: 'official', kind: 'official', status: 'ok', fetched: shipped.length, accepted: shipped.length, total: shipped.length, error: '' })

    for (const source of cfg.sources) {
      const url = String(source).trim()
      if (url === '') continue
      try {
        let payload
        try {
          payload = await fetchJson(url, { timeoutMs: 45_000 })
        } catch {
          payload = await fetchJson(url, { timeoutMs: 45_000 })
        }
        const list = normalizeRegistry(payload)
        lists.push(list)
        sources.push({ id: url, kind: 'registry', status: 'ok', fetched: list.length, accepted: list.length, total: list.length, error: '' })
      } catch (error) {
        sources.push({ id: url, kind: 'registry', status: 'error', fetched: 0, accepted: 0, total: 0, error: errorMessage(error) })
      }
    }

    if (cfg.npmSearch) {
      try {
        const result = await collectNpm(cfg)
        lists.push(result.candidates)
        for (const entry of result.perQuery) {
          sources.push({
            id: 'npm:' + entry.query,
            kind: 'npm',
            status: entry.error === '' ? 'ok' : 'error',
            fetched: entry.fetched,
            accepted: entry.fetched,
            total: entry.total,
            error: entry.error,
          })
        }
      } catch (error) {
        sources.push({ id: 'npm', kind: 'npm', status: 'error', fetched: 0, accepted: 0, total: 0, error: errorMessage(error) })
      }
    }

    if (cfg.githubSearch) {
      try {
        const result = await collectGithub(cfg)
        lists.push(result.candidates)
        sources.push({ id: 'github:topics', kind: 'github', status: 'ok', fetched: result.candidates.length, accepted: result.candidates.length, total: result.total, error: '' })
      } catch (error) {
        sources.push({ id: 'github:topics', kind: 'github', status: 'error', fetched: 0, accepted: 0, total: 0, error: errorMessage(error) })
      }
    }

    if (cfg.marketIndexes.length > 0) {
      try {
        const result = await collectMarket(cfg)
        lists.push(result.candidates)
        sources.push({ id: 'market-indexes', kind: 'market', status: 'ok', fetched: result.candidates.length, accepted: result.candidates.length, total: result.total, error: '' })
      } catch (error) {
        sources.push({ id: 'market-indexes', kind: 'market', status: 'error', fetched: 0, accepted: 0, total: 0, error: errorMessage(error) })
      }
    }

    const candidates = mergeCandidates(lists)
    // Removed-but-still-a-dependency packages must not count as installed, or
    // they would be excluded from recommendations forever.
    const active = await readActiveBundles()
    const activeSet = Array.isArray(active) ? new Set(active.map((name) => pkgName(name))) : null
    const installedNames = new Set(
      bundles
        .filter((bundle) => bundle.installed)
        .map((bundle) => String(bundle.name).toLowerCase())
        .filter((name) => activeSet === null || activeSet.has(pkgName(name))),
    )
    return { candidates, sources, installedNames }
  }

  function buildInstalledView(bundles, now = Date.now(), active = null) {
    const idleByName = new Map((state.idle ?? []).map((item) => [item.name, item]))
    // A package that is still an npm dependency but was removed from the profile
    // bundle list is not installed in DSH terms; the manifest decides.
    const activeSet = Array.isArray(active) ? new Set(active.map((name) => pkgName(name))) : null
    return bundles
      .filter((bundle) => bundle?.installed)
      .filter((bundle) => activeSet === null || activeSet.has(pkgName(bundle.name)))
      .map((bundle) => {
        const attribution = state.attribution?.[bundle.name] ?? {}
        const idleItem = idleByName.get(bundle.name)
        return {
          name: bundle.name,
          title: pickText(bundle.meta?.title, 'zh') || bundle.name,
          titleI18n: bundle.meta?.title ?? null,
          description: bundle.description ?? '',
          version: bundle.version ?? '',
          enabled: bundle.enabled === true,
          official: bundle.official === true,
          removable: bundle.removable === true && !PROTECTED_BUNDLES.includes(bundle.name),
          calls: attribution.calls ?? 0,
          tools: Object.entries(attribution.tools ?? {})
            .slice(0, 6)
            .map(([name, calls]) => ({ name, calls })),
          lastUsed: attribution.lastUsed ?? '',
          update: state.updates?.[bundle.name] ?? null,
          suggestion: state.suggestions?.[bundle.name] ?? null,
          daysInactive: idleItem?.daysInactive ?? null,
          installedAt: state.firstSeen[bundle.name] ?? '',
          daysInstalled: state.firstSeen[bundle.name] === undefined ? null : daysBetween(state.firstSeen[bundle.name], now),
          status:
            (attribution.calls ?? 0) > 0
              ? 'active'
              : state.firstSeen[bundle.name] !== undefined && daysBetween(state.firstSeen[bundle.name], now) < 7
                ? 'watching'
                : 'unused',
        }
      })
      .sort((a, b) => (b.calls ?? 0) - (a.calls ?? 0) || String(a.name).localeCompare(String(b.name)))
  }

  /** Next run follows the same interval the scheduler uses, not a fixed hour. */
  function nextRunTime(cfg) {
    const perDay = Math.max(1, Math.min(24, Number(cfg.runsPerDay) || 1))
    const everyMs = (24 * 60 * 60 * 1000) / perDay
    const base = state.lastRunAt === 0 ? Date.now() : state.lastRunAt + everyMs
    return base <= Date.now() ? Date.now() + 60_000 : base
  }

  /**
   * Group installed plugins by the capability they cover, with enough detail per
   * plugin that the panel can explain how they differ (usage, tools, freshness).
   */
  function rebuildConflicts() {
    const installed = (state.installed ?? []).filter((item) => item.enabled !== false)
    state.conflicts = groupOverlaps(installed)
      .sort((a, b) => b.items.length - a.items.length || a.tag.localeCompare(b.tag))
      .slice(0, 6)
      .map(({ tag, reason, items: bucketItems }) => {
        const bucket = { reason, items: bucketItems }
        const topCalls = Math.max(...bucket.items.map(({ item }) => Number(item.calls) || 0))
        return {
          tag,
          reason: bucket.reason,
          names: bucket.items.map(({ item }) => item.name),
          plugins: bucket.items.map(({ item, evidence }) => ({
            name: item.name,
            title: item.title || item.name,
            version: item.version ?? '',
            enabled: item.enabled === true,
            removable: item.removable === true,
            official: item.official === true,
            description: item.description ?? '',
            descriptionZh: state.translations?.[item.name] ?? '',
            calls: Number(item.calls) || 0,
            toolCount: (item.tools ?? []).length,
            toolsPreview: (item.tools ?? []).slice(0, 3).map((tool) => tool.name),
            evidence: evidence.tools,
            evidenceKind: evidence.strength === 2 ? 'tool' : 'name',
            lastUsed: item.lastUsed ?? '',
            daysInactive: item.daysInactive ?? null,
            installedAt: item.installedAt ?? '',
            primary: topCalls > 0 && (Number(item.calls) || 0) === topCalls,
          })),
        }
      })
  }

  /**
   * Refresh the installed list from the live bundle inventory on every snapshot:
   * plugins removed from the Plugins page (or by another process) must disappear
   * immediately, not after the next two-minute pipeline.
   */
  async function syncInstalledFromInventory() {
    try {
      const inventory = await readInventory()
      state.installed = buildInstalledView(inventory.bundles, Date.now(), inventory.active)
      rebuildConflicts()
    } catch {
      // Keep the last known view if the manager is unavailable mid-recompose.
    }
  }

  async function snapshot() {
    await syncInstalledFromInventory()
    const cfg = settings()
    const installedKeys = new Set()
    for (const item of state.installed ?? []) installedKeys.add(pkgName(item.name))
    for (const name of Object.keys(state.firstSeen ?? {})) installedKeys.add(pkgName(name))
    const pending = state.recommendations.filter(
      (item) =>
        state.dismissed[item.id] === undefined &&
        item.installed !== true &&
        !installedKeys.has(pkgName(item.spec)) &&
        !installedKeys.has(pkgName(item.name)) &&
        !installedKeys.has(pkgName(item.npm)),
    )
    const visibleGaps = (state.gaps ?? []).map((gap) => ({
      ...gap,
      suggestions: (gap.suggestions ?? []).filter(
        (item) => !installedKeys.has(pkgName(item.spec)) && !installedKeys.has(pkgName(item.name)),
      ),
    }))
    return {
      version: VERSION,
      enabled: true,
      today: dateKey(),
      generatedAt: state.lastRunAt,
      lastRunDate: state.lastRunDate,
      lastRunReason: state.lastRunReason,
      nextRunAt: nextRunTime(cfg),
      busy: busy !== null,
      settings: {
        dailyHour: cfg.dailyHour,
        idleDays: cfg.idleDays,
        autoInstall: cfg.autoInstall,
        autoInstallMinScore: cfg.autoInstallMinScore,
        npmPages: cfg.npmPages,
        validateTop: cfg.validateTop,
        llmEnabled: cfg.llmEnabled === true,
        model: cfg.model,
        runsPerDay: cfg.runsPerDay,
        sources: cfg.sources,
        marketIndexes: cfg.marketIndexes,
      },
      profile: state.workProfile,
      recommendations: pending,
      installed: state.installed,
      idle: state.idle,
      sourceStatus: state.sourceStatus,
      coverage: state.coverage,
      gaps: visibleGaps,
      diff: state.diff,
      conflicts: state.conflicts,
      intents: state.intents,
      modelStatus: state.modelStatus === null || state.modelStatus === undefined
        ? null
        : {
          at: state.modelStatus.at,
          ok: state.modelStatus.ok === true,
          reason: state.modelStatus.reason ?? '',
          needs: state.modelStatus.needs ?? 0,
          picks: state.modelStatus.picks ?? 0,
          matched: state.modelStatus.matched ?? 0,
        },
      intentScanned: state.intentScanned,
      pain: state.pain,
      events: state.events.slice(-8).reverse(),
      totals: {
        installed: state.installed.length,
        recommendations: pending.length,
        idle: state.idle.length,
        calls7: state.workProfile?.totalCalls ?? 0,
      },
    }
  }

  async function refresh(reason = 'manual') {
    if (busy !== null) return busy
    busy = withTimeout((async () => {
      await (loaded ? Promise.resolve() : load())
      const now = Date.now()
      const today = dateKey()
      const cfg = settings()
      note('refresh: ' + reason)

      const inventory = await readInventory()
      for (const bundle of inventory.bundles) {
        if (bundle?.installed && bundle.name && state.firstSeen[bundle.name] === undefined) {
          state.firstSeen[bundle.name] = today
        }
      }

      const profile = buildProfile({ usageDays: state.usage.days, workspaces: listWorkspaces(), now, windowDays: 7 })

      const gapTags = (candidate) => {
        const cached = gapTagCache.get(candidate)
        if (cached !== undefined) return cached
        const tags = capabilityTags(candidate)
        gapTagCache.set(candidate, tags)
        return tags
      }
      const intentResult = cfg.intentEnabled
        ? await collectIntents(cfg)
        : { intents: [], scanned: 0 }
      const installedBundles = inventory.bundles.filter((bundle) => bundle.installed)
      const askedGaps = openGaps(intentResult.intents, installedBundles)
      const standingGaps = cfg.baselineGaps
        ? baselineGaps(installedBundles, askedGaps.map((gap) => gap.tag))
        : []
      const gaps = [...askedGaps, ...standingGaps].slice(0, 4)

      // Reliability is a need even when nobody asks for it: a high tool error
      // rate is evidence that the current toolbox is not pulling its weight.
      const pain = intentResult.pain
      if (pain?.failing !== undefined && pain?.failing !== null) {
        const failing = pain.failing
        gaps.unshift({
          tag: 'tooling',
          label: {
            zh: '工具 ' + failing.name + ' 经常失败',
            en: failing.name + ' keeps failing',
          },
          hits: failing.errors,
          sessions: pain.sessions,
          evidence: [failing.evidence],
          categories: ['tools', 'dev', 'workflow'],
          match: failing.match ?? undefined,
          source: 'behavior',
        })
        gaps.length = Math.min(gaps.length, 4)
      } else if (pain !== undefined && pain !== null && pain.toolCalls >= 20 && pain.errorRate >= 15) {
        gaps.unshift({
          tag: 'tooling',
          label: { zh: '工具调用可靠性', en: 'tool reliability' },
          hits: pain.toolErrors,
          sessions: pain.sessions,
          evidence: [
            '最近 ' + pain.sessions + ' 个会话里 ' + pain.toolErrors + '/' + pain.toolCalls +
              ' 次工具调用报错（' + pain.errorRate + '%）',
          ],
          categories: ['dev', 'security', 'workflow'],
          match: /test|verify|review|debug|inspect|diagnos|retry|observab|可观测|测试|校验|调试|诊断|重试|日志/i,
          source: 'behavior',
        })
        gaps.length = Math.min(gaps.length, 4)
      }

      const gathered = await gatherCandidates()
      lastPool = gathered.candidates
      const downloadLadder = gathered.candidates
        .map((item) => Number(item.downloads) || 0)
        .filter((value) => value > 0)
        .sort((a, b) => a - b)
      const popularityOf = (value) => {
        const downloads = Number(value) || 0
        if (downloads <= 0 || downloadLadder.length === 0) return 0
        let low = 0
        let high = downloadLadder.length
        while (low < high) {
          const mid = (low + high) >> 1
          if (downloadLadder[mid] <= downloads) low = mid + 1
          else high = mid
        }
        return Math.round((low / downloadLadder.length) * 100)
      }
      void saveIndex(gathered.candidates)
      const installedNames = gathered.installedNames

      // Optional model pass: it reads the same evidence the heuristics did and
      // can name a need the fixed rules missed.
      if (cfg.llmEnabled === true && cfg.model?.provider && cfg.model?.model) {
        const brief = analysisBrief({
          gaps,
          pain: intentResult.pain ?? { sessionsScanned: state.intentScanned ?? 0 },
          tools: intentResult.pain?.tools ?? [],
          installed: inventory.bundles.filter((bundle) => bundle.installed),
          candidates: gathered.candidates,
          settings: { language: 'zh' },
        })
        const answer = await analyzeWithModel(brief, cfg.model)
        state.modelStatus = {
          at: Date.now(),
          ok: answer.ok === true,
          reason: answer.reason ?? '',
          needs: answer.ok === true ? answer.needs.length : 0,
          picks: answer.ok === true ? answer.picks.length : 0,
        }
        if (answer.ok === true) state.modelPicks = answer.picks
        if (answer.ok === true) {
          for (const need of answer.needs) {
            const category = String(need.category ?? '')
            if (category === '') continue
            if (gaps.some((gap) => gap.tag === category)) continue
            gaps.push({
              tag: category,
              label: { zh: String(need.label), en: String(need.label) },
              hits: 0,
              sessions: 0,
              evidence: [String(need.why ?? '').slice(0, 200)],
              categories: [category],
              source: 'model',
            })
          }
        }
      }
      const excluded = new Set(cfg.excluded)
      const seen = new Set()
      const recommendations = []
      const catalog = await loadCatalog()
      // A first run is a baseline, not news: every id is "new" simply because
      // nothing was recorded yet.
      const firstCatalogRun = Object.keys(catalog).length === 0
      const bareName = (value) => String(value ?? '').toLowerCase().replace(/^@[^/]+\//, '')
      const installedBare = new Set([...installedNames].map((name) => bareName(name)))
      let lowSignal = 0
      let dead = 0
      let newFound = 0
      for (const candidate of gathered.candidates) {
        if (installedNames.has(candidate.id)) continue
        // A fork under another scope (or a rename) must not re-enter the list
        // right after its sibling was installed.
        if (installedBare.has(bareName(candidate.name)) || installedBare.has(bareName(candidate.npm))) continue
        if (excluded.has(candidate.id) || excluded.has(String(candidate.npm).toLowerCase())) continue
        if (state.dismissed[candidate.id] !== undefined) continue
        if (seen.has(candidate.id)) continue
        seen.add(candidate.id)
        const quality = qualityTier(candidate, {
          now,
          minDownloads: cfg.minDownloads,
          minStars: cfg.minStars,
          newDays: cfg.newPluginDays,
        })
        if (quality.tier === 'unused') {
          lowSignal += 1
          continue
        }
        if (quality.tier === 'dead') {
          dead += 1
          continue
        }
        const known = catalog[candidate.id]
        if (known === undefined) {
          if (!firstCatalogRun) newFound += 1
          const published = parseDateKey(candidate.added) === null ? today : candidate.added
          catalog[candidate.id] = { v: candidate.version ?? '', f: published, s: today }
        } else {
          known.s = today
          if (typeof candidate.version === 'string' && candidate.version !== '') known.v = candidate.version
        }
        const scored = scoreCandidate(candidate, profile)
        if (scored.kind === 'path') continue
        const tags = gapTags(candidate)
        // A registry entry carries its category; an npm entry usually says
        // "tools" and only the text reveals what it is about.
        const gapText = [candidate.name, pickText(candidate.description, 'en'), pickText(candidate.description, 'zh')].join(' ')
        const gap = gaps.slice(0, 3).find((item) => {
          if (item.match !== undefined && !item.match.test(gapText)) return false
          return item.categories.includes(candidate.category) || (candidate.category === 'tools' && tags.includes(item.tag))
        })
        if (gap !== undefined) {
          scored.score = Math.min(99, scored.score + 12)
          scored.reasons.push({
            code: 'gap',
            en: 'Covers ' + gap.label.en + ', which you asked about in ' + gap.sessions + ' session(s)',
            zh: '补上「' + gap.label.zh + '」：你最近 ' + gap.sessions + ' 个会话提到它，当前没有插件覆盖',
          })
        }
        recommendations.push({
          id: candidate.id,
          name: candidate.name,
          npm: candidate.npm,
          spec: candidate.spec,
          title: candidate.title,
          description: candidate.description,
          category: candidate.category,
          version: candidate.version,
          stars: candidate.stars,
          downloads: candidate.downloads,
          adoption: {
            downloads: Number(candidate.downloads) || 0,
            stars: Number(candidate.stars) || 0,
            forks: Number(candidate.forks) || 0,
            percentile: popularityOf(candidate.downloads),
            updated: candidate.pushedAt || candidate.added || '',
          },
          added: candidate.added,
          source: candidate.source,
          capabilities: candidate.capabilities,
          risk: candidate.risk,
          score: scored.score,
          reasons: withMaintenance(scored.reasons, quality.maintenance),
          maintenance: quality.maintenance,
          install: installHint(candidate.spec),
          use: useHint(candidate.category),
          kind: candidate.kind ?? 'install',
          tier: quality.tier,
          gap: gap?.tag ?? null,
          classHit: standingGaps.find((entry) => matchesBaseline(BASELINE_GAPS.find((item) => item.tag === entry.tag), candidate))?.tag ?? null,
          verified: false,
          installed: false,
        })
      }
      recommendations.sort((a, b) => b.score - a.score)
      const scoredPool = recommendations.slice()

      // Only the shortlist is verified against the registry: broad discovery
      // stays cheap, and nothing unverified reaches the tab.
      const shortlist = recommendations.slice(0, Math.max(cfg.maxRecommendations, cfg.validateTop))
      // A capability class the harness lacks must reach validation even when its
      // best candidate would not win on score.
      const classPicks = recommendations
        .filter((item) => item.classHit !== null && item.classHit !== undefined && !shortlist.includes(item))
        .slice(0, 2)
      shortlist.push(...classPicks)
      const verified = []
      let rejected = 0
      await mapLimit(shortlist, 4, async (item) => {
        const result = await verifyCandidate(item).catch(() => ({ verified: false, reason: 'verify-failed' }))
        if (result.verified) {
          item.verified = true
          item.verifyReason = result.reason
          verified.push(item)
        } else {
          rejected += 1
          item.verified = false
          item.verifyReason = result.reason
        }
      })
      // Proven adoption first; a couple of brand-new plugins stay visible but
      // are capped and labeled, so a fresh release can be discovered without
      // outranking anything that people actually use.
      const proven = verified.filter((item) => item.tier === 'proven')
      const fresh = verified.filter((item) => item.tier === 'new').slice(0, cfg.emergingMax)
      const final = [...proven, ...fresh].sort((a, b) => b.score - a.score)

      // Nobody asked for these classes, but the harness does not ship them.
      // Guarantee a slot for the best matching candidate so a standing gap is
      // never silently outranked by novelty.
      const guaranteed = []
      for (const gap of standingGaps) {
        if (guaranteed.length >= 2) break
        const entry = BASELINE_GAPS.find((item) => item.tag === gap.tag)
        const pick = verified.find(
          (item) => !final.includes(item) && !guaranteed.includes(item) && matchesBaseline(entry, item),
        )
        if (pick === undefined) continue
        if (final.some((item) => matchesBaseline(entry, item))) continue
        pick.forced = gap.tag
        pick.classLabel = gap.label
        pick.reasons = [
          ...(pick.reasons ?? []),
          {
            code: 'class',
            zh: '能力升级：Harness 出厂不带「' + gap.label.zh + '」，当前也没有插件覆盖',
            en: 'Capability upgrade: DSH ships no ' + gap.label.en + ' and nothing installed covers it',
          },
        ]
        guaranteed.push(pick)
      }

      // Label an already-present class match as an upgrade, so the tab still
      // explains why a capability the harness lacks is on today's list.
      for (const item of final) {
        if (item.classHit === null || item.classHit === undefined || item.forced !== undefined) continue
        const gap = standingGaps.find((entry) => entry.tag === item.classHit)
        if (gap === undefined) continue
        item.forced = gap.tag
        item.classLabel = gap.label
        item.reasons = [
          ...(item.reasons ?? []),
          {
            code: 'class',
            zh: '能力升级：Harness 出厂不带「' + gap.label.zh + '」，当前也没有插件覆盖',
            en: 'Capability upgrade: DSH ships no ' + gap.label.en + ' and nothing installed covers it',
          },
        ]
      }
      const ranked = [...guaranteed, ...final.filter((item) => !guaranteed.includes(item))]

      // One gap should not consume the whole list: keep at most two items per
      // gap unless the item is a guaranteed capability upgrade.
      const perGap = new Map()
      const diversified = ranked.filter((item) => {
        if (item.forced !== undefined) return true
        const key = item.gap ?? null
        if (key === null) return true
        const used = perGap.get(key) ?? 0
        if (used >= 2) return false
        perGap.set(key, used + 1)
        return true
      })

      // Model picks may name a plugin no heuristic would surface. They are
      // validated like everything else before they reach the tab.
      const aiPicks = Array.isArray(state.modelPicks) ? state.modelPicks : []
      let aiMatched = 0
      for (const pick of aiPicks.slice(0, 3)) {
        const wanted = normalizePickName(pick.name)
        if (wanted === '') continue
        const target = scoredPool.find((item) => {
          const names = [normalizePickName(item.name), normalizePickName(item.npm), normalizePickName(item.spec)]
          return names.includes(wanted)
        })
        if (target === undefined) {
          // Not in the scored pool (filtered by adoption, or simply outside the
          // npm window): ask the registry directly, and keep it only if the
          // package really declares a dsh bundle.
          const fresh = await candidateFromRegistry(String(pick.name).trim())
          if (fresh === null) continue
          const extra = { ...fresh, verified: true, modelPick: true, score: 50, tier: 'proven', gap: null, classHit: null, reasons: [{ code: 'model-pick', zh: 'AI 判断能提效：' + pick.why, en: 'AI pick: ' + pick.why }], install: installHint(fresh.spec), use: useHint(fresh.category) }
          if (diversified.some((item) => item.id === extra.id)) continue
          diversified.unshift(extra)
          aiMatched += 1
          continue
        }
        aiMatched += 1
        const existing = diversified.find((item) => item.id === target.id)
        if (existing !== undefined) {
          existing.modelPick = true
          existing.reasons = [...(existing.reasons ?? []), { code: 'model-pick', zh: 'AI 判断能提效：' + pick.why, en: 'AI pick: ' + pick.why }]
          continue
        }
        const check = await verifyCandidate(target).catch(() => null)
        if (check === null || check.verified !== true) continue
        target.verified = true
        target.modelPick = true
        target.reasons = [...(target.reasons ?? []), { code: 'model-pick', zh: 'AI 判断能提效：' + pick.why, en: 'AI pick: ' + pick.why }]
        diversified.unshift(target)
      }

      if (state.modelStatus !== null && state.modelStatus !== undefined) state.modelStatus.matched = aiMatched
      verified.length = 0
      verified.push(...final)
      recommendations.length = 0
      recommendations.push(...diversified)

      for (const [id, entry] of Object.entries(catalog)) {
        if (entry?.s === undefined) continue
        if (daysBetween(entry.s, now) > 90) delete catalog[id]
      }
      await saveCatalog(catalog)
      const newThisWeek = Object.values(catalog).filter(
        (entry) => entry?.f !== undefined && daysBetween(entry.f, now) <= 7,
      ).length

      const updates = await checkUpdates(inventory.bundles)
      const attribution = buildAttribution({
        usageDays: state.usage.days,
        bundles: inventory.bundles,
        overrides: overrides(),
        now,
        windowDays: 30,
      })
      const idle = buildIdle({
        bundles: inventory.bundles,
        attribution: attribution.byBundle,
        firstSeen: state.firstSeen,
        snoozed: state.snoozed,
        idleDays: cfg.idleDays,
        now,
        today,
      })
      const suggestions = buildSuggestions({
        bundles: inventory.bundles,
        attribution: attribution.byBundle,
        idle,
        updates,
        profile,
        now,
      })

      const currentIds = recommendations.slice(0, cfg.maxRecommendations).map((item) => item.id)
      const previousIds = Array.isArray(state.lastRecommendationIds) ? state.lastRecommendationIds : []
      const currentInstalled = inventory.bundles.filter((bundle) => bundle.installed).map((bundle) => bundle.name)
      const previousInstalled = Array.isArray(state.lastInstalledNames) ? state.lastInstalledNames : []
      state.diff = {
        at: now,
        added: currentIds.filter((id) => !previousIds.includes(id)),
        dropped: previousIds.filter((id) => !currentIds.includes(id)),
        installed: currentInstalled.filter((name) => !previousInstalled.includes(name)),
        removed: previousInstalled.filter((name) => !currentInstalled.includes(name)),
      }
      state.lastRecommendationIds = currentIds
      state.lastInstalledNames = currentInstalled

      // Conflict detection lives in rebuildConflicts() so installs and removals
      // can refresh it without re-running the whole pipeline.

      if (cfg.llmEnabled === true && cfg.model?.provider) {
        await translateDescriptions(diversified, cfg.model)
        for (const item of diversified) {
          if (state.translations[item.name] !== undefined) item.descriptionZh = state.translations[item.name]
        }
      }

      // Attach the plugins that would close each gap, so a diagnosis is also
      // an actionable shortlist.
      const usedSuggestions = new Set()
      const gapTerms = {
        memory: /记忆|memory|recall|remember/i,
        evolution: /进化|自进化|反思|经验|self-?evolv|reflect/i,
        session: /会话|session (search|archive|manager)|归档/i,
        automation: /定时|自动化|schedule|cron|automat/i,
        tooling: /测试|校验|调试|重试|诊断|test|verify|debug|retry/i,
        ui: /界面|主题|侧边栏|ui|theme|sidebar/i,
        data: /数据|看板|图表|dashboard|chart/i,
      }
      for (const gap of gaps) {
        const entry = BASELINE_GAPS.find((item) => item.tag === gap.tag)
        const terms = gapTerms[gap.tag]
        const ranked = []
        for (const item of diversified) {
          if (usedSuggestions.has(item.id)) continue
          let weight = 0
          if (entry !== undefined && matchesBaseline(entry, item)) weight += 3
          if (gap.categories.includes(item.category)) weight += 3
          const text = [item.name, pickText(item.description, 'en'), pickText(item.description, 'zh')].join(' ')
          if (terms !== undefined && terms.test(text)) weight += 2
          if (capabilityTags(item).includes(gap.tag)) weight += 1
          if (weight >= 3) ranked.push({ item, weight })
        }
        ranked.sort((a, b) => b.weight - a.weight || b.item.score - a.item.score)
        const matching = ranked.slice(0, 2).map(({ item }) => {
          usedSuggestions.add(item.id)
          return {
            id: item.id,
            name: item.name,
            title: item.title,
            description: item.description,
            descriptionZh: item.descriptionZh ?? '',
            category: item.category,
            score: item.score,
            spec: item.spec,
            reasons: item.reasons ?? [],
            install: item.install,
            use: item.use,
            adoption: item.adoption,
            modelPick: item.modelPick === true,
            verified: true,
          }
        })
        gap.suggestions = matching
      }

      state.workProfile = profile
      state.recommendations = recommendations.slice(0, cfg.maxRecommendations)
      // Kept so "换一批" can rotate through ranked candidates without another
      // network round trip (the full refresh takes minutes).
      state.shortlist = recommendations.slice(0, 60)
      // Attribution feeds the installed view, so it has to be current first.
      state.attribution = attribution.byBundle
      state.installed = buildInstalledView(inventory.bundles, now, inventory.active)
      rebuildConflicts()
      // Overlap cards are Chinese-facing: translate the few descriptions that
      // actually appear there, then rebuild so descriptionZh is attached.
      if (cfg.llmEnabled === true && cfg.model?.provider) {
        const wanted = []
        for (const group of state.conflicts ?? []) {
          for (const plugin of group.plugins ?? []) {
            if (state.translations?.[plugin.name] === undefined && String(plugin.description ?? '') !== '') {
              wanted.push({ name: plugin.name, description: plugin.description })
            }
          }
        }
        if (wanted.length > 0) {
          try {
            await withTimeout(translateDescriptions(wanted, cfg.model), 120_000, 'translate-conflicts')
            rebuildConflicts()
          } catch (error) {
            warn('overlap description translation failed: ' + errorMessage(error))
          }
        }
      }
      state.sourceStatus = gathered.sources
      state.intents = intentResult.intents
      state.gaps = gaps
      state.intentScanned = intentResult.scanned
      state.pain = intentResult.pain ?? null
      state.coverage = {
        at: now,
        sources: gathered.sources,
        candidates: gathered.candidates.length,
        unique: gathered.candidates.length,
        verified: verified.length,
        rejected,
        lowSignal,
        dead,
        newFound,
        newThisWeek,
        shown: Math.min(verified.length, cfg.maxRecommendations),
      }
      state.updates = updates
      state.attribution = attribution.byBundle
      state.idle = idle
      state.suggestions = suggestions
      state.lastRunAt = now
      state.lastRunDate = today
      state.lastRunReason = reason

      const okSources = gathered.sources.filter((item) => item.status === 'ok').length
      note(
        'refresh done: ' +
          state.recommendations.length +
          ' recommendations, ' +
          state.installed.length +
          ' installed, ' +
          okSources +
          '/' +
          gathered.sources.length +
          ' sources',
      )
      await save()
      await writeDailyReport()

      if (cfg.autoInstall) await autoInstall(cfg)
      return await snapshot()
    })(), 5 * 60 * 1000, 'refresh')
    try {
      return await busy
    } finally {
      busy = null
    }
  }

  /** Fold maintenance evidence into the same bilingual reason list the UI renders. */
  function withMaintenance(reasons, maintenance) {
    const out = Array.isArray(reasons) ? [...reasons] : []
    if (maintenance === undefined) return out
    if (maintenance.pushedAgeDays !== null && maintenance.pushedAgeDays <= 30) {
      out.push({ code: 'fresh-commit', zh: '最近 30 天有提交', en: 'commits within 30 days' })
    }
    for (const flag of maintenance.flags ?? []) {
      if (flag.code === 'slow' || flag.code === 'issue-backlog') out.push(flag)
    }
    return out
  }

  function overrides() {
    const map = {}
    for (const entry of settings().toolOwners) {
      if (entry && typeof entry.tool === 'string' && typeof entry.bundle === 'string') map[entry.tool] = entry.bundle
    }
    return map
  }

  async function autoInstall(cfg) {
    const picks = state.recommendations
      .filter((item) => item.installed !== true && item.score >= cfg.autoInstallMinScore && item.risk !== true)
      .filter((item) => specKind(item.spec) === 'npm')
      .slice(0, cfg.autoInstallMax)
    for (const pick of picks) {
      try {
        note('auto-install: ' + (pick.npm || pick.spec))
        await installRecommendation(pick.id, 'auto')
      } catch (error) {
        note('auto-install failed for ' + pick.name + ': ' + errorMessage(error))
      }
    }
  }

  function findBundle(bundleName) {
    return state.installed.find((bundle) => bundle.name === bundleName)
  }

  async function installRecommendation(id, origin = 'user') {
    await (loaded ? Promise.resolve() : load())
    const engine = manager()
    if (!engine) throw new Error('pluginManager service is not available in this profile')

    // The visible list is trimmed to maxRecommendations, so a card rendered
    // from an older report can name an id the state no longer holds. Fall back
    // to the live catalog instead of refusing the click.
    let recommendation = state.recommendations.find((item) => item.id === id)
    let spec
    let kind
    if (recommendation !== undefined) {
      spec = recommendation.spec
      kind = recommendation.kind
    } else {
      const candidate = (lastPool ?? []).find((item) => item.id === id)
      if (candidate === undefined) throw new Error('Unknown recommendation: ' + id)
      const check = await verifyCandidate(candidate).catch(() => null)
      if (check === null || check.verified !== true) throw new Error('不是可安装的插件包（' + String(check?.reason ?? 'unverified') + '）')
      recommendation = { id: candidate.id, spec: candidate.spec, kind: candidate.kind ?? 'install', installed: false }
      spec = candidate.spec
      kind = candidate.kind ?? 'install'
    }
    if (spec === undefined || spec === '') throw new Error('Unknown recommendation: ' + id)
    if (PROTECTED_BUNDLES.includes(spec)) throw new Error('Refusing to install a protected package')

    note('install (' + origin + '): ' + spec)
    const result = kind === 'bundled'
      ? await engine.setBundleEnabled(spec, true)
      : await withTimeout(engine.installBundle(spec, { enabled: true }), 10 * 60 * 1000, 'install')
    const alreadyInstalled = result?.error?.code === 'already-installed'
    recommendation.installed = alreadyInstalled || result?.application === 'applied' || result?.application === 'restart-required'
    if (recommendation.installed) {
      state.firstSeen[String(spec)] = dateKey()
      if (state.dismissed?.[recommendation.id] !== undefined) delete state.dismissed[recommendation.id]
      const inventory = await readInventory()
      state.installed = buildInstalledView(inventory.bundles, Date.now(), inventory.active)
    rebuildConflicts()
    }
    note('install result: ' + (result?.application ?? 'unknown') + ' ' + (result?.error?.code ?? ''))
    await save()
    return result
  }

  async function removeBundle(bundleName, origin = 'user') {
    await (loaded ? Promise.resolve() : load())
    if (PROTECTED_BUNDLES.includes(bundleName)) throw new Error('Refusing to remove a protected bundle')
    const target = findBundle(bundleName)
    if (target === undefined) throw new Error('Unknown installed bundle: ' + bundleName)
    if (!target.removable) throw new Error('This bundle is not removable from the profile')
    const engine = manager()
    if (!engine) throw new Error('pluginManager service is not available in this profile')

    note('remove (' + origin + '): ' + bundleName)
    const result = await engine.removeBundle(bundleName)
    delete state.firstSeen[bundleName]
    delete state.snoozed[bundleName]
    if (state.attribution) delete state.attribution[bundleName]
    for (const recommendation of state.recommendations) {
      if (recommendation.npm === bundleName || recommendation.spec === bundleName) recommendation.installed = false
    }
    const inventory = await readInventory()
    state.installed = buildInstalledView(inventory.bundles, Date.now(), inventory.active)
    rebuildConflicts()
    state.idle = state.idle.filter((item) => item.name !== bundleName)
    note('remove result: ' + (result?.application ?? 'unknown'))
    await save()
    return result
  }

  async function setBundleEnabled(bundleName, enabled) {
    await (loaded ? Promise.resolve() : load())
    const engine = manager()
    if (!engine) throw new Error('pluginManager service is not available in this profile')
    const target = findBundle(bundleName)
    if (target === undefined) throw new Error('Unknown installed bundle: ' + bundleName)
    note('set enabled ' + bundleName + ': ' + enabled)
    const result = await engine.setBundleEnabled(bundleName, enabled === true)
    const inventory = await readInventory()
    state.installed = buildInstalledView(inventory.bundles, Date.now(), inventory.active)
    rebuildConflicts()
    await save()
    return result
  }

  function dismissRecommendation(id) {
    state.dismissed[id] = Date.now()
    state.recommendations = state.recommendations.filter((item) => item.id !== id)
    // Gap cards carry the same candidates; drop them too or the click looks
    // like it did nothing until the next full refresh.
    state.gaps = (state.gaps ?? []).map((gap) => ({
      ...gap,
      suggestions: (gap.suggestions ?? []).filter((item) => item.id !== id),
    }))
    if (Array.isArray(state.shortlist)) {
      state.shortlist = state.shortlist.filter((item) => item.id !== id)
    }
    note('dismissed: ' + id)
    scheduleSave()
  }

  /** Show the next page of ranked candidates without re-running the pipeline. */
  async function rotateRecommendations() {
    const pool = Array.isArray(state.shortlist) ? state.shortlist : []
    if (pool.length === 0) throw new Error('还没有可轮换的候选，请先刷新一次')
    const cfg = settings()
    const installedKeys = new Set()
    for (const item of state.installed ?? []) installedKeys.add(pkgName(item.name))
    for (const name of Object.keys(state.firstSeen ?? {})) installedKeys.add(pkgName(name))
    const usable = (item) =>
      state.dismissed[item.id] === undefined &&
      item.installed !== true &&
      !installedKeys.has(pkgName(item.spec)) &&
      !installedKeys.has(pkgName(item.name))

    const current = new Set(state.recommendations.map((item) => item.id))
    const seen = new Set(state.rotationSeen ?? [])
    let next = pool.filter((item) => usable(item) && !current.has(item.id) && !seen.has(item.id))
    if (next.length === 0) {
      // Everything has been shown once: start a fresh lap.
      state.rotationSeen = []
      next = pool.filter((item) => usable(item) && !current.has(item.id))
    }
    if (next.length === 0) throw new Error('候选池已耗尽，请刷新获取新数据')
    const page = next.slice(0, cfg.maxRecommendations)
    state.rotationSeen = [...(state.rotationSeen ?? []), ...state.recommendations.map((item) => item.id)]
    state.recommendations = page
    note('rotate: ' + page.map((item) => item.name).join(', '))
    await save()
    return page.length
  }

  function snoozeIdle(bundleName, days = 30) {
    const until = dateKey(new Date(Date.now() + clamp(Number(days) || 30, 1, 365) * DAY_MS))
    state.snoozed[bundleName] = until
    state.idle = state.idle.filter((item) => item.name !== bundleName)
    note('snoozed ' + bundleName + ' until ' + until)
    scheduleSave()
  }

  async function toolPayload() {
    const report = await snapshot()
    return {
      generatedAt: report.generatedAt,
      lastRunDate: report.lastRunDate,
      today: report.today,
      topTools: (report.profile?.topTools ?? []).map((tool) => tool.name + ' (' + tool.calls + ')'),
      workspaces: (report.profile?.workspaces ?? []).map((workspace) => workspace.title || workspace.path),
      recommendations: report.recommendations.map((item) => ({
        name: item.name,
        spec: item.spec,
        score: item.score,
        category: item.category,
        reason: (item.reasons ?? []).map((reason) => reason.zh || reason.en).join(' / '),
        installable: specKind(item.spec) === 'npm',
      })),
      installed: report.installed.slice(0, 20).map((item) => ({
        name: item.name,
        version: item.version,
        enabled: item.enabled,
        calls: item.calls,
        update: item.update?.latest ?? null,
      })),
      idle: report.idle.map((item) => ({ name: item.name, daysInactive: item.daysInactive })),
      sourceStatus: report.sourceStatus,
    }
  }

  function sendJson(response, status, payload) {
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
    response.end(JSON.stringify(payload))
  }

  function loopbackRequest(request) {
    const host = request.headers.host
    if (typeof host === 'string' && host !== '') {
      const match = /^(\[[^\]]+\]|[^:]+)(?::\d+)?$/.exec(host)
      const authority = match ? match[1].toLowerCase() : host.toLowerCase()
      if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(authority)) return false
    }
    if (request.headers['sec-fetch-site'] === 'cross-site') return false
    const origin = request.headers.origin
    if (typeof origin === 'string' && origin !== '') {
      if (origin.startsWith('dsh-app://') || origin.startsWith('file://')) return true
      try {
        const parsed = new URL(origin)
        if (typeof host === 'string' && parsed.host !== host) return false
      } catch {
        return false
      }
    }
    return true
  }

  async function readBody(request) {
    const chunks = []
    let size = 0
    for await (const chunk of request) {
      size += chunk.length
      if (size > MAX_BODY_BYTES) throw new Error('request body too large')
      chunks.push(chunk)
    }
    if (chunks.length === 0) return null
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }

  async function handleAction(request, response) {
    let body
    try {
      body = await readBody(request)
    } catch (error) {
      sendJson(response, 400, { ok: false, error: errorMessage(error) })
      return
    }
    if (body === null || typeof body !== 'object' || typeof body.action !== 'string') {
      sendJson(response, 400, { ok: false, error: 'expected { action: string }' })
      return
    }
    try {
      switch (body.action) {
        case 'refresh': {
          await refresh('manual')
          sendJson(response, 200, { ok: true, value: await snapshot() })
          return
        }
        case 'install': {
          if (typeof body.id !== 'string') throw new Error('install requires id')
          const result = await installRecommendation(body.id, 'user')
          sendJson(response, 200, { ok: true, result })
          return
        }
        case 'remove': {
          if (typeof body.name !== 'string') throw new Error('remove requires name')
          const result = await removeBundle(body.name, 'user')
          sendJson(response, 200, { ok: true, result })
          return
        }
        case 'toggle': {
          if (typeof body.name !== 'string') throw new Error('toggle requires name')
          const result = await setBundleEnabled(body.name, body.enabled === true)
          sendJson(response, 200, { ok: true, result })
          return
        }
        case 'installSpec': {
          const spec = String(body.spec ?? '').trim()
          if (spec === '') throw new Error('installSpec requires spec')
          const check = await verifyCandidate({ spec, kind: 'install' }).catch(() => ({ verified: false, reason: 'verify-failed' }))
          if (check.verified !== true) throw new Error('不是可安装的插件包（' + String(check.reason ?? 'unknown') + '）')
          const engine = manager()
          if (!engine) throw new Error('pluginManager service is not available in this profile')
          note('install (chat): ' + spec)
          const result = await withTimeout(engine.installBundle(spec, { enabled: true }), 10 * 60 * 1000, 'install')
          const applied =
            result?.application === 'applied' ||
            result?.application === 'restart-required' ||
            result?.error?.code === 'already-installed'
          if (applied) {
            const target = pkgName(spec)
            for (const item of state.recommendations) {
              if (pkgName(item.spec) === target || pkgName(item.name) === target || pkgName(item.npm) === target) {
                item.installed = true
              }
            }
            const inventory = await readInventory()
            state.installed = buildInstalledView(inventory.bundles, Date.now(), inventory.active)
            rebuildConflicts()
          }
          await save()
          const target = pkgName(spec)
          const overlaps = (state.conflicts ?? []).filter((group) =>
            (group.plugins ?? []).some((plugin) => pkgName(plugin.name) === target),
          ).map((group) => ({ tag: group.tag, names: group.names }))
          sendJson(response, 200, { ok: true, result, overlaps })
          return
        }
        case 'dismiss': {
          if (typeof body.id !== 'string') throw new Error('dismiss requires id')
          dismissRecommendation(body.id)
          sendJson(response, 200, { ok: true })
          return
        }
        case 'rotate': {
          const count = await rotateRecommendations()
          sendJson(response, 200, { ok: true, result: { rotated: count } })
          return
        }
        case 'snooze': {
          if (typeof body.name !== 'string') throw new Error('snooze requires name')
          snoozeIdle(body.name, Number(body.days) || 30)
          sendJson(response, 200, { ok: true })
          return
        }
        default:
          sendJson(response, 400, { ok: false, error: 'unknown action: ' + body.action })
      }
    } catch (error) {
      warn('action ' + body.action + ' failed: ' + errorMessage(error))
      sendJson(response, 500, { ok: false, error: errorMessage(error) })
    }
  }

  function handleRequest(request, response) {
    if (!loopbackRequest(request)) {
      sendJson(response, 403, { ok: false, error: 'refused a non-loopback request' })
      return
    }
    let pathname = '/'
    try {
      pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    } catch {
      sendJson(response, 400, { ok: false, error: 'bad url' })
      return
    }
    if (pathname === ROUTE_PREFIX + '/state') {
      if (request.method !== 'GET') {
        sendJson(response, 405, { ok: false, error: 'GET only' })
        return
      }
      void (async () => {
        try {
          await (loaded ? Promise.resolve() : load())
          // First open with no report yet: start the build and answer with the
          // current (empty) snapshot so the tab renders immediately.
          if (state.lastRunAt === 0 && busy === null) void refresh('route')
          sendJson(response, 200, { ok: true, value: await snapshot() })
        } catch (error) {
          sendJson(response, 500, { ok: false, error: errorMessage(error) })
        }
      })()
      return
    }
    if (pathname === ROUTE_PREFIX + '/chat') {
      if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, error: 'POST only' })
        return
      }
      void (async () => {
        try {
          const body = await readBody(request)
          const answer = await withTimeout(chatAbout(body && body.text), 90_000, 'chat')
          sendJson(response, 200, { ok: true, value: answer })
        } catch (error) {
          sendJson(response, 400, { ok: false, error: errorMessage(error) })
        }
      })()
      return
    }
    if (pathname === ROUTE_PREFIX + '/settings/test') {
      if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, error: 'POST only' })
        return
      }
      void (async () => {
        try {
          const body = await readBody(request)
          const candidate = body !== null && typeof body === 'object' && typeof body.model === 'object' && body.model !== null
            ? { ...body.model }
            : settings().model
          const started = Date.now()
          const answer = await analyzeWithModel(
            { ping: 'Connectivity check. Reply with {"ok":true} and nothing else.' },
            candidate,
          )
          sendJson(response, 200, {
            ok: true,
            value: { ok: answer.ok === true, ms: Date.now() - started, reason: answer.reason ?? '' },
          })
        } catch (error) {
          sendJson(response, 200, { ok: true, value: { ok: false, ms: 0, reason: errorMessage(error) } })
        }
      })()
      return
    }
    if (pathname === ROUTE_PREFIX + '/settings') {
      if (request.method === 'GET') {
        void (async () => {
          try {
            await (loaded ? Promise.resolve() : load())
            const cfg = settings()
            sendJson(response, 200, {
              ok: true,
              value: {
                catalog: await modelCatalog(),
                settings: {
                  llmEnabled: cfg.llmEnabled === true,
                  model: cfg.model,
                  runsPerDay: cfg.runsPerDay,
                  intentEnabled: cfg.intentEnabled !== false,
                },
              },
            })
          } catch (error) {
            sendJson(response, 500, { ok: false, error: errorMessage(error) })
          }
        })()
        return
      }
      if (request.method === 'POST') {
        void (async () => {
          try {
            const body = await readBody(request)
            if (body === null || typeof body !== 'object') throw new Error('expected a settings object')
            const next = {}
            if (typeof body.llmEnabled === 'boolean') next.llmEnabled = body.llmEnabled
            if (Number.isFinite(Number(body.runsPerDay))) next.runsPerDay = clamp(Math.round(Number(body.runsPerDay)), 1, 24)
            if (body.model !== null && typeof body.model === 'object') {
              next.model = {
                provider: String(body.model.provider ?? ''),
                model: String(body.model.model ?? ''),
                supportsVision: body.model.supportsVision === true,
                reasoningEffort: typeof body.model.reasoningEffort === 'string' ? body.model.reasoningEffort : '',
              }
            }
            await writeUserSettings({ ...(await readUserSettings()), ...next })
            sendJson(response, 200, { ok: true, value: { settings: { llmEnabled: settings().llmEnabled, model: settings().model, runsPerDay: settings().runsPerDay } } })
          } catch (error) {
            sendJson(response, 400, { ok: false, error: errorMessage(error) })
          }
        })()
        return
      }
      sendJson(response, 405, { ok: false, error: 'GET or POST' })
      return
    }
    if (pathname === ROUTE_PREFIX + '/action') {
      if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, error: 'POST only' })
        return
      }
      void handleAction(request, response)
      return
    }
    sendJson(response, 404, { ok: false, error: 'not found' })
  }

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: handleRequest }),
    'plugin-curator: routes',
  )

  ctx.on('tools/result', (execution) => {
    try {
      recordToolResult(execution?.name)
    } catch (error) {
      warn('usage record failed: ' + errorMessage(error))
    }
  })

  // Tools are optional: a profile without the tools service still gets the tab.
  ctx.inject(['tools'], (scope) => {
    scope.tools.register({
      name: 'plugin_curator_status',
      description:
        'Read the plugin curator daily report: recommended plugins for this workstation, tool usage of the last 7 days, '
        + 'installed plugins with update hints, and plugins idle for a long time. Installing or removing a plugin is a '
        + 'user-only action and is refused here.',
      parameters: {
        type: 'object',
        properties: {
          refresh: { type: 'boolean', description: 'Rebuild the report before reading it (network round trip).' },
        },
        additionalProperties: false,
      },
      output: {
        schema: { type: 'object', additionalProperties: true },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      },
      async execute(args) {
        if (args?.refresh === true) await refresh('tool')
        return toolPayload()
      },
    })
  })

  /**
   * Runs are paced by interval, not by a fixed hour: a silent background pass
   * several times a day is what keeps the report current.
   */
  async function tick() {
    await (loaded ? Promise.resolve() : load())
    const cfg = settings()
    const perDay = Math.max(1, Math.min(24, Number(cfg.runsPerDay) || 1))
    const everyMs = (24 * 60 * 60 * 1000) / perDay
    if (state.lastRunAt !== 0 && Date.now() - state.lastRunAt < everyMs) return
    try {
      await refresh('scheduled')
    } catch (error) {
      warn('scheduled refresh failed: ' + errorMessage(error))
    }
  }

  ctx.effect(
    () =>
      ctx.interval(() => {
        void tick()
      }, 60_000),
    'plugin-curator: daily tick',
  )

  ctx.effect(
    () =>
      ctx.timeout(() => {
        void (async () => {
          await (loaded ? Promise.resolve() : load())
          try {
            if (state.lastRunAt === 0) {
              await refresh('first-run')
              return
            }
            await tick()
          } catch (error) {
            warn('boot refresh failed: ' + errorMessage(error))
          }
        })()
      }, 6_000),
    'plugin-curator: boot refresh',
  )

  ctx.effect(() => () => {
    if (dirty) void save()
  }, 'plugin-curator: flush state')

  ctx.on('dispose', () => {
    if (saveTimer !== null) clearTimeout(saveTimer)
  })

  void load()
}
