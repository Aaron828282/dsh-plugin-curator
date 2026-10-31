/**
 * dsh-plugin-curator — pure logic for discovery, scoring, usage attribution and
 * idle detection. Deliberately free of DSH imports so it can be exercised by
 * plain node (`node --test test/core.test.mjs`).
 */

export const DAY_MS = 86_400_000

export const DEFAULT_REGISTRIES = ['https://awesome-dsh-plugin.com/plugins.json']

/** Bundles the curator must never offer to uninstall. */
export const PROTECTED_BUNDLES = Object.freeze([
  '@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app',
  'dsh-plugin-curator',
])

export const CATEGORY_LABELS = {
  agi: { en: 'AGI & agents', zh: 'AGI 与智能体' },
  ui: { en: 'UI enhancements', zh: '界面增强' },
  usage: { en: 'Usage & billing', zh: '用量与计费' },
  theme: { en: 'Themes', zh: '主题外观' },
  model: { en: 'Models & providers', zh: '模型接入' },
  identity: { en: 'Identity & comms', zh: '身份与通信' },
  session: { en: 'Sessions & messages', zh: '会话与消息' },
  memory: { en: 'Memory', zh: '记忆' },
  tools: { en: 'Tools & capabilities', zh: '工具与能力' },
  wsl: { en: 'WSL & Windows', zh: 'WSL 与 Windows' },
  browser: { en: 'Browser & web', zh: '浏览器与网页' },
  vision: { en: 'Vision', zh: '视觉与多模态' },
  voice: { en: 'Voice & audio', zh: '语音与音频' },
  docs: { en: 'Docs & rendering', zh: '文档与渲染' },
  skill: { en: 'Skills', zh: '技能包' },
  workflow: { en: 'Workflow & automation', zh: '工作流与自动化' },
  git: { en: 'Git & review', zh: 'Git 与评审' },
  notify: { en: 'Notifications', zh: '通知与集成' },
  dev: { en: 'Development & runtime', zh: '开发与运行时' },
  security: { en: 'Security', zh: '安全与权限' },
  remote: { en: 'Remote & mobile', zh: '远程与移动端' },
  market: { en: 'Markets & managers', zh: '市场与管理器' },
  fun: { en: 'Just for fun', zh: '娱乐' },
}

const TOOL_TAG_RULES = [
  [/^(bash|pwsh|cmd|terminal|shell|run_code|job_|lsp|str_replace)/, ['code']],
  [/^(read|write|edit|glob|grep|apply_patch|multi_edit)/, ['code']],
  [/^(web_search|web_fetch|session_search|fetch)/, ['research']],
  [/^(read_image|image|ocr|screenshot)/, ['vision']],
  [/^(subagent|workflow|team_|spawn_|interrupt_|send_message|list_agents)/, ['agent']],
  [/memory|mnemon|engram|recall/, ['memory']],
  [/office|docx|xlsx|pptx|pdf|spreadsheet|document/, ['docs']],
  [/git/, ['git']],
  [/schedule|proactive|remind|cron/, ['automation']],
]

const TAG_CATEGORIES = {
  code: ['dev', 'git', 'tools'],
  research: ['browser', 'docs', 'tools'],
  vision: ['vision', 'ui'],
  agent: ['agi', 'workflow', 'tools'],
  memory: ['memory'],
  docs: ['docs', 'ui'],
  git: ['git', 'dev'],
  automation: ['workflow', 'tools'],
}

const TERM_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'you', 'into', 'via', 'new',
  'run', 'code', 'read', 'write', 'kill', 'bash', 'file', 'files', 'data', 'test', 'build',
  'workspace', 'project', 'plugin', 'agent', 'tool', 'call', 'result', 'task', 'app',
  'deepseek', 'harness', 'dsh', 'plugin', 'plugins', 'cordis', 'tool', 'tools', 'app', 'web',
  '项目', '工作', '插件', '工具', '会话', '用户', '支持', '可以', '一个', '使用', '进行', '以及',
])

const GENERIC_TOKENS = new Set([
  'dsh', 'dshmarket', 'plugin', 'plugins', 'core', 'base', 'client', 'tool', 'tools', 'web',
  'app', 'harness', 'deepseek', 'manager', 'bundle', 'extension', 'provider', 'theme', 'font',
  'http', 'api', 'node', 'server', 'runtime', 'config', 'settings', 'ui', 'kit', 'common',
])

/**
 * Tools exported by bundles whose tool names share no token with the bundle
 * name. Name matching alone cannot recover these: dsh-free-search exports
 * `web_search`, billion-context exports `compress`. Each entry is
 * [bundleName, toolPrefixes]; a tool starting with one of the prefixes
 * belongs to that bundle. Checked before the generic token match, so an
 * explicit entry beats a coincidence such as `web` inside a bundle name.
 */
export const KNOWN_TOOL_OWNERS = [
  ['dsh-free-search', ['web_search', 'web_fetch', 'platform_search', 'advanced_search', 'multi_search', 'research', 'video_search', 'domain_search', 'cache_search', 'free_search_test', 'global_search', 'search_pro', 'search_web_pages', 'web_search_exa', 'zhihu_search', 'weather']],
  ['billion-context', ['compress', 'decompress', 'search_context', 'acp_status', 'acp_cache', 'acp_read_original_image', 'acp_retrieve', 'acp_rule', 'absorb']],
  ['dsh-plugin-curator', ['plugin_curator']],
  ['dsh-lingshu', ['cg', 'stg']],
  ['dsh-ops', ['ops_']],
  ['@furongjun1999/dsh-memory', ['memory_']],
  ['dsh-univer-office', ['univer_']],
  ['@ljwei-stak/dsh-model-router', ['model_router_']],
]

const CORE_TOOL_NAMES = new Set([
  'read', 'write', 'edit', 'glob', 'grep', 'bash', 'pwsh', 'web_search', 'web_fetch', 'skill',
  'todo_write', 'ask_user_question', 'subagent', 'subagent_fork', 'workflow', 'run_code',
  'create_goal', 'get_goal', 'update_goal', 'schedule_create', 'schedule_list', 'schedule_delete',
  'schedule_update', 'present', 'list_agents', 'send_message', 'interrupt_agent', 'job_list',
  'job_output', 'job_kill', 'lsp', 'read_image', 'session_search', 'session_event_search',
  'session_event_read', 'session_event_trace', 'session_trace', 'working_directory',
  'load_workspace_dependencies',
])

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function dateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key ?? ''))
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0).getTime()
}

export function daysBetween(fromKey, now = Date.now()) {
  const from = parseDateKey(fromKey)
  if (from === null) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((now - from) / DAY_MS))
}

export function lastNDays(now = Date.now(), count = 7) {
  const out = []
  for (let i = count - 1; i >= 0; i -= 1) out.push(dateKey(new Date(now - i * DAY_MS)))
  return out
}

