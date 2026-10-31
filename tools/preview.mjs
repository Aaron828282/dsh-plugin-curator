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

const widths = [420, 760, 1280, 1500]
const report = []
for (const width of widths) {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)))
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 })
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 700))
  const info = await page.evaluate(() => {
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
      cards,
    }
  })
  info.errors = errors
  await page.screenshot({ path: join(here, `__p_${width}.png`), fullPage: false })
  report.push(info)
  await page.close()
}
await browser.close()
server.close()

for (const r of report) {
  const gapRight = r.docW - Math.min(r.docW, r.rootW + 0)
  console.log(`\n== width ${r.docW} (${r.mode}) rootH=${r.rootH} pageH=${r.docH} cardsBottom=${r.lastBottom} trailing=${r.docH - r.lastBottom}`)
  for (const c of r.cards) console.log(`   ${c.t.padEnd(16)} x=${String(c.x).padStart(4)} y=${String(c.y).padStart(4)} w=${String(c.w).padStart(4)} h=${String(c.h).padStart(4)}`)
  if (r.errors.length) console.log('   ERRORS: ' + r.errors.join(' | '))
}
writeFileSync(join(here, '__report.json'), JSON.stringify(report, null, 2))
