import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAttribution,
  buildIdle,
  buildProfile,
  buildSuggestions,
  dateKey,
  isNewerVersion,
  mergeCandidates,
  normalizeGithubSearch,
  attributeToolErrors,
  baselineGaps,
  failingTool,
  detectIntents,
  maintenanceOf,
  normalizeMarketIndex,
  openGaps,
  qualityTier,
  normalizeNpmSearch,
  normalizeRegistry,
  parseDateKey,
  pickText,
  scoreCandidate,
  specKind,
} from '../core.js'

const DAY = 86_400_000
const now = new Date(2026, 9, 23, 12, 0, 0).getTime()

test('pickText projects localized text', () => {
  assert.equal(pickText('plain'), 'plain')
  assert.equal(pickText({ en: 'Hello', zh: '你好' }, 'zh'), '你好')
  assert.equal(pickText({ en: 'Hello' }, 'zh'), 'Hello')
  assert.equal(pickText(null), '')
})

test('specKind classifies install specs', () => {
  assert.equal(specKind('dsh-ops'), 'npm')
  assert.equal(specKind('@scope/pkg'), 'npm')
  assert.equal(specKind('github:owner/repo'), 'git')
  assert.equal(specKind('https://github.com/o/r'), 'git')
  assert.equal(specKind('./local-dir'), 'path')
  assert.equal(specKind(''), 'none')
})

test('registry, npm and github payloads normalize to candidates', () => {
  const registry = normalizeRegistry({
    plugins: [
      { name: 'dsh-memory', npm: 'dsh-memory', description: { en: 'Memory', zh: '记忆' }, category: 'memory' },
      { name: '' },
    ],
  })
  assert.equal(registry.length, 1)
  assert.equal(registry[0].id, 'dsh-memory')
  assert.equal(registry[0].spec, 'dsh-memory')

  const npm = normalizeNpmSearch({
    objects: [
      { package: { name: 'dsh-vision', keywords: ['dsh-plugin'], version: '1.2.0' }, downloads: { monthly: 1234 } },
      { package: { name: 'other', keywords: ['unrelated'] } },
    ],
  })
  assert.equal(npm.length, 1)
  assert.equal(npm[0].downloads, 1234)

  const gh = normalizeGithubSearch({ items: [{ full_name: 'o/r', html_url: 'https://github.com/o/r', stargazers_count: 9 }] })
  assert.equal(gh.length, 1)
  assert.equal(gh[0].spec, 'github:o/r')
  assert.equal(gh[0].stars, 9)
})

test('mergeCandidates keeps one row per id and prefers npm specs', () => {
  const merged = mergeCandidates([
    [{ id: 'dsh-a', name: 'dsh-a', npm: '', spec: 'github:o/a', stars: 1, capabilities: ['git'] }],
    [{ id: 'dsh-a', name: 'dsh-a', npm: 'dsh-a', spec: 'dsh-a', stars: 5, capabilities: ['memory'] }],
  ])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].npm, 'dsh-a')
  assert.equal(merged[0].stars, 5)
  assert.deepEqual(merged[0].capabilities.sort(), ['git', 'memory'])
})

test('work profile turns tool traffic into categories and terms', () => {
  const today = dateKey(new Date(now))
  const profile = buildProfile({
    usageDays: { [today]: { tools: { read: 10, bash: 4, web_search: 3, office_docx: 2 } } },
    workspaces: [{ title: 'deepseek 插件', path: 'D:/Projects/deepseek超级进化' }],
    now,
    windowDays: 7,
  })
  assert.equal(profile.totalCalls, 19)
  assert.equal(profile.topTools[0].name, 'read')
  assert.ok(profile.tags.includes('code'))
  assert.ok(profile.tags.includes('research'))
  assert.ok(Object.keys(profile.categoryWeights).length > 0)
})

test('scoreCandidate is deterministic and rewards affinity', () => {
  const profile = buildProfile({
    usageDays: { [dateKey(new Date(now))]: { tools: { read: 5, bash: 5 } } },
    workspaces: [{ title: 'deepseek 插件', path: 'D:/Projects/deepseek超级进化' }],
    now,
  })
  const candidate = {
    id: 'dsh-git', name: 'dsh-git', npm: 'dsh-git', spec: 'dsh-git',
    title: 'Git helper', description: 'Git review tools', category: 'git',
    capabilities: [], stars: 100, downloads: 9000, added: '2026-10-20', risk: false,
  }
  const a = scoreCandidate(candidate, profile)
  const b = scoreCandidate(candidate, profile)
  assert.deepEqual(a, b)
  assert.ok(a.score > 20)
  assert.ok(a.score <= 99)
})