export function formatCount(value, locale = 'en') {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (locale.startsWith('zh')) {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}亿`
    if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1)}万`
    return String(Math.round(n))
  }
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`
  return String(Math.round(n))
}

/** A LocalizedText (`string | {en, zh, ...}`) projected to one language. */
export function pickText(value, locale = 'en') {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (locale.startsWith('zh') && typeof value.zh === 'string' && value.zh !== '') return value.zh
    if (typeof value.en === 'string' && value.en !== '') return value.en
    for (const candidate of Object.values(value)) {
      if (typeof candidate === 'string' && candidate !== '') return candidate
    }
  }
  return ''
}

export function normalizePackageName(name) {
  return String(name ?? '').trim().toLowerCase()
}

export function categoryLabel(code, locale = 'zh') {
  const label = CATEGORY_LABELS[code]
  if (label === undefined) return String(code ?? '')
  return locale.startsWith('zh') ? label.zh : label.en
}

function stripQuotes(text) {
  return String(text ?? '').trim().replace(/^["']|["']$/g, '').trim()
}

/** The spec after `dsh plugin ... add`, which is what the market's own list records. */
export function parseInstallSpec(install) {
  const match = /\badd\s+(.+)$/.exec(String(install ?? ''))
  if (!match) return ''
  return stripQuotes(match[1])
}

export function specKind(spec) {
  const value = String(spec ?? '')
  if (value === '') return 'none'
  if (/^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(value)) return 'npm'
  if (/\.tgz($|\?)/i.test(value)) return 'tarball'
  if (/^(github:|git\+|git@|https?:\/\/(github|gitlab)\.com)/i.test(value)) return 'git'
  return 'path'
}

function normalizeCandidate(raw, source) {
  if (raw === null || typeof raw !== 'object') return null
  const name = String(raw.name ?? raw.package ?? '').trim()
  if (name === '') return null
  const npm = typeof raw.npm === 'string' && raw.npm.trim() !== '' ? raw.npm.trim() : ''
  const repo = String(raw.url ?? raw.repository ?? raw.html_url ?? '').trim()
  const install = parseInstallSpec(raw.install)
  const spec = npm || install || stripQuotes(raw.tarball) || repo
  const description = raw.description ?? raw.summary ?? ''
  const title = raw.title ?? raw.displayName ?? name
  const added = raw.added ?? raw.pushed_at ?? raw.created_at ?? ''
  const capabilities = Array.isArray(raw.capabilities)
    ? raw.capabilities.filter((item) => typeof item === 'string')
    : Array.isArray(raw.topics)
      ? raw.topics.filter((item) => typeof item === 'string')
      : []
  const redlines = Array.isArray(raw.capabilityRedLines) ? raw.capabilityRedLines : []
  const stars = Number(raw.stars ?? raw.stargazers_count ?? 0)
  const downloads = Number(raw.downloads ?? raw.downloadsMonthly ?? 0)
  const id = normalizePackageName(npm || repo || name)
  return {
    id,
    name,
    npm,
    repo,
    spec,
    title,
    description,
    category: typeof raw.category === 'string' ? raw.category : 'tools',
    version: typeof raw.version === 'string' ? raw.version : '',
    stars: Number.isFinite(stars) ? stars : 0,
    downloads: Number.isFinite(downloads) ? downloads : 0,
    added: typeof added === 'string' ? added.slice(0, 10) : '',
    capabilities,
    redline: redlines.length > 0,
    risk: redlines.length > 0 || capabilities.includes('credentials'),
    pushedAt: typeof raw.pushedAt === 'string' ? raw.pushedAt : '',
    publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : '',
    openIssues: Number(raw.openIssues) || 0,
    archived: raw.archived === true,
    forks: Number(raw.forks) || 0,
    source,
  }
}

/** `awesome-dsh-plugin` registry payload: `{plugins: [...]}` or a bare array. */
export function normalizeRegistry(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.plugins)
      ? payload.plugins
      : []
  const out = []
  for (const raw of list) {
    const candidate = normalizeCandidate(raw, 'awesome')
    if (candidate !== null && candidate.spec !== '') out.push(candidate)
  }
  return out
}

/** npm registry search response. */
export function normalizeNpmSearch(payload) {
  const objects = Array.isArray(payload?.objects) ? payload.objects : []
  const out = []
  for (const entry of objects) {
    const pkg = entry?.package
    if (pkg === null || typeof pkg !== 'object') continue
    const keywords = Array.isArray(pkg.keywords) ? pkg.keywords : []
    if (!keywords.some((keyword) => String(keyword).includes('dsh'))) continue
    const candidate = normalizeCandidate({
      name: pkg.name,
      npm: pkg.name,
      url: pkg.links?.repository ?? pkg.links?.homepage ?? '',
      description: pkg.description ?? '',
      version: pkg.version ?? '',
      downloads: entry.downloads?.monthly ?? 0,
      added: pkg.date ?? entry.updated ?? '',
      publishedAt: pkg.date ?? '',
      capabilities: keywords,
    }, 'npm')
    if (candidate !== null && candidate.spec !== '') out.push(candidate)
  }
  return out
}

/** GitHub search response (`/search/repositories`). */
export function normalizeGithubSearch(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  const out = []
  for (const repo of items) {
    const fullName = String(repo.full_name ?? '')
    if (fullName === '') continue
    const candidate = normalizeCandidate({
      name: repo.name ?? fullName,
      url: repo.html_url ?? '',
      description: repo.description ?? '',
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      added: repo.created_at ?? repo.pushed_at ?? '',
      pushedAt: String(repo.pushed_at ?? '').slice(0, 10),
      openIssues: repo.open_issues_count ?? 0,
      archived: repo.archived === true,
      topics: repo.topics ?? [],
      install: `dsh plugin add github:${fullName}`,
    }, 'github')
    if (candidate !== null && candidate.spec !== '') out.push(candidate)
  }
  return out
}


/**
 * Maintenance is the other half of quality: a popular package that stopped
 * shipping a year ago is a trap, and an archived repository is a dead end.
 * Every signal here comes from the search payload itself, so judging costs no
 * extra request.
 */
export function maintenanceOf(candidate, now = Date.now()) {
  const pushed = parseDateKey(candidate?.pushedAt) ?? parseDateKey(candidate?.publishedAt)
  const pushedAgeDays = pushed === null ? null : Math.max(0, Math.floor((now - pushed) / DAY_MS))
  const archived = candidate?.archived === true
  const openIssues = Number(candidate?.openIssues) || 0
  const stars = Number(candidate?.stars) || 0
  const flags = []
  if (archived) flags.push({ code: 'archived', zh: '仓库已归档', en: 'repository archived' })
  if (pushedAgeDays !== null && pushedAgeDays > 365) {
    flags.push({ code: 'stale', zh: '一年多没有提交', en: 'no commits for over a year' })
  }
  if (pushedAgeDays !== null && pushedAgeDays > 180 && pushedAgeDays <= 365) {
    flags.push({ code: 'slow', zh: '半年没有提交', en: 'no commits for six months' })
  }
  if (stars >= 50 && openIssues > stars * 0.6) {
    flags.push({ code: 'issue-backlog', zh: '未处理 issue 偏多', en: 'large unresolved issue backlog' })
  }
  const alive = !archived && (pushedAgeDays === null || pushedAgeDays <= 365)
  return { pushedAgeDays, archived, openIssues, stars, flags, alive }
}

/** Merge candidate lists, preferring entries that carry an installable npm spec. */
export function mergeCandidates(lists) {
  const byId = new Map()
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const candidate of list) {
      if (candidate?.id === undefined || candidate.id === '') continue
      const existing = byId.get(candidate.id)
      if (existing === undefined) {
        byId.set(candidate.id, { ...candidate })
        continue
      }
      const merged = { ...existing }
      for (const field of ['npm', 'repo', 'spec', 'version', 'added', 'category']) {
        if (!merged[field] && candidate[field]) merged[field] = candidate[field]
      }
      merged.stars = Math.max(existing.stars ?? 0, candidate.stars ?? 0)
      merged.downloads = Math.max(existing.downloads ?? 0, candidate.downloads ?? 0)
      merged.capabilities = [...new Set([...(existing.capabilities ?? []), ...(candidate.capabilities ?? [])])].slice(0, 12)
      merged.risk = Boolean(existing.risk || candidate.risk)
      merged.redline = Boolean(existing.redline || candidate.redline)
      if (existing.description === '' && candidate.description !== '') merged.description = candidate.description
      if (candidate.npm && !merged.npm) merged.npm = candidate.npm
      if (candidate.npm && candidate.source === 'awesome') merged.spec = candidate.npm
      byId.set(candidate.id, merged)
    }
  }
  return [...byId.values()]
}

function tokensOf(text) {
  const lower = String(text ?? '').toLowerCase()
  const tokens = new Set()
  for (const match of lower.matchAll(/[a-z][a-z0-9+#._-]{2,}/g)) {
    const token = match[0].replace(/[._-]+$/g, '')
    if (token.length >= 3 && !TERM_STOPWORDS.has(token)) tokens.add(token)
  }
  for (const match of lower.matchAll(/[\u4e00-\u9fa5]{2,}/g)) {
    const run = match[0]
    if (!TERM_STOPWORDS.has(run) && run.length <= 6) tokens.add(run)
    for (let i = 0; i + 2 <= run.length; i += 1) {
      const bigram = run.slice(i, i + 2)
      if (!TERM_STOPWORDS.has(bigram)) tokens.add(bigram)
    }
  }
  return [...tokens]
}

export function toolTags(toolName) {
  const name = String(toolName ?? '').toLowerCase()
  const tags = new Set()
  for (const [pattern, values] of TOOL_TAG_RULES) {
    if (pattern.test(name)) for (const value of values) tags.add(value)
  }
  return [...tags]
}

/**
 * Work profile derived from the last `windowDays` of tool traffic plus the
 * workspaces this profile knows about. It is a derived cache: rebuilding it
 * from the same inputs yields the same answer.
 */
export function buildProfile({ usageDays = {}, workspaces = [], now = Date.now(), windowDays = 7 } = {}) {
  const days = lastNDays(now, windowDays)
  const toolTotals = new Map()
  for (const day of days) {
    const tools = usageDays?.[day]?.tools
    if (tools === null || typeof tools !== 'object') continue
    for (const [tool, count] of Object.entries(tools)) {
      const n = Number(count)
      if (!Number.isFinite(n) || n <= 0) continue
      toolTotals.set(tool, (toolTotals.get(tool) ?? 0) + n)
    }
  }
  const topTools = [...toolTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, calls]) => ({ name, calls }))
  const totalCalls = [...toolTotals.values()].reduce((sum, value) => sum + value, 0)

  const tags = new Set()
  for (const { name } of topTools) for (const tag of toolTags(name)) tags.add(tag)
  if (tags.size === 0) tags.add('code')

  const categoryWeights = {}
  for (const tag of tags) {
    for (const category of TAG_CATEGORIES[tag] ?? []) {
      categoryWeights[category] = Math.min(1, (categoryWeights[category] ?? 0) + 0.5)
    }
  }

  const termMap = new Map()
  const addTerm = (value, label, weight) => {
    const token = String(value ?? '').toLowerCase().trim()
    if (token.length < 2) return
    const existing = termMap.get(token)
    if (existing === undefined || existing.weight < weight) termMap.set(token, { value: token, label, weight })
  }
  const recentWorkspaces = workspaces.slice(0, 6).map((workspace) => ({
    title: String(workspace?.title ?? workspace?.name ?? workspace?.path ?? ''),
    path: String(workspace?.path ?? ''),
  }))
  for (const workspace of recentWorkspaces) {
    const base = workspace.path.split(/[\\/]/).filter(Boolean).pop() ?? ''
    for (const token of tokensOf(`${workspace.title} ${base}`)) addTerm(token, token, 3)
  }
  for (const { name } of topTools) {
    for (const token of tokensOf(name.replace(/_/g, ' '))) addTerm(token, token, 1)
  }
  const terms = [...termMap.values()].sort((a, b) => b.weight - a.weight).slice(0, 40)

  return {
    windowDays,
    totalCalls,
    topTools,
    workspaces: recentWorkspaces,
    tags: [...tags],
    categoryWeights,
    terms,
  }
}

/** Score one candidate against the profile. Deterministic for fixed inputs. */
export function scoreCandidate(candidate, profile) {
  const reasons = []
  let score = 20
  const text = [
    candidate.name,
    pickText(candidate.title, 'en'),
    pickText(candidate.description, 'en'),
    pickText(candidate.description, 'zh'),
    ...(candidate.capabilities ?? []),
  ].join(' ').toLowerCase()

  const affinity = profile?.categoryWeights?.[candidate.category] ?? 0
  if (affinity >= 0.45) {
    score += Math.round(affinity * 20)
    const label = CATEGORY_LABELS[candidate.category]
    reasons.push({
      code: 'category',
      en: `Matches your ${label?.en ?? candidate.category} focus`,
      zh: `匹配你的「${label?.zh ?? candidate.category}」关注`,
    })
  }

  const matched = []
  let termScore = 0
  for (const term of profile?.terms ?? []) {
    if (term.value.length < 2) continue
    if (!text.includes(term.value)) continue
    if (!matched.includes(term.label)) matched.push(term.label)
    termScore += Math.min(6, term.weight * 2)
    if (matched.length >= 4) break
  }
  score += Math.min(18, termScore)
  if (matched.length > 0) {
    const joined = matched.slice(0, 4).join(', ')
    reasons.push({ code: 'term', en: `Mentions ${joined}`, zh: `描述命中 ${joined}` })
  }

  const downloads = Number(candidate.downloads) || 0
  const stars = Number(candidate.stars) || 0
  if (downloads > 0) score += Math.min(12, Math.log10(downloads + 1) * 3)
  if (stars > 0) score += Math.min(8, Math.log10(stars + 1) * 2.5)
  if (downloads >= 5_000) {
    reasons.push({
      code: 'popular',
      en: `${formatCount(downloads, 'en')} downloads a month`,
      zh: `月下载 ${formatCount(downloads, 'zh')}`,
    })
  }

  const addedAt = parseDateKey(candidate.added)
  if (addedAt !== null) {
    const age = Math.max(0, Math.floor((Date.now() - addedAt) / DAY_MS))
    if (age <= 7) {
      score += 6
      reasons.push({ code: 'fresh', en: 'Added this week', zh: '本周新增' })
    } else if (age <= 30) {
      score += 3
      reasons.push({ code: 'fresh', en: 'Added this month', zh: '本月新增' })
    }
  }

  const kind = specKind(candidate.spec)
  if (candidate.kind === 'bundled') {
    score += 8
    reasons.push({ code: 'shipped', en: 'Shipped with DSH, only switched off', zh: '官方内置，只是没启用' })
  }
  if (kind === 'git' || kind === 'path') score -= 6
  if (candidate.risk) score -= 8
  if ((candidate.capabilities ?? []).includes('shell')) score -= 2
  if (candidate.redline) {
    reasons.push({
      code: 'risk',
      en: 'Broad permissions; review before installing',
      zh: '权限较宽，安装前请确认',
    })
  }

  return { score: Math.round(clamp(score, 0, 99)), reasons, matched, kind }
}

function bundleTokens(bundle) {
  const tokens = new Set()
  const parts = [bundle.name]
  for (const row of bundle.rows ?? []) {
    if (row?.rowId) parts.push(row.rowId)
    if (row?.moduleName) parts.push(row.moduleName)
  }
  for (const part of parts) {
    let value = String(part).toLowerCase()
    value = value.replace(/^@[^/]+\//, '').replace(/^dsh-/, '')
    for (const token of value.split(/[^a-z0-9]+/)) {
      if (token.length >= 3 && !GENERIC_TOKENS.has(token)) tokens.add(token)
    }
  }
  return [...tokens]
}

/**
 * Attribute tool calls to installed bundles. Four layers, first match wins:
 * exact user override; bundle-declared tool names; a known tool-owner table;
 * then the longest token a bundle's name/rows share with the tool name. The
 * last layer is a guess and the UI labels the result as an estimate.
 */
export function buildAttribution({ usageDays = {}, bundles = [], overrides = {}, live = null, now = Date.now(), windowDays = 30 } = {}) {
  const tokensByBundle = new Map()
  for (const bundle of bundles) tokensByBundle.set(bundle.name, bundleTokens(bundle))
  const installed = new Set(bundles.map((bundle) => String(bundle?.name ?? '')))
  /**
   * The tool registry is the only first-hand evidence that a name is a real,
   * currently registered tool — `ctx.tools.schemas()` answers that but says
   * nothing about ownership, and no bundle manifest on disk reliably lists its
   * exports. So `live` is used as a *veto*, never as a source of attribution:
   * a call against a name the registry does not know does not belong to any
   * installed bundle, whatever the name happens to spell.
   */
  const liveTools = Array.isArray(live) && live.length > 0
    ? new Set(live.map((name) => String(name ?? '').toLowerCase()))
    : null
  // Tools a bundle declares it exports: authoritative when present.
  const toolsByOwner = new Map()
  for (const bundle of bundles) {
    for (const tool of bundle?.tools ?? []) {
      if (typeof tool === 'string' && tool !== '') toolsByOwner.set(tool.toLowerCase(), bundle.name)
    }
  }
  // Fallback table for bundles that declare nothing: only for bundles that
  // are actually installed, so a stale entry cannot claim calls.
  const knownByPrefix = []
  for (const [bundleName, prefixes] of KNOWN_TOOL_OWNERS) {
    if (!installed.has(bundleName)) continue
    for (const prefix of prefixes) knownByPrefix.push({ prefix: prefix.toLowerCase(), bundle: bundleName })
  }
  knownByPrefix.sort((a, b) => b.prefix.length - a.prefix.length)
  const callsByBundle = new Map()
  const toolsByBundle = new Map()
  const lastByBundle = new Map()
  const unattributed = new Map()
  const howByBundle = new Map()

  const overrideEntries = Object.entries(overrides ?? {})

  const ownerOf = (tool) => {
    const lower = String(tool ?? '').toLowerCase()
    for (const [exact, bundle] of overrideEntries) {
      if (exact.toLowerCase() === lower) return { bundle, how: 'override' }
    }
    // A declared export is evidence, so it must be consulted BEFORE the
    // built-in core list: a plugin is free to export a tool whose name the
    // harness also uses (dsh-free-search exports `web_search`), and the
    // installed plugin is what actually served the call. The core list only
    // breaks ties for names no installed bundle claims.
    const declared = toolsByOwner.get(lower)
    if (declared !== undefined) return { bundle: declared, how: 'declared' }
    // An explicit table entry is curated knowledge about a real bundle, so it
    // outranks both the core list and the registry veto: `ctx.tools.schemas()`
    // reflects the CURRENT scope, while usage history spans past sessions and
    // subagent scopes whose tools may not be registered right now. Vetoing on
    // that basis would erase real historical calls (dsh-ops, dsh-memory).
    for (const entry of knownByPrefix) {
      if (lower === entry.prefix || lower.startsWith(entry.prefix + '_')) {
        return { bundle: entry.bundle, how: 'known' }
      }
    }
    // A name the registry does not expose cannot have come from a live
    // bundle. Manual overrides and the curated table stay authoritative
    // because they encode knowledge the registry cannot express.
    if (liveTools !== null && !liveTools.has(lower)) {
      if (CORE_TOOL_NAMES.has(lower)) return undefined
      return { bundle: undefined, how: 'unknown' }
    }
    // The harness core ships its own tools; never hand them to a plugin on
    // the strength of a name guess when a plugin name merely shares a word.
    if (CORE_TOOL_NAMES.has(lower)) return undefined
    let best
    let bestScore = 0
    for (const [bundle, tokens] of tokensByBundle) {
      for (const token of tokens) {
        if (token.length < 3) continue
        const escaped = token.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&')
        const prefix = lower.startsWith(token + '_')
        const boundary = new RegExp('(^|[^a-z])' + escaped + '([^a-z]|$)').test(lower)
        if (!prefix && !boundary) continue
        // A tool named after the plugin's own prefix (ops_bash -> dsh-ops)
        // beats a word that only appears inside the name (bash -> dsh-base).
        const score = (prefix ? 1000 : 0) + token.length
        if (score > bestScore) {
          best = bundle
          bestScore = score
        }
      }
    }
    return best === undefined ? undefined : { bundle: best, how: 'guessed' }
  }

  for (const day of lastNDays(now, windowDays)) {
    const tools = usageDays?.[day]?.tools
    if (tools === null || typeof tools !== 'object') continue
    for (const [tool, count] of Object.entries(tools)) {
      const n = Number(count)
      if (!Number.isFinite(n) || n <= 0) continue
      const owner = ownerOf(tool)
      // `undefined` means "the harness served this itself"; the `unknown`
      // marker means "a call we cannot place". Both stay out of per-bundle
      // counts, but only the second is worth reporting as unattributed.
      if (owner === undefined || owner.bundle === undefined) {
        if (owner !== undefined) unattributed.set(tool, (unattributed.get(tool) ?? 0) + n)
        continue
      }
      callsByBundle.set(owner.bundle, (callsByBundle.get(owner.bundle) ?? 0) + n)
      const toolsForBundle = toolsByBundle.get(owner.bundle) ?? new Map()
      toolsForBundle.set(tool, (toolsForBundle.get(tool) ?? 0) + n)
      toolsByBundle.set(owner.bundle, toolsForBundle)
      lastByBundle.set(owner.bundle, day)
      // Record the weakest link: a bundle is only as trustworthy as its
      // shakiest attribution, so the UI can say how sure it is.
      const rank = { override: 3, declared: 2, known: 1, guessed: 0 }
      const seen = howByBundle.get(owner.bundle)
      if (seen === undefined || rank[owner.how] < rank[seen]) howByBundle.set(owner.bundle, owner.how)
    }
  }

  const result = {}
  for (const [bundle, calls] of callsByBundle) {
    result[bundle] = {
      calls,
      tools: Object.fromEntries([...toolsByBundle.get(bundle)].sort((a, b) => b[1] - a[1])),
      lastUsed: lastByBundle.get(bundle) ?? '',
      how: howByBundle.get(bundle) ?? 'guessed',
    }
  }
  return { byBundle: result, unattributed: Object.fromEntries(unattributed) }
}

/** Enabled, removable bundles with no attributed call for `idleDays` days. */
export function buildIdle({ bundles = [], attribution = {}, firstSeen = {}, snoozed = {}, idleDays = 30, now = Date.now(), today = dateKey() } = {}) {
  const items = []
  for (const bundle of bundles) {
    if (!bundle?.installed || !bundle.enabled) continue
    if (!bundle.removable) continue
    if (PROTECTED_BUNDLES.includes(bundle.name)) continue
    const record = attribution[bundle.name]
    const lastUsed = record?.lastUsed || firstSeen[bundle.name] || (bundle.added ? String(bundle.added).slice(0, 10) : '')
    if (lastUsed === '') continue
    const inactive = daysBetween(lastUsed, now)
    if (inactive < idleDays) continue
    const snoozedUntil = snoozed[bundle.name] ?? ''
    if (snoozedUntil !== '' && snoozedUntil >= today) continue
    items.push({
      name: bundle.name,
      title: pickText(bundle.meta?.title, 'en') || bundle.name,
      description: pickText(bundle.description, 'en'),
      version: bundle.version ?? '',
      daysInactive: inactive,
      lastUsed,
      calls: record?.calls ?? 0,
      snoozedUntil,
      reason: {
        zh: '连续 ' + inactive + ' 天没有关联调用' + (lastUsed === '' ? '' : '（最近一次 ' + lastUsed + '）'),
        en: 'no related calls for ' + inactive + ' days' + (lastUsed === '' ? '' : ' (last ' + lastUsed + ')'),
      },
    })
  }
  return items.sort((a, b) => b.daysInactive - a.daysInactive)
}

export function isNewerVersion(latest, current) {
  const parse = (value) => String(value ?? '').replace(/^v/i, '').split('-')[0].split('.').map((part) => Number(part) || 0)
  const a = parse(latest)
  const b = parse(current)
  if (a.length === 0 || b.length === 0) return false
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const left = a[i] ?? 0
    const right = b[i] ?? 0
    if (left > right) return true
    if (left < right) return false
  }
  return false
}

/** One-line optimization hint per installed bundle. */
export function buildSuggestions({ bundles = [], attribution = {}, idle = [], updates = {}, profile = {}, now = Date.now() } = {}) {
  const idleByName = new Map(idle.map((item) => [item.name, item]))
  const out = {}
  for (const bundle of bundles) {
    if (!bundle.installed) continue
    const calls = attribution[bundle.name]?.calls ?? 0
    const update = updates[bundle.name]
    if (update !== undefined && isNewerVersion(update.latest, update.current)) {
      out[bundle.name] = {
        code: 'update',
        en: `Update available: ${update.current || '?'} → ${update.latest}`,
        zh: `可升级：${update.current || '?'} → ${update.latest}`,
      }
      continue
    }
    if (idleByName.has(bundle.name)) {
      const item = idleByName.get(bundle.name)
      out[bundle.name] = {
        code: 'idle',
        en: `No related calls for ${item.daysInactive} days`,
        zh: `${item.daysInactive} 天没有相关调用`,
      }
      continue
    }
    if (calls >= 15) {
      out[bundle.name] = { code: 'hot', en: `Active: ${calls} related calls in 30 days`, zh: `高频：近 30 天关联调用 ${calls} 次` }
      continue
    }
    const capabilities = bundle.capabilities ?? []
    if (capabilities.includes('credentials')) {
      out[bundle.name] = { code: 'risk', en: 'Reads credentials; keep its config tight', zh: '会读取凭据，建议收紧配置' }
      continue
    }
    out[bundle.name] = { code: 'ok', en: 'Enabled; no change suggested', zh: '已启用，暂无调整建议' }
  }
  return out
}

/**
 * Capability tags mined from what the user actually asked for. The map is
 * intentionally bilingual and narrow: a tag fires on explicit need language,
 * not on any mention of the topic.
 */
export const INTENT_RULES = [
  {
    tag: 'memory',
    label: { en: 'session memory', zh: '会话记忆' },
    pattern: /记忆|记住|忘(了|记)|上次(说|聊|做)|之前(说|聊|做)|跨会话|长期记忆|回顾一下|memory|remember|recall|persistent context/i,
    category: ['memory'],
  },
  {
    tag: 'automation',
    label: { en: 'automation & scheduling', zh: '自动化与定时' },
    pattern: /每天|每日|定时|自动(跑|执行|生成|发)|重复(做|执行|劳动)|批量(处理|生成)|例行|不用我管|schedule|every day|cron|automat/i,
    category: ['workflow'],
  },
  {
    tag: 'research',
    label: { en: 'research & browsing', zh: '检索与浏览' },
    pattern: /搜索|检索|调研|查一下|找资料|网页|抓取|爬|research|search|browse|scrape/i,
    category: ['browser', 'docs'],
  },
  {
    tag: 'documents',
    label: { en: 'documents & reports', zh: '文档与报告' },
    pattern: /文档|报告|总结成|排版|导出|ppt|幻灯片|excel|表格|word|pdf|docx|xlsx/i,
    category: ['docs'],
  },
  {
    tag: 'vision',
    label: { en: 'images & vision', zh: '图像与视觉' },
    pattern: /图片|截图|ocr|视觉|图像|看图|vision|image|screenshot/i,
    category: ['vision'],
  },
  {
    tag: 'git',
    label: { en: 'git & review', zh: 'Git 与评审' },
    pattern: /\bgit\b|提交|分支|合并|冲突|diff|代码评审|pull request|commit|branch|merge/i,
    category: ['git', 'dev'],
  },
  {
    tag: 'notify',
    label: { en: 'notifications', zh: '通知提醒' },
    pattern: /通知|提醒我|告警|推送|发我|notify|alert|remind/i,
    category: ['notify'],
  },
  {
    tag: 'data',
    label: { en: 'data & dashboards', zh: '数据与看板' },
    pattern: /数据库|sql|数据分析|图表|看板|\bdashboard\b|\bchart\b/i,
    category: ['usage'],
  },
  {
    tag: 'voice',
    label: { en: 'voice & audio', zh: '语音与音频' },
    pattern: /语音|朗读|说话|听写|voice|tts|speech|audio/i,
    category: ['voice'],
  },
  {
    tag: 'notes',
    label: { en: 'notes & knowledge base', zh: '笔记与知识库' },
    pattern: /笔记|知识库|归档|整理资料|wiki|obsidian|notion/i,
    category: ['memory', 'docs'],
  },
  {
    tag: 'agents',
    label: { en: 'multi-agent work', zh: '多智能体协作' },
    pattern: /子智能体|多智能体|并行(做|跑)|委派|分身|subagent|multi-agent|parallel agents/i,
    category: ['agi', 'workflow'],
  },
  {
    tag: 'ui',
    label: { en: 'interface & ergonomics', zh: '界面与易用性' },
    pattern: /界面|侧边栏|快捷键|主题切换|布局|不好用|难用|\bui\b|\btheme\b|\bsidebar\b/i,
    category: ['ui', 'theme'],
  },
]

const INTENT_BY_TAG = new Map(INTENT_RULES.map((rule) => [rule.tag, rule]))

/**
 * Mine capability gaps from user-authored text (one entry per prompt).
 * A tag is present when it fires at least minHits times overall and is seen in
 * at least minSessions distinct sessions, so one rant cannot create a gap.
 */
export function sanitizePrompt(raw) {
  let text = String(raw ?? '')
  text = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, ' ')
  text = text
    .split('\n')
    .filter((line) => {
      const value = line.trim()
      if (value === '') return false
      if (/^(You are an AI agent|# DeepSeek Harness|Current runtime context|Filesystem sandbox|Approval prompts)/i.test(value)) return false
      return true
    })
    .join('\n')
  return text.replace(/[ \t]+/g, ' ').trim()
}

/** Language that marks a sentence as a request from the user rather than prose. */
export const NEED_MARKERS = /想要|希望|能不能|能否|有没有|是否有|是否能|需要(一个|能|自动|有)|缺少|每次都|手动(做|改|搬)|麻烦|帮我|给我|请(帮我|给我)|该如何|怎么才能|would like|i want|i need|is there|can you|wish|ideally|how (can|do) i/i

/** Prompts that describe building a plugin are specs, not needs. */
export const AUTHORING_MARKERS = /写一个插件|开发一个插件|做一个插件|实现一个插件|插件需求|write a plugin|build a plugin|implement a plugin|plugin spec/i

/** Attachment envelopes and bare media paths are not prose the user wrote. */
const ATTACHMENT_MARKERS = /<type>(image|file|audio|video)<\/type>|^image\/(jpeg|png|webp|gif)|\.(jpg|jpeg|png|mp4|mov|pdf|docx|xlsx|zip)\b/i

function sentencesOf(text) {
  return text
    .split(/(?<=[。！？!?；;\n])/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4)
}

/**
 * Mine capability gaps from user-authored text (one entry per prompt).
 *
 * A tag only counts when the capability word sits next to language that asks
 * for something. An entry that is itself a plugin spec is skipped wholesale:
 * it describes what to build, not what the user lacks.
 */
export function detectIntents(texts, { minHits = 1, minSessions = 1, snippet = 90, window = 24 } = {}) {
  const stats = new Map()
  for (const entry of texts) {
    const text = sanitizePrompt(entry?.text)
    if (text.length < 8) continue
    if (AUTHORING_MARKERS.test(text)) continue
    for (const sentence of sentencesOf(text)) {
      if (ATTACHMENT_MARKERS.test(sentence)) continue
      for (const rule of INTENT_RULES) {
        const pattern = new RegExp(rule.pattern.source, 'gi')
        let match
        let accepted = 0
        while ((match = pattern.exec(sentence)) !== null) {
          const start = Math.max(0, match.index - window)
          const around = sentence.slice(start, match.index + match[0].length + window)
          if (NEED_MARKERS.test(around)) accepted += 1
          if (match.index === pattern.lastIndex) pattern.lastIndex += 1
        }
        if (accepted === 0) continue
        const record = stats.get(rule.tag) ?? { tag: rule.tag, hits: 0, sessions: new Set(), evidence: [] }
        record.hits += accepted
        record.sessions.add(String(entry.sessionId ?? ''))
        if (record.evidence.length < 3) record.evidence.push(sentence.slice(0, snippet))
        stats.set(rule.tag, record)
      }
    }
  }
  const out = []
  for (const record of stats.values()) {
    if (record.hits < minHits) continue
    if (record.sessions.size < minSessions) continue
    const rule = INTENT_BY_TAG.get(record.tag)
    out.push({
      tag: record.tag,
      label: rule?.label ?? { en: record.tag, zh: record.tag },
      hits: record.hits,
      sessions: record.sessions.size,
      evidence: record.evidence,
      categories: rule?.category ?? [],
      source: 'asked',
    })
  }
  return out.sort((a, b) => b.sessions - a.sessions || b.hits - a.hits)
}

/** Tags a bundle or candidate already covers, from its name, category and text. */
export function capabilityTags(subject) {
  const text = [
    subject?.name,
    subject?.category,
    pickText(subject?.title, 'en'),
    pickText(subject?.title, 'zh'),
    pickText(subject?.description, 'en'),
    pickText(subject?.description, 'zh'),
    ...(subject?.capabilities ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const tags = new Set()
  for (const rule of INTENT_RULES) if (rule.pattern.test(text)) tags.add(rule.tag)
  for (const rule of INTENT_RULES) if ((rule.category ?? []).includes(subject?.category)) tags.add(rule.tag)
  return [...tags]
}


/**
 * Capabilities an installed bundle demonstrably provides.
 *
 * capabilityTags() reads free-form descriptions, which is right for matching a
 * candidate against an intent but far too loose for claiming two installed
 * plugins overlap ("dashboard" alone made a context viewer and a model pool
 * collide). Overlap therefore needs evidence: a tool the bundle actually
 * registers, or a domain word in its own name/title. Descriptions are ignored
 * here on purpose.
 */
export const OVERLAP_DOMAINS = [
  {
    tag: 'memory',
    tools: /^(memory_|meow_|recall|remember|engram_)/i,
    names: /memory|记忆|mnemon|engram|recall/i,
    reason: {
      zh: '都负责跨会话记忆：各自注册了记忆写入/检索工具，同时启用会重复写入同一批对话内容，召回时也会互相干扰。',
      en: 'Both handle cross-session memory; enabling both writes the same conversations twice and their recall results compete.',
    },
  },
  {
    tag: 'session',
    tools: /^(session_|history_|transcript_)/i,
    names: /session|conversation|会话|标题/i,
    reason: {
      zh: '都在读写会话记录（搜索、归档或标题），同时启用会重复索引同一批会话日志。',
      en: 'Both read or write session logs (search, archive, titles); enabling both indexes the same transcripts twice.',
    },
  },
  {
    tag: 'automation',
    tools: /^(cron_|schedule_|todo_|remind_|automation_)/i,
    names: /proactive|schedule|automation|todo|定时|巡检|提醒/i,
    reason: {
      zh: '都在做后台自动化（定时任务/待办/主动巡检），同时启用会出现两套调度，重复触发同一件事。',
      en: 'Both run background automation (schedules, todos, proactive checks); two schedulers will fire the same work twice.',
    },
  },
  {
    tag: 'documents',
    tools: /^(office_|docx_|xlsx_|pptx_|pdf_|doc_)/i,
    names: /office|document|文档|表格|演示|pdf/i,
    reason: {
      zh: '都提供文档处理能力（读取/生成 Office 或 PDF），同时启用会让同类文件走两条不同的处理链路。',
      en: 'Both provide document processing; the same files would be handled by two different pipelines.',
    },
  },
  {
    tag: 'ui',
    tools: /^(ui_|theme_|wallpaper_|sidebar_)/i,
    names: /wallpaper|theme|侧边栏|界面|外观/i,
    reason: {
      zh: '都在改界面外观（主题/壁纸/侧边栏），同时启用会互相覆盖样式。',
      en: 'Both restyle the interface (theme, wallpaper, sidebar); they will fight over the same styles.',
    },
  },
  {
    tag: 'research',
    tools: /^(web_|search_|fetch_|crawl_|browse_)/i,
    names: /search|research|检索|搜索|联网/i,
    reason: {
      zh: '都提供外部检索/抓取能力，同时启用会重复发起同样的网络请求。',
      en: 'Both provide external retrieval; the same queries get issued twice.',
    },
  },
  {
    tag: 'tooling',
    tools: /^(ops_|bash|shell|file_|edit_)/i,
    names: /ops|shell|file-?system|toolkit/i,
    reason: {
      zh: '都提供底层执行/文件工具，同时启用会让模型看到两套功能重叠的工具，增加选择成本。',
      en: 'Both expose low-level execution or file tools, so the model sees two overlapping tool sets.',
    },
  },
]

/** Evidence-backed overlap domains for one installed bundle. */
export function overlapEvidence(bundle) {
  const tools = (bundle?.tools ?? []).map((tool) => String(tool?.name ?? tool).toLowerCase())
  const text = [bundle?.name, pickText(bundle?.title, 'en'), pickText(bundle?.title, 'zh')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const hits = []
  for (const domain of OVERLAP_DOMAINS) {
    const matchedTools = tools.filter((tool) => domain.tools.test(tool))
    const nameHit = domain.names.test(text)
    if (matchedTools.length === 0 && !nameHit) continue
    hits.push({
      tag: domain.tag,
      // A registered tool is hard evidence; a name keyword alone is only a hint.
      strength: matchedTools.length > 0 ? 2 : 1,
      tools: matchedTools.slice(0, 3),
      reason: domain.reason,
    })
  }
  return hits
}


const NAME_STOPWORDS = new Set(['dsh', 'plugin', 'plugins', 'bundle', 'agent', 'agents', 'manager', 'tool', 'tools', 'mcp', 'with', 'from'])

/** Distinctive words of a package name, used to prove two names share a domain. */
export function nameTokens(name) {
  return new Set(
    String(name ?? '')
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fa5]+/)
      .filter((token) => token.length >= 4 && !NAME_STOPWORDS.has(token)),
  )
}

/**
 * Group installed bundles whose overlap is provable.
 *
 * A group needs either two bundles that register a tool in the same domain, or
 * members whose own names share a distinctive word. Description text is never
 * used: "dashboard" appearing in two unrelated descriptions is not overlap.
 */
export function groupOverlaps(items) {
  const byTag = new Map()
  for (const item of items ?? []) {
    if (item?.enabled === false) continue
    for (const hit of overlapEvidence(item)) {
      const bucket = byTag.get(hit.tag) ?? { reason: hit.reason, items: [] }
      bucket.items.push({ item, evidence: hit })
      byTag.set(hit.tag, bucket)
    }
  }
  const groups = []
  for (const [tag, bucket] of byTag.entries()) {
    if (bucket.items.length < 2) continue
    const strong = bucket.items.filter(({ evidence }) => evidence.strength === 2)
    let kept = []
    if (strong.length >= 2) {
      const strongTokens = strong.map(({ item }) => nameTokens(item.name))
      const strongNames = new Set(strong.map(({ item }) => item.name))
      kept = bucket.items.filter(({ item }) => {
        if (strongNames.has(item.name)) return true
        const own = nameTokens(item.name)
        return [...own].some((token) => strongTokens.some((set) => set.has(token)))
      })
    } else {
      const shared = bucket.items.reduce(
        (acc, { item }, index) => (index === 0 ? nameTokens(item.name) : new Set([...acc].filter((token) => nameTokens(item.name).has(token)))),
        new Set(),
      )
      if (shared.size > 0) kept = bucket.items
    }
    if (kept.length > 1) groups.push({ tag, reason: bucket.reason, items: kept })
  }
  return groups
}

/** Gaps are mined intents no installed bundle already covers. */
export function openGaps(intents, installedBundles) {
  const covered = new Set()
  for (const bundle of installedBundles ?? []) {
    if (bundle?.enabled === false) continue
    for (const tag of capabilityTags(bundle)) covered.add(tag)
  }
  return (intents ?? []).filter((intent) => !covered.has(intent.tag))
}


/**
 * Adoption tier for one candidate. Half of the public registry has never been
 * downloaded, so "exists" is not "worth recommending":
 *  - proven: real adoption (downloads or stars) — safe to shortlist;
 *  - new:    published recently, no signal yet — discoverable, never auto-installed;
 *  - unused: old and unadopted — counted for coverage, never shown.
 */
export function qualityTier(candidate, { now = Date.now(), minDownloads = 100, minStars = 5, newDays = 14 } = {}) {
  const downloads = Number(candidate?.downloads) || 0
  const stars = Number(candidate?.stars) || 0
  // A bundle shipped with the harness has no download count because it is not
  // downloaded at all; adoption signals do not apply to it.
  if (candidate?.kind === 'bundled') {
    return { tier: 'proven', downloads, stars, ageDays: null, maintenance: maintenanceOf(candidate, now) }
  }
  const maintenance = maintenanceOf(candidate, now)
  if (!maintenance.alive) {
    const addedAt = parseDateKey(candidate?.added)
    return {
      tier: 'dead',
      downloads,
      stars,
      ageDays: addedAt === null ? null : Math.floor((now - addedAt) / DAY_MS),
      maintenance,
    }
  }
  if (downloads >= minDownloads || stars >= minStars) {
    return { tier: 'proven', downloads, stars, ageDays: null, maintenance }
  }
  const addedAt = parseDateKey(candidate?.added)
  const ageDays = addedAt === null ? null : Math.floor((now - addedAt) / DAY_MS)
  if (ageDays !== null && ageDays <= newDays) {
    return { tier: 'new', downloads, stars, ageDays, maintenance }
  }
  return { tier: 'unused', downloads, stars, ageDays, maintenance }
}


/** Category-specific "how to use it" copy, kept short and honest. */
export const USE_HINTS = {
  memory: {
    zh: '启用后在相关会话自动读写记忆；第一次使用按插件 README 初始化它的记忆库。',
    en: 'Enable it, then let it read and write memory in later sessions; initialize its store once per its README.',
  },
  automation: {
    zh: '启用后用插件自带的定时入口（或 /schedule）配置一次，之后按计划执行。',
    en: 'Enable it, configure one schedule through its own entry (or /schedule), then let it run.',
  },
  ui: { zh: '启用后刷新页面即可看到界面变化，样式在设置里调。', en: 'Enable it and reload the page; adjust styling in Settings.' },
  theme: { zh: '启用后在 设置 → 外观 里选择主题。', en: 'Enable it, then pick the theme in Settings → Appearance.' },
  browser: { zh: '启用后直接让 Agent 打开网页或检索，无需额外命令。', en: 'Enable it and ask the agent to browse or search; no extra command.' },
  docs: { zh: '启用后通过文档工具或对话直接生成/读取文件。', en: 'Enable it, then generate or read documents through the doc tools or chat.' },
  git: { zh: '启用后在仓库目录里使用；多数能力会自动感知当前 git 状态。', en: 'Enable it inside a repository; most capabilities read the current git state automatically.' },
  vision: { zh: '启用后把图片拖进对话或给出路径即可。', en: 'Enable it, then drop an image into the chat or pass a path.' },
  usage: { zh: '启用后打开它自己的面板查看统计。', en: 'Enable it, then open its own panel for the numbers.' },
  dev: { zh: '启用后按插件 README 的入口使用（命令或面板）。', en: 'Enable it and use the entry its README names (command or panel).' },
  default: { zh: '启用后在插件页确认已开启，按其 README 使用。', en: 'Enable it, confirm it is on in Plugins, then follow its README.' },
}

/** The exact command that installs this spec outside the UI. */
export function installHint(spec) {
  return { spec, command: 'dsh plugin add ' + spec }
}

/** Short, concrete usage copy for one recommendation. */
export function useHint(category) {
  return USE_HINTS[category] ?? USE_HINTS.default
}


/**
 * Capabilities the harness itself does not ship. They are standing gaps: worth
 * recommending until something installed closes them, independent of whether
 * the user has asked for them yet.
 */
export const BASELINE_GAPS = [
  {
    tag: 'memory',
    label: { zh: '会话记忆', en: 'session memory' },
    categories: ['memory'],
    match: /记忆|memory|recall|remember/i,
    note: { zh: 'Harness 出厂不自带跨会话记忆', en: 'DSH ships no cross-session memory' },
  },
  {
    tag: 'evolution',
    label: { zh: '自进化与经验沉淀', en: 'self-evolution' },
    categories: ['agi', 'memory'],
    match: /自进化|进化|自我改进|反思|经验沉淀|self-?evolv|reflect|experience/i,
    note: { zh: 'Harness 出厂不会把做过的事沉淀成经验', en: 'DSH does not turn past work into experience' },
  },
  {
    tag: 'session',
    label: { zh: '会话管理与检索', en: 'session management' },
    categories: ['session'],
    match: /会话管理|会话检索|会话归档|session (search|archive|manager)/i,
    note: { zh: 'Harness 的会话检索默认关闭，也没有归档管理', en: 'session search is off by default and there is no archive UI' },
  },
  {
    tag: 'automation',
    label: { zh: '自动化与定时', en: 'automation & scheduling' },
    categories: ['workflow'],
    match: /定时|自动化|schedul|cron|automat/i,
    note: { zh: 'Harness 出厂只有会话内定时提醒', en: 'DSH only schedules inside a session' },
  },
]

function subjectText(subject) {
  return [
    subject?.name,
    pickText(subject?.title, 'en'),
    pickText(subject?.title, 'zh'),
    pickText(subject?.description, 'en'),
    pickText(subject?.description, 'zh'),
    ...(subject?.capabilities ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

/** Baseline gaps not already covered by an installed bundle or a mined intent. */
export function baselineGaps(installedBundles, existingTags = [], baseline = BASELINE_GAPS) {
  const covered = new Set(existingTags)
  for (const bundle of installedBundles ?? []) {
    if (bundle?.enabled === false) continue
    const text = subjectText(bundle)
    for (const tag of capabilityTags(bundle)) covered.add(tag)
    for (const entry of baseline) if (entry.match?.test(text) === true) covered.add(entry.tag)
  }
  return baseline
    .filter((entry) => !covered.has(entry.tag))
    .map((entry) => ({
      tag: entry.tag,
      label: entry.label,
      hits: 0,
      sessions: 0,
      evidence: [entry.note.zh],
      categories: entry.categories,
      source: 'baseline',
    }))
}

/** Whether one candidate plausibly belongs to a baseline capability class. */
export function matchesBaseline(entry, subject) {
  if (entry === undefined || subject === undefined) return false
  if (entry.categories?.includes(subject.category)) return true
  return entry.match?.test(subjectText(subject)) === true
}


/** Domain words used to find plugins that could replace a failing tool. */
export const TOOL_DOMAINS = {
  read: /file|filesystem|search|grep|glob|index|文件|检索|搜索/i,
  write: /file|edit|patch|write|文件|编辑/i,
  edit: /edit|patch|replace|diff|编辑|替换/i,
  glob: /search|index|find|检索|索引/i,
  grep: /search|index|grep|检索|索引/i,
  bash: /shell|terminal|sandbox|command|终端|命令/i,
  pwsh: /shell|terminal|powershell|command|终端/i,
  web_search: /search|web|browse|检索|搜索|网页/i,
  web_fetch: /fetch|http|web|抓取|网页/i,
  run_code: /script|code|sandbox|执行/i,
  read_image: /image|vision|ocr|图片|视觉/i,
  subagent: /agent|delegate|子智能体/i,
}

/**
 * Pair tool calls with their results and attribute failures to the tool that
 * caused them. Pairing prefers a call id when the log carries one and falls
 * back to arrival order, so it works on both shapes.
 */
export function attributeToolErrors(events) {
  // Calls stay in arrival order: ids are the fast path, but plenty of logs
  // carry an id on the call and none on the result, so order is the fallback.
  const pending = []
  const stats = new Map()
  for (const event of events ?? []) {
    const data = event?.data ?? {}
    if (event?.type === 'tool/call') {
      pending.push({ id: data.callId ?? data.id ?? data.toolCallId, name: String(data.name ?? 'unknown') })
      continue
    }
    if (event?.type !== 'tool/result') continue
    const id = data.callId ?? data.message?.source?.callId ?? data.id ?? data.toolCallId
    let entry
    if (id !== undefined) {
      const at = pending.findIndex((item) => item.id === id)
      if (at >= 0) entry = pending.splice(at, 1)[0]
    }
    if (entry === undefined) entry = pending.shift()
    const name = entry?.name ?? 'unknown'
    const record = stats.get(name) ?? { name, calls: 0, errors: 0 }
    record.calls += 1
    if (data.error !== undefined && data.error !== null) record.errors += 1
    stats.set(name, record)
  }
  return [...stats.values()]
    .map((record) => ({ ...record, rate: record.calls === 0 ? 0 : Math.round((record.errors / record.calls) * 100) }))
    .sort((a, b) => b.errors - a.errors || b.calls - a.calls)
}

/** The single most actionable failing tool, if any crosses the bar. */
export function failingTool(stats, { minCalls = 10, minRate = 20 } = {}) {
  const candidate = (stats ?? []).find((item) => item.calls >= minCalls && item.rate >= minRate)
  if (candidate === undefined) return null
  const domain = TOOL_DOMAINS[candidate.name] ?? null
  return {
    ...candidate,
    match: domain,
    evidence: candidate.name + ' 调用 ' + candidate.calls + ' 次、失败 ' + candidate.errors + ' 次（' + candidate.rate + '%）',
  }
}

/** Tokenize a free-text need: latin words plus CJK bigrams. */
export function queryTokens(text) {
  const lower = String(text ?? '').toLowerCase()
  const tokens = new Set()
  for (const match of lower.matchAll(/[a-z][a-z0-9+#._-]{2,}/g)) tokens.add(match[0])
  for (const match of lower.matchAll(/[\u4e00-\u9fa5]{2,}/g)) {
    const run = match[0]
    for (let i = 0; i + 2 <= run.length; i += 1) tokens.add(run.slice(i, i + 2))
  }
  return [...tokens]
}

/** Rank catalog entries against a free-text need. Pure and cheap: no model. */
export function searchCatalog(items, query, { limit = 30 } = {}) {
  const tokens = queryTokens(query)
  if (tokens.length === 0) return []
  const scored = []
  for (const item of items ?? []) {
    const text = [
      item.name,
      item.npm,
      item.category,
      pickText(item.title, 'en'),
      pickText(item.description, 'en'),
      pickText(item.description, 'zh'),
      ...(item.capabilities ?? []),
    ].filter(Boolean).join(' ').toLowerCase()
    let score = 0
    let hits = 0
    for (const token of tokens) {
      if (text.includes(token)) {
        score += token.length >= 3 ? 3 : 2
        hits += 1
      }
    }
    if (hits === 0) continue
    if (String(item.name).toLowerCase().includes(String(query).toLowerCase())) score += 6
    score += Math.min(4, Math.log10((Number(item.downloads) || 0) + 1))
    scored.push({ item, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || (Number(b.item.downloads) || 0) - (Number(a.item.downloads) || 0))
    .slice(0, limit)
    .map((entry) => entry.item)
}

/** Plugin market index format 1: { format: 1, plugins: [{ name, versions: [...] }] }. */
export function normalizeMarketIndex(payload, indexUrl = '') {
  if (payload === null || typeof payload !== 'object') return []
  if (payload.format !== 1 || !Array.isArray(payload.plugins)) return []
  const out = []
  for (const entry of payload.plugins) {
    if (entry === null || typeof entry !== 'object') continue
    const name = String(entry.name ?? '').trim()
    if (name === '') continue
    const versions = Array.isArray(entry.versions) ? entry.versions : []
    const latest = versions[0] ?? null
    const source = latest?.source ?? null
    let spec = name
    if (source !== null && source.type === 'git' && typeof source.url === 'string') {
      spec = 'git+' + source.url + (source.commit ? '#' + source.commit : '')
    } else if (latest !== null && typeof latest.version === 'string' && latest.version !== '') {
      spec = name + '@' + latest.version
    }
    out.push({
      id: normalizePackageName(name),
      name,
      npm: source === null || source.type === 'npm' ? name : '',
      repo: typeof entry.repository?.url === 'string' ? entry.repository.url : '',
      spec,
      title: entry.title ?? name,
      description: entry.description ?? '',
      category: typeof entry.metadata?.category === 'string' ? entry.metadata.category : 'tools',
      version: typeof latest?.version === 'string' ? latest.version : '',
      stars: 0,
      downloads: 0,
      added: latest?.publishTimestamp
        ? new Date(latest.publishTimestamp * 1000).toISOString().slice(0, 10)
        : '',
      capabilities: Array.isArray(entry.metadata?.keywords) ? entry.metadata.keywords.slice(0, 12) : [],
      redline: false,
      risk: false,
      source: 'market',
      indexUrl,
    })
  }
  return out
}
