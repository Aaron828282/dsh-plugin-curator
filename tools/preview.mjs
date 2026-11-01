// Offline render harness for the plugin-curator panel.
// Renders client.js with real React and a real state snapshot, in headless
// Chromium, so layout can be inspected at any width without the DSH shell.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import http from 'node:http'
import { join } from 'node:path'

const here = process.cwd()
const require = createRequire(join('C:/Users/jhw20/.dsh/profiles/desktop/'))
const chromiumPath = 'C:/Users/jhw20/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'
const statePath = 'C:/Users/jhw20/.dsh/plugin-curator/state.json'
const settingsPath = 'C:/Users/jhw20/.dsh/plugin-curator/settings.json'

const state = JSON.parse(readFileSync(statePath, 'utf8'))
const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {}

const client = readFileSync(join(here, 'client.js'), 'utf8')
const reactDir = join(here, 'node_modules/react')
const reactDomDir = join(here, 'node_modules/react-dom')

// Resolve the UMD builds so the page can load them with plain script tags.
const reactUmd = join(reactDir, 'umd/react.production.min.js')
const reactDomUmd = join(reactDomDir, 'umd/react-dom.production.min.js')

const boot = `
<script>
  window.__ModuleLoader__ = { load: function (reg) { window.__reg = reg } }
</script>
<script src="/react.js"></script>
<script src="/react-dom.js"></script>
<script src="/client.js"></script>
<script>
(function () {
  const reg = window.__reg
  const mod = reg.factory(function (name) {
    if (name === 'react') return window.React
    throw new Error('unexpected require: ' + name)
  })
  const captured = {}
  const localeStore = {
    subscribe: function () { return function () {} },
    getSnapshot: function () { return { active: 'zh-CN' } },
    getLocale: function () { return { active: 'zh-CN' } },
    locale: 'zh-CN',
    bind: function () { return function (k) { return k } },
    register: function (ns, dict) { this.dict = dict }
  }
  const ctx = {
    effect: function (fn) { try { fn() } catch (e) {} return function () {} },
    locale: localeStore,
    slots: {
      inject: function (name, fn) { return fn() },
      register: function (spec, comp) {
        captured[spec.name + '|' + (spec.key || spec.id || '')] = comp
      }
    }
  }
  window.__apiInfo = { keys: Object.keys(captured) }
  mod.apply(ctx)
  window.__apiInfo.keys = Object.keys(captured)
  const Comp = captured['main|plugin-curator']
  if (!Comp) { document.getElementById('root').textContent = 'NO COMPONENT: ' + JSON.stringify(Object.keys(captured)); return }
  const t = function (key, vars) {
    const dict = (localeStore.dict && localeStore.dict.zh) || {}
    let out = dict[key] === undefined ? key : dict[key]
    if (vars) for (const k of Object.keys(vars)) out = String(out).split('{' + k + '}').join(String(vars[k]))
    return out
  }
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(React.createElement(Comp, { t: t, locale: localeStore }))
  window.__rendered = true
})()
</script>
`

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>curator preview</title>
<style>
  :root{
    --dsw-alias-bg-base:#fff; --dsw-alias-border-l1:#e7e7ea; --dsw-alias-border-l2:#d9d9de;
    --dsw-alias-label-primary:#1b1b1f; --dsw-alias-label-secondary:#5c5c66; --dsw-alias-label-tertiary:#8e8e99;
    --dsw-alias-bg-layer-2:#f3f3f5; --dsw-alias-brand-primary:#1b1b1f; --dsw-alias-brand-on-primary:#fff;
    --dsw-alias-state-success-primary:#2b8a3e;
  }
  html,body{margin:0;padding:0;background:#fff;font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif;color:#1b1b1f}
  #root{display:block}
  .cv{box-sizing:border-box}
</style></head>
<body><div id="root"></div>${boot}</body></html>`

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  const send = (type, body) => { res.writeHead(200, { 'content-type': type }); res.end(body) }
  if (url === '/' ) return send('text/html; charset=utf-8', html)
  if (url === '/client.js') return send('application/javascript; charset=utf-8', client)
  if (url === '/react.js') return send('application/javascript; charset=utf-8', readFileSync(reactUmd, 'utf8'))
  if (url === '/react-dom.js') return send('application/javascript; charset=utf-8', readFileSync(reactDomUmd, 'utf8'))
  if (url.startsWith('/plugin-curator/api/state')) {
    return send('application/json; charset=utf-8', JSON.stringify({ ok: true, value: state }))
  }
  if (url.startsWith('/plugin-curator/api/settings')) {
    return send('application/json; charset=utf-8', JSON.stringify({ ok: true, value: Object.assign({ catalog: { available: false, providers: [] } }, settings) }))
  }
  if (url.startsWith('/plugin-curator/api/')) {
    return send('application/json; charset=utf-8', JSON.stringify({ ok: true, value: null }))
  }
  res.writeHead(404); res.end('not found')
})

const port = await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)))
const puppeteer = require('puppeteer-core')
const browser = await puppeteer.launch({ executablePath: chromiumPath, headless: true, args: ['--no-sandbox'] })

const widths = [420, 760, 1280, 1500, 1905]
const report = []
for (const width of widths) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.stack || e.message).slice(0, 900)))
  await page.setViewport({ width, height: width >= 1900 ? 1034 : 1000, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))
  const info = await page.evaluate(() => {
    if (!document.querySelector('.cv-card')) { const el = document.getElementById('root'); return { docW: 0, docH: 0, rootW: 0, rootH: 0, lastBottom: 0, mode: 'none', kpiCols: 0, masonryCols: 0, rightEdge: 0, cards: [], text: (el ? el.textContent : '').slice(0, 400) } }
    const cards = [...document.querySelectorAll('.cv-card')].map((el) => {
      const h3 = el.querySelector('h3')
      const r = el.getBoundingClientRect()
      return { t: h3 ? h3.textContent.trim() : '', x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
    })
    const root = document.querySelector('.cv')
    const rr = root ? root.getBoundingClientRect() : null
    return {
      docW: document.documentElement.clientWidth,
      docH: Math.round(document.body.scrollHeight),
      rootW: rr ? Math.round(rr.width) : 0,
      rootH: rr ? Math.round(rr.height) : 0,
      lastBottom: cards.reduce((m, c) => Math.max(m, c.y + c.h), 0),
      mode: document.querySelector('.cv-masonry') ? 'masonry' : 'grid',
      kpiCols: (function(){const g=document.querySelector('.cv-grid4');if(!g)return 0;const cs=getComputedStyle(g);return cs.gridTemplateColumns.split(' ').length})(),
      masonryCols: document.querySelectorAll('.cv-masonry-col').length,
      rightEdge: cards.reduce((m,c)=>Math.max(m,c.x+c.w),0),
      cards,
    }
  })
  info.rows = await page.evaluate(() => Array.from(document.querySelectorAll('.cv-overview > .cv-cell')).map((r) => ({ c: String(r.className).split(' ').pop(), n: r.children.length, w: Math.round(r.getBoundingClientRect().width), h: Math.round(r.getBoundingClientRect().height) })))
  info.shot = await page.screenshot({ encoding: 'base64', fullPage: false })
  info.bytes = Buffer.from(await page.screenshot({ fullPage: false })).toString('base64')
  info.cssText = await page.evaluate(() => Array.from(document.querySelectorAll('style')).map((el) => (el.textContent || '').length))
  info.probe = await page.evaluate(() => { const out = { at: '', ar: '' }; for (const sheet of Array.from(document.styleSheets)) { for (const rule of Array.from(sheet.cssRules || [])) { const t = rule.cssText || ''; if (t.includes('cv-overview') && !out.at) out.at = t.slice(0, 200); if (t.includes('data-probe') && !out.ar) out.ar = t.slice(0, 100) } } return out })
  info.which = await page.evaluate(() => Array.from(document.querySelectorAll('.cv-overview > .cv-cell')).map((r) => String(r.className).split(' ').pop() + '=' + Math.round(r.getBoundingClientRect().width)))
  info.mq = await page.evaluate(() => { const r = document.querySelector('.cv-overview'); return { w: r ? Math.round(r.getBoundingClientRect().width) : 0, mq900: window.matchMedia('(min-width: 900px)').matches, mq1120: window.matchMedia('(min-width: 1120px)').matches, dpr: window.devicePixelRatio } })
  info.geo = await page.evaluate(() => Array.from(document.querySelectorAll('.cv-overview')).map((r) => { const c = r.firstElementChild; const k = c ? c.firstElementChild : null; const rr = r.getBoundingClientRect(); const cr = c ? c.getBoundingClientRect() : null; const kr = k ? k.getBoundingClientRect() : null; const cs = getComputedStyle(r); return { row: Math.round(rr.width), cell: cr ? Math.round(cr.width) : -1, card: kr ? Math.round(kr.width) : -1, disp: cs.display, cols: cs.gridTemplateColumns.slice(0, 30) } }))
  info.errors = errors
  info.chain = await page.evaluate(() => {
    const out = []
    let el = document.querySelector('.cv')
    while (el && el !== document.body) {
      const cs = getComputedStyle(el)
      out.push({ c: String(el.className || el.tagName), w: Math.round(el.getBoundingClientRect().width), mx: cs.maxWidth, d: cs.display, fs: cs.fontSize })
      el = el.parentElement
    }
    out.push({ c: 'BODY', w: Math.round(document.body.getBoundingClientRect().width), fs: getComputedStyle(document.body).fontSize, mx: getComputedStyle(document.body).maxWidth })
    return out
  })
  info.groups = await page.evaluate(() => Array.from(document.querySelectorAll('.cv-overview > .cv-cell')).map((row) => ({ c: String(row.className), w: Math.round(row.getBoundingClientRect().width), cols: getComputedStyle(row).gridTemplateColumns })))
  info.media = await page.evaluate(() => window.matchMedia('(min-width: 1120px)').matches)
  info.overview = await page.evaluate(() => {
    const el = document.querySelector('.cv-overview')
    const m = document.querySelector('.cv-main')
    return { ov: el ? { w: Math.round(el.getBoundingClientRect().width), d: getComputedStyle(el).display, kids: el.children.length } : null, main: m ? Math.round(m.getBoundingClientRect().width) : null, rowsD: Array.from(document.querySelectorAll('.cv-ov-row')).map((r) => getComputedStyle(r).display) }
  })
  info.kpi = await page.evaluate(() => Array.from(document.querySelectorAll('.cv-grid4 .cv-stat')).map((el) => ({ txt: el.textContent.slice(0, 24), cols: getComputedStyle(el).gridColumn, w: Math.round(el.getBoundingClientRect().width) })))
  info.gridW = await page.evaluate(() => { const g = document.querySelector('.cv-grid4'); return g ? Math.round(g.getBoundingClientRect().width) : -1 })
  await page.screenshot({ path: join(here, `__p_${width}.png`), fullPage: false })
  report.push(info)
  await page.close()
}
await browser.close()
server.close()

for (const r of report) {
  const gapRight = r.docW - Math.min(r.docW, r.rootW + 0)
  console.log(`\n== width ${r.docW} (${r.mode}) rootH=${r.rootH} pageH=${r.docH} cardsBottom=${r.lastBottom} trailing=${r.docH - r.lastBottom} kpiCols=${r.kpiCols} masonry=${r.masonryCols} rightEdge=${r.rightEdge}`)
  for (const c of r.cards) console.log(`   ${c.t.padEnd(16)} x=${String(c.x).padStart(4)} y=${String(c.y).padStart(4)} w=${String(c.w).padStart(4)} h=${String(c.h).padStart(4)}`)
  if (r.text) console.log('   ROOT TEXT: ' + r.text)
  if (r.bytes && r.docW >= 1500) { writeFileSync(join(here, '__live_' + r.docW + '.png'), Buffer.from(r.bytes, 'base64')); console.log('   SAVED live ' + r.docW) }
  if (r.mq && r.docW >= 1500) console.log('   MQ: ' + JSON.stringify(r.mq))
  if (r.probe && r.docW >= 1500) console.log('   PROBE: ' + JSON.stringify(r.probe).slice(0, 400))
  if (r.cssText && r.docW >= 1500) console.log('   STYLES: ' + JSON.stringify(r.cssText))
  if (r.which && r.docW >= 1500) console.log('   WHICH: ' + JSON.stringify(r.which))
  if (r.geo && r.docW >= 1900) console.log('   GEO: ' + JSON.stringify(r.geo))
  if (r.rows && r.docW >= 1500) console.log('   ROWS: ' + JSON.stringify(r.rows))
  if (r.kpi && r.docW >= 1500) console.log('   KPI: gw=' + r.gridW + ' ' + JSON.stringify(r.kpi.slice(0, 3)))
  if (r.overview && r.docW >= 1500) console.log('   OVERVIEW: ' + JSON.stringify(r.overview))
  if (r.groups && r.docW >= 1500) console.log('   GROUPS: mq=' + r.media + ' ' + JSON.stringify(r.groups))
  if (r.chain && r.docW >= 1500) console.log('   CHAIN: ' + JSON.stringify(r.chain))
  if (r.errors.length) console.log('   ERRORS: ' + r.errors.join(' | '))
}
for (const r of report) delete r.bytes
writeFileSync(join(here, '__report.json'), JSON.stringify(report, null, 2))