test('attribution maps tools to bundles and skips core tools', () => {
  const today = dateKey(new Date(now))
  const bundles = [
    { name: 'dsh-memory', rows: [{ rowId: 'memory-recall' }] },
    { name: 'dsh-ops', rows: [{ rowId: 'ops-shell' }] },
  ]
  const { byBundle } = buildAttribution({
    usageDays: { [today]: { tools: { memory_recall: 4, ops_bash: 2, read: 7 } } },
    bundles,
    now,
    windowDays: 30,
  })
  assert.equal(byBundle['dsh-memory'].calls, 4)
  assert.ok(byBundle['dsh-ops'].calls >= 2)
  assert.equal(byBundle.read, undefined)
})

test('idle detection honours snooze, disabled and protected bundles', () => {
  const old = '2026-08-01'
  const bundles = [
    { name: 'dsh-old', installed: true, enabled: true, removable: true },
    { name: 'dsh-disabled', installed: true, enabled: false, removable: true },
    { name: 'dsh-snoozed', installed: true, enabled: true, removable: true },
    { name: '@deepseek-ai/dsh-base', installed: true, enabled: true, removable: true },
  ]
  const idle = buildIdle({
    bundles,
    attribution: {},
    firstSeen: { 'dsh-old': old, 'dsh-disabled': old, 'dsh-snoozed': old, '@deepseek-ai/dsh-base': old },
    snoozed: { 'dsh-snoozed': '2026-12-01' },
    idleDays: 30,
    now,
    today: dateKey(new Date(now)),
  })
  assert.deepEqual(idle.map((item) => item.name), ['dsh-old'])
  assert.ok(idle[0].daysInactive >= 30)
})

test('version comparison and suggestions', () => {
  assert.equal(isNewerVersion('1.2.0', '1.1.9'), true)
  assert.equal(isNewerVersion('1.2.0', '1.2.0'), false)
  assert.equal(isNewerVersion('0.9', '1.0'), false)

  const suggestions = buildSuggestions({
    bundles: [{ name: 'dsh-x', installed: true }],
    attribution: { 'dsh-x': { calls: 20 } },
    idle: [],
    updates: {},
    now,
  })
  assert.equal(suggestions['dsh-x'].code, 'hot')
})

test('date helpers round-trip', () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05')
  assert.equal(parseDateKey('2026-01-05'), new Date(2026, 0, 5, 12).getTime())
  assert.equal(parseDateKey('nope'), null)
})
test('market index format 1 normalizes to installable candidates', () => {
  const list = normalizeMarketIndex({
    format: 1,
    plugins: [
      {
        name: 'dsh-alpha',
        title: { en: 'Alpha', zh: '阿尔法' },
        versions: [{ version: '1.2.0', publishTimestamp: 1_760_000_000, source: { type: 'npm' } }],
      },
      {
        name: 'dsh-beta',
        versions: [{ version: '0.3.0', publishTimestamp: 1_760_000_000, source: { type: 'git', url: 'https://github.com/o/beta.git', commit: 'abc123' } }],
      },
      { name: 'dsh-gamma', versions: [{ version: '2.0.0', publishTimestamp: 1_760_000_000, source: { type: 'npm' } }] },
    ],
  }, 'https://example.test/index.json')
  assert.equal(list.length, 3)
  assert.equal(list[0].spec, 'dsh-alpha@1.2.0')
  assert.equal(list[1].spec, 'git+https://github.com/o/beta.git#abc123')
  assert.equal(list[2].spec, 'dsh-gamma@2.0.0')
  assert.equal(list[0].source, 'market')
})

test('a malformed market index yields nothing instead of throwing', () => {
  assert.deepEqual(normalizeMarketIndex({ format: 2, plugins: [] }), [])
  assert.deepEqual(normalizeMarketIndex(null), [])
  assert.deepEqual(normalizeMarketIndex({ format: 1 }), [])
})
test('intent mining fires on need language, not on topic mentions', () => {
  const intents = detectIntents([
    { sessionId: 'a', text: 'Harness 当前是否有这个会话记忆自进化的能力？' },
    { sessionId: 'b', text: '我希望它能记住上次的项目约定' },
    { sessionId: 'c', text: '今天天气怎么样' },
  ])
  const tags = intents.map((item) => item.tag)
  assert.ok(tags.includes('memory'))
  const memory = intents.find((item) => item.tag === 'memory')
  assert.equal(memory.sessions, 2)
  assert.ok(memory.hits >= 2)
  assert.ok(memory.evidence[0].length > 0)
})

test('openGaps drops intents an installed plugin already covers', () => {
  const intents = detectIntents([
    { sessionId: 'a', text: '我希望它能记住上次的约定，别再重来' },
    { sessionId: 'b', text: '能不能记住我们之前说好的项目约定？' },
  ])
  const withoutCoverage = openGaps(intents, [])
  assert.equal(withoutCoverage.length, 1)
  const covered = openGaps(intents, [{ name: 'dsh-engram', enabled: true, description: '跨会话长期记忆插件' }])
  assert.equal(covered.length, 0)
})
test('adoption tiers separate proven, new and unused', () => {
  const now = new Date(2026, 9, 23).getTime()
  const options = { now, minDownloads: 100, minStars: 5, newDays: 14 }
  assert.equal(qualityTier({ downloads: 500, stars: 0, added: '2025-01-01' }, options).tier, 'proven')
  assert.equal(qualityTier({ downloads: 0, stars: 12, added: '2025-01-01' }, options).tier, 'proven')
  assert.equal(qualityTier({ downloads: 0, stars: 0, added: '2026-10-20' }, options).tier, 'new')
  assert.equal(qualityTier({ downloads: 0, stars: 1, added: '2025-06-01' }, options).tier, 'unused')
  assert.equal(qualityTier({ downloads: 0, stars: 0, added: '' }, options).tier, 'unused')
})
test('baseline gaps stand until an installed plugin covers them', () => {
  const gaps = baselineGaps([], [])
  assert.deepEqual(gaps.map((gap) => gap.tag).sort(), ['automation', 'evolution', 'memory', 'session'])
  const covered = baselineGaps([{ name: 'dsh-engram', enabled: true, description: '跨会话长期记忆' }], ['automation'])
  assert.deepEqual(covered.map((gap) => gap.tag), ['evolution', 'session'])
})

test('archived or stale repositories are dead, not merely unused', () => {
  const now = new Date(2026, 9, 23).getTime()
  const base = { downloads: 9000, stars: 500, added: '2025-01-01' }
  assert.equal(qualityTier({ ...base, archived: true }, { now }).tier, 'dead')
  assert.equal(qualityTier({ ...base, pushedAt: '2024-01-01' }, { now }).tier, 'dead')
  assert.equal(qualityTier({ ...base, pushedAt: '2026-09-01' }, { now }).tier, 'proven')
  const slow = maintenanceOf({ pushedAt: '2026-01-01' }, now)
  assert.ok(slow.flags.some((flag) => flag.code === 'slow'))
  const backlog = maintenanceOf({ stars: 100, openIssues: 80 }, now)
  assert.ok(backlog.flags.some((flag) => flag.code === 'issue-backlog'))
})
test('tool errors are attributed to the tool that failed', () => {
  const stats = attributeToolErrors([
    { type: 'tool/call', data: { name: 'read', callId: '1' } },
    { type: 'tool/result', data: { callId: '1', error: { code: 'ENOENT' } } },
    { type: 'tool/call', data: { name: 'read', callId: '2' } },
    { type: 'tool/result', data: { callId: '2' } },
    { type: 'tool/call', data: { name: 'bash' } },
    { type: 'tool/result', data: { error: { code: 'EACCES' } } },
  ])
  const read = stats.find((item) => item.name === 'read')
  assert.equal(read.calls, 2)
  assert.equal(read.errors, 1)
  assert.equal(read.rate, 50)
  const bash = stats.find((item) => item.name === 'bash')
  assert.equal(bash.errors, 1)

  const failing = failingTool(stats, { minCalls: 1, minRate: 30 })
  assert.equal(failing.name, 'read')
  assert.ok(failing.match instanceof RegExp)
  assert.equal(failingTool(stats, { minCalls: 99 }), null)
})
