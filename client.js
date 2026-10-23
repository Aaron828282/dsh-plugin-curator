/**
 * dsh-plugin-curator — Client half.
 *
 * A sidebar page and a settings tab over one Host report. Visual language:
 * quiet surfaces, one accent, numbers first. Hover/focus affordances live in a
 * single injected stylesheet so the markup stays declarative.
 */

window.__ModuleLoader__.load({
  id: 'dsh-plugin-curator',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'plugin-curator'
    const API_STATE = '/plugin-curator/api/state'
    const API_ACTION = '/plugin-curator/api/action'
    const API_SETTINGS = '/plugin-curator/api/settings'
    const API_TEST = '/plugin-curator/api/settings/test'
    const API_CHAT = '/plugin-curator/api/chat'
    const PANEL_ID = 'plugin-curator'

    const zh = {
      tab: '插件管家',
      nav: '插件管家',
      title: '插件管家',
      subtitle: '每天根据你的工作内容，推荐值得安装的插件、优化常用插件、提醒清理闲置插件。',
      refresh: '刷新',
      refreshing: '更新中',
      never: '尚未生成',
      updated: '更新于',
      nextRun: '下次',
      working: '处理中',
      statsRecommend: '今日推荐',
      statsInstalled: '已装插件',
      statsIdle: '闲置提醒',
      statsCalls: '近 7 天调用',
      diffTitle: '今日变化',
      diffHint: '与上一次报告相比。',
      diffAdded: '新出现',
      diffDropped: '已消失',
      diffInstalled: '新安装',
      diffRemoved: '已卸载',
      diffEmpty: '没有变化',
      conflictsTitle: '能力重叠',
      conflictsHint: '多个已装插件覆盖同一类能力，可能互相打断或重复占用上下文。',
      conflictShared: '{n} 个插件覆盖「{tag}」',
      gapsTitle: '需求缺口',
      gapsHint: '来自你的提问、工具失败或出厂能力空白的推断。每条都带证据。',
      gapBaseline: '出厂缺口',
      gapBehavior: '行为信号',
      gapModel: 'AI 判断',
      gapSessions: '{n} 个会话 · {hits} 次提及',
      gapEmpty: '暂未发现明确缺口',
      gapNoPlugin: '暂时没有匹配到合适候选，下一次分析会重试。',
      recommendTitle: '今日推荐',
      recommendHint: '五渠道合并、去重、校验可安装性与维护状态后排序。',
      emptyRecommend: '今天没有新的合适插件。',
      installedTitle: '已安装',
      installedHint: '开关即时生效；卸载受保护的包会禁用。',
      idleTitle: '闲置',
      idleHint: '长期没有关联调用。',
      emptyIdle: '暂时没有闲置插件。',
      coverageTitle: '数据源',
      coverageHint: '发现要宽，展示要窄。',
      coverageCandidates: '候选',
      coverageVerified: '已校验',
      coverageRejected: '剔除',
      coverageLowSignal: '低信号',
      coverageNew: '近 7 天更新',
      tabChat: '对话',
      tabRecs: '推荐',
      tabInstalled: '已装',
      tabInsight: '洞察',
      chatTitle: '问一句，找插件',
      chatHint: '用中文描述你要解决的问题，我从已同步的插件库里找并给出理由。',
      chatPlaceholder: '例如：我想要能跨会话记住项目约定的插件',
      chatSend: '发送',
      chatThinking: '思考中',
      chatEmpty: '还没有对话。描述你的需求，或点下面的示例。',
      chatSuggest1: '能跨会话记住结论的插件',
      chatSuggest2: '每天自动跑任务的插件',
      chatSuggest3: '帮我审代码 / 看 diff 的插件',
      modelTitle: '模型分析',
      modelHint: '使用 Harness 已配置的供应商与模型；可选开启。',
      modelEnable: '启用模型分析',
      modelProvider: '供应商',
      modelModel: '模型',
      modelNone: '未选择',
      modelRuns: '每天分析次数',
      modelVision: '支持图片理解',
      modelReasoning: '推理强度',
      modelReasoningOff: '跟随模型默认',
      modelSave: '保存',
      modelTest: '测试连接',
      modelTesting: '测试中',
      modelOk: '上次分析成功，产出 {n} 条需求',
      modelFailed: '上次分析失败：{reason}',
      modelTestOk: '连接正常，耗时 {ms} ms',
      modelTestFail: '连接失败：{reason}',
      modelSaved: '已保存，下一次分析生效。',
      modelCost: '每次只发送压缩摘要，费用按所选模型计费。',
      why: '为什么',
      howInstall: '怎么装',
      howUse: '怎么用',
      copy: '复制',
      copied: '已复制',
      install: '启用',
      installing: '安装中',
      dismiss: '忽略',
      remove: '卸载',
      confirmRemove: '确认卸载',
      snooze: '稍后',
      enable: '启用',
      disable: '停用',
      mDownloads: '次/月',
      mStars: '星标',
      mForks: '派生',
      mRank: '热度超过',
      mUpdated: '更新',
      mNoSignal: '暂无市场数据',
      verified: '已验证',
      tierNew: '新发现',
      classChip: '能力升级',
      aiChip: 'AI 推荐',
      usedTools: '主要工具',
      lastUsed: '最近使用',
      daysAgo: '{n} 天前',
      updateAvailable: '可升级 {v}',
      watching: '待观察',
      active: '在用',
      unused: '未使用',
      official: '官方',
      eventsTitle: '动作记录',
      noEvents: '暂无记录',
      loading: '读取报告中',
      loginRequired: '需要登录后查看',
      actionFailed: '操作失败：{reason}',
      installedLive: '已安装并启用',
      installedRestart: '已写入配置，重启后生效',
      installedFailed: '安装失败：{reason}',
      removedLive: '已卸载',
      toggleOn: '已启用',
      toggleOff: '已停用',
      dismissDone: '已忽略',
      snoozed: '已延后 30 天',
      autoOn: '自动安装已开启（阈值 {score}）',
      autoOff: '自动安装关闭：需要你点「启用」',
    }

    const en = {
      tab: 'Curator',
      nav: 'Curator',
      title: 'Plugin curator',
      subtitle: 'A daily shortlist from what you work on, tuning hints for what you use, and reminders for what you stopped using.',
      refresh: 'Refresh',
      refreshing: 'Refreshing',
      never: 'Not built yet',
      updated: 'Updated',
      nextRun: 'Next',
      working: 'Working',
      statsRecommend: 'Recommendations',
      statsInstalled: 'Installed',
      statsIdle: 'Idle',
      statsCalls: 'Calls, 7d',
      diffTitle: 'What changed',
      diffHint: 'Compared with the previous report.',
      diffAdded: 'New',
      diffDropped: 'Gone',
      diffInstalled: 'Installed',
      diffRemoved: 'Removed',
      diffEmpty: 'No changes',
      conflictsTitle: 'Overlapping capabilities',
      conflictsHint: 'Several installed plugins cover the same capability; they may compete or duplicate context.',
      conflictShared: '{n} plugins cover “{tag}”',
      gapsTitle: 'Open gaps',
      gapsHint: 'Inferred from your prompts, tool failures and capabilities DSH does not ship. Every entry carries evidence.',
      gapBaseline: 'not shipped',
      gapBehavior: 'behaviour',
      gapModel: 'AI',
      gapSessions: '{n} sessions · {hits} mentions',
      gapEmpty: 'No clear gap yet',
      gapNoPlugin: 'No matching candidate yet; the next pass retries.',
      recommendTitle: 'Today',
      recommendHint: 'Five sources, deduped, checked for installability and maintenance, then ranked.',
      emptyRecommend: 'Nothing new today.',
      installedTitle: 'Installed',
      installedHint: 'Toggles apply immediately; protected bundles can only be disabled.',
      idleTitle: 'Idle',
      idleHint: 'No related calls for a long time.',
      emptyIdle: 'Nothing idle.',
      coverageTitle: 'Sources',
      coverageHint: 'Wide discovery, narrow display.',
      coverageCandidates: 'Candidates',
      coverageVerified: 'Verified',
      coverageRejected: 'Rejected',
      coverageLowSignal: 'Low signal',
      coverageNew: 'Updated 7d',
      tabChat: 'Ask',
      tabRecs: 'Picks',
      tabInstalled: 'Installed',
      tabInsight: 'Insight',
      chatTitle: 'Ask for a plugin',
      chatHint: 'Describe the problem in your own words; the curator searches the synced catalog and explains each pick.',
      chatPlaceholder: 'e.g. remember project decisions across sessions',
      chatSend: 'Send',
      chatThinking: 'Thinking',
      chatEmpty: 'No conversation yet. Describe a need, or use a suggestion below.',
      chatSuggest1: 'remember conclusions across sessions',
      chatSuggest2: 'run scheduled tasks every day',
      chatSuggest3: 'review code / read diffs',
      modelTitle: 'Model analysis',
      modelHint: 'Uses the providers and models already configured in Harness. Optional.',
      modelEnable: 'Enable model analysis',
      modelProvider: 'Provider',
      modelModel: 'Model',
      modelNone: 'Not selected',
      modelRuns: 'Runs per day',
      modelVision: 'Understands images',
      modelReasoning: 'Reasoning effort',
      modelReasoningOff: 'Model default',
      modelSave: 'Save',
      modelTest: 'Test connection',
      modelTesting: 'Testing',
      modelOk: 'Last pass succeeded, {n} needs',
      modelFailed: 'Last pass failed: {reason}',
      modelTestOk: 'Connection ok, {ms} ms',
      modelTestFail: 'Connection failed: {reason}',
      modelSaved: 'Saved; applies to the next pass.',
      modelCost: 'Each pass sends a compact digest only; billed at the selected model rate.',
      why: 'why',
      howInstall: 'install',
      howUse: 'use',
      copy: 'Copy',
      copied: 'Copied',
      install: 'Enable',
      installing: 'Installing',
      dismiss: 'Dismiss',
      remove: 'Remove',
      confirmRemove: 'Confirm',
      snooze: 'Snooze',
      enable: 'Enable',
      disable: 'Disable',
      mDownloads: '/mo',
      mStars: 'stars',
      mForks: 'forks',
      mRank: 'beats',
      mUpdated: 'updated',
      mNoSignal: 'no market data yet',
      verified: 'verified',
      tierNew: 'new',
      classChip: 'upgrade',
      aiChip: 'AI pick',
      usedTools: 'top tools',
      lastUsed: 'last used',
      daysAgo: '{n}d ago',
      updateAvailable: 'update {v}',
      watching: 'watching',
      active: 'active',
      unused: 'unused',
      official: 'official',
      eventsTitle: 'Activity',
      noEvents: 'Nothing yet',
      loading: 'Reading the report',
      loginRequired: 'Sign in to view',
      actionFailed: 'Action failed: {reason}',
      installedLive: 'Installed and enabled',
      installedRestart: 'Saved; takes effect after restart',
      installedFailed: 'Install failed: {reason}',
      removedLive: 'Removed',
      toggleOn: 'Enabled',
      toggleOff: 'Disabled',
      dismissDone: 'Dismissed',
      snoozed: 'Snoozed for 30 days',
      autoOn: 'Auto-install on (threshold {score})',
      autoOff: 'Auto-install off: you press Enable',
    }

    const CSS = [
      '.pc-root{--pc-gap:14px;display:flex;flex-direction:column;gap:var(--pc-gap);padding:18px 20px 28px;font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-primary);}',
      '.pc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}',
      '.pc-title{font-size:19px;font-weight:650;letter-spacing:.2px;margin:0 0 2px;}',
      '.pc-sub{color:var(--dsw-alias-label-secondary);font-size:12.5px;margin:0;}',
      '.pc-headmeta{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}',
      '.pc-meta{display:flex;gap:10px;color:var(--dsw-alias-label-tertiary);font-size:11.5px;flex-wrap:wrap;}',
      '.pc-actions{display:flex;gap:8px;align-items:center;}',
      '.pc-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}',
      '.pc-tile{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:12px 14px;background:var(--dsw-alias-bg-layer-2);}',
      '.pc-tile b{display:block;font-size:22px;font-weight:650;line-height:1.15;}',
      '.pc-tile span{color:var(--dsw-alias-label-secondary);font-size:11.5px;}',
      '.pc-card{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-base);overflow:hidden;}',
      '.pc-card-h{display:flex;align-items:baseline;gap:10px;padding:12px 16px 0;}',
      '.pc-card-h h3{font-size:13.5px;font-weight:600;margin:0;}',
      '.pc-card-h .pc-count{color:var(--dsw-alias-label-tertiary);font-size:11.5px;}',
      '.pc-card-h .pc-hint{color:var(--dsw-alias-label-tertiary);font-size:11.5px;margin-left:auto;text-align:right;max-width:52%;}',
      '.pc-card-b{padding:10px 16px 14px;display:flex;flex-direction:column;}',
      '.pc-row{display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--dsw-alias-border-l1);}',
      '.pc-row:first-child{border-top:none;padding-top:4px;}',
      '.pc-avatar{flex:0 0 26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);}',
      '.pc-grow{flex:1 1 auto;min-width:0;}',
      '.pc-name{font-weight:600;font-size:12.8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.pc-desc{color:var(--dsw-alias-label-secondary);margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.pc-line{margin-top:6px;color:var(--dsw-alias-label-secondary);display:flex;gap:6px;align-items:baseline;}',
      '.pc-line b{font-weight:600;color:var(--dsw-alias-label-primary);}',
      '.pc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;}',
      '.pc-chip{font-size:11px;line-height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);white-space:nowrap;}',
      '.pc-chip.warn{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary);}',
      '.pc-chip.ok{border-color:var(--dsw-alias-state-success-primary,#2f9e44);color:var(--dsw-alias-state-success-primary,#2f9e44);}',
      '.pc-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:9px;padding:6px 12px;font-size:12px;cursor:pointer;transition:background .14s ease,border-color .14s ease,transform .06s ease;}',
      '.pc-btn:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.pc-btn:active{transform:translateY(1px);}',
      '.pc-btn[disabled]{opacity:.55;cursor:default;}',
      '.pc-btn.primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff;}',
      '.pc-btn.primary:hover{filter:brightness(1.06);}',
      '.pc-btn.danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-border-l1);}',
      '.pc-btn.danger:hover{background:rgba(220,38,38,.08);}',
      '.pc-btn.ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary);}',
      '.pc-btn.ghost:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.pc-input,.pc-select{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:9px;padding:6px 10px;font-size:12px;transition:border-color .14s ease,box-shadow .14s ease;}',
      '.pc-input:focus,.pc-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(59,130,246,.15);}',
      '.pc-form{display:grid;grid-template-columns:110px 1fr auto;gap:10px 12px;align-items:center;}',
      '.pc-label{color:var(--dsw-alias-label-secondary);}',
      '.pc-switch{position:relative;width:34px;height:19px;border-radius:999px;background:var(--dsw-alias-border-l1);cursor:pointer;transition:background .16s ease;border:none;padding:0;}',
      '.pc-switch[data-on="true"]{background:var(--dsw-alias-brand-primary);}',
      '.pc-switch i{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;transition:transform .16s ease;display:block;}',
      '.pc-switch[data-on="true"] i{transform:translateX(15px);}',
      '.pc-empty{color:var(--dsw-alias-label-tertiary);padding:8px 0;}',
      '.pc-toast{position:sticky;bottom:8px;border-radius:10px;padding:9px 12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);}',
      '.pc-toast.err{border-color:var(--dsw-alias-state-error-primary);}',
      '.pc-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;}',
      '.pc-score{font-size:16px;font-weight:650;text-align:right;min-width:34px;}',
      '.pc-score small{display:block;font-size:10px;font-weight:500;color:var(--dsw-alias-label-tertiary);}',
      '.pc-link{color:var(--dsw-alias-brand-primary);cursor:pointer;background:none;border:none;padding:0;font:inherit;}',
      '@media (max-width:760px){.pc-tiles{grid-template-columns:repeat(2,minmax(0,1fr));}.pc-form{grid-template-columns:1fr;}}',

      '.pc-tabs{display:flex;gap:4px;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-2);width:fit-content;}',
      '.pc-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary);padding:6px 14px;border-radius:8px;font-size:12.5px;cursor:pointer;transition:background .14s ease,color .14s ease;}',
      '.pc-tab:hover{color:var(--dsw-alias-label-primary);}',
      '.pc-tab[data-active="true"]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.08);font-weight:600;}',
      '.pc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}',
      '@media (max-width:900px){.pc-grid{grid-template-columns:1fr;}}',
      '.pc-chat{display:flex;flex-direction:column;gap:10px;min-height:220px;max-height:52vh;overflow-y:auto;padding:4px 2px;}',
      '.pc-msg{display:flex;gap:8px;max-width:88%;}',
      '.pc-msg.user{align-self:flex-end;flex-direction:row-reverse;}',
      '.pc-bubble{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:8px 11px;background:var(--dsw-alias-bg-layer-2);white-space:pre-wrap;}',
      '.pc-msg.user .pc-bubble{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff;}',
      '.pc-composer{display:flex;gap:8px;align-items:flex-end;border-top:1px solid var(--dsw-alias-border-l1);padding-top:10px;margin-top:4px;}',
      '.pc-textarea{flex:1 1 auto;min-height:38px;max-height:120px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);color:inherit;padding:8px 10px;font:inherit;}',
      '.pc-textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(59,130,246,.15);}',
      '.pc-pick{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:8px 10px;margin-top:8px;background:var(--dsw-alias-bg-base);}',
      '.pc-metrics{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;color:var(--dsw-alias-label-tertiary);font-size:11.5px;}',
      '.pc-metric{white-space:nowrap;}',
      '.pc-gap-picks{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;margin:10px 0 4px;}',
      '.pc-gap-picks .pc-card{background:var(--dsw-alias-bg-layer-2);}',
      '.pc-suggest{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}',
      '.pc-suggest button{border:1px dashed var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:3px 10px;font-size:11.5px;cursor:pointer;}',
      '.pc-suggest button:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);}',
    ].join('')

    let stylesInjected = false
    function ensureStyles() {
      if (stylesInjected || typeof document === 'undefined') return
      stylesInjected = true
      const el = document.createElement('style')
      el.dataset.curator = 'client'
      el.textContent = CSS
      document.head.appendChild(el)
    }

    const numberFmt = (value, chinese) => {
      const n = Number(value) || 0
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
      if (n >= 1e4) return chinese ? (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + '万' : (n / 1e3).toFixed(0) + 'k'
      if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
      return String(Math.round(n))
    }
    const pickText = (value, chinese) => {
      if (value == null) return ''
      if (typeof value === 'string') return value
      return (chinese ? value.zh : value.en) || value.en || value.zh || ''
    }
    const fill = (template, params) => String(template).replace(/\{(\w+)\}/g, (m, key) => (key in params ? String(params[key]) : m))
    const clock = (at, chinese) => (at ? new Date(at).toLocaleString(chinese ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

    function Button(props) {
      const cls = 'pc-btn' + (props.variant ? ' ' + props.variant : '')
      return h('button', {
        type: 'button',
        className: cls,
        disabled: props.disabled === true,
        title: props.title,
        onClick: props.onClick,
      }, props.children)
    }

    function Switch(props) {
      return h('button', {
        type: 'button',
        className: 'pc-switch',
        role: 'switch',
        'aria-checked': props.checked === true,
        'data-on': props.checked === true ? 'true' : 'false',
        title: props.title,
        onClick: props.onToggle,
      }, h('i'))
    }

    function Card(props) {
      return h('section', { className: 'pc-card' },
        h('div', { className: 'pc-card-h' },
          h('h3', null, props.title),
          props.count !== undefined ? h('span', { className: 'pc-count' }, props.count) : null,
          props.hint ? h('span', { className: 'pc-hint' }, props.hint) : null,
        ),
        h('div', { className: 'pc-card-b' }, props.children),
      )
    }

    function Chips(props) {
      return h('div', { className: 'pc-chips' }, (props.items ?? []).filter(Boolean).map((item, index) =>
        h('span', { key: index, className: 'pc-chip' + (item.tone ? ' ' + item.tone : '') }, item.label)))
    }

    function CopyCommand(props) {
      const [copied, setCopied] = React.useState(false)
      const copy = () => {
        try {
          navigator.clipboard.writeText(props.command)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch { /* clipboard unavailable */ }
      }
      return h('div', { className: 'pc-line' },
        h('b', null, props.label + ':'),
        h('span', { className: 'pc-mono' }, props.command),
        h('button', { type: 'button', className: 'pc-link', onClick: copy }, copied ? props.copiedLabel : props.copyLabel),
      )
    }

    function RecommendationRow(props) {
      const { item, t, chinese, busy, onInstall, onDismiss, first } = props
      const title = pickText(item.title, chinese) || item.name
      const description = (chinese && item.descriptionZh) ? item.descriptionZh : pickText(item.description, chinese)
      const reasons = (item.reasons ?? []).map((reason) => pickText(reason, chinese)).filter(Boolean).slice(0, 3)
      const installing = busy === 'install:' + item.id
      const chips = reasons.map((label) => ({ label }))
      return h('div', { className: 'pc-row', style: first ? { borderTop: 'none' } : null },
        h('div', { className: 'pc-avatar' }, (title || item.name).slice(0, 1)),
        h('div', { className: 'pc-grow' },
          h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' } },
            h('span', { className: 'pc-name', title: item.name }, title),
            item.verified ? h('span', { className: 'pc-chip ok' }, t('verified')) : null,
            item.modelPick ? h('span', { className: 'pc-chip warn' }, t('aiChip')) : null,
            item.forced ? h('span', { className: 'pc-chip warn' }, t('classChip')) : null,
            item.tier === 'new' ? h('span', { className: 'pc-chip warn' }, t('tierNew')) : null,
            item.downloads > 0 ? h('span', { className: 'pc-chip' }, numberFmt(item.downloads, chinese) + ' ↓') : null,
          ),
          description ? h('div', { className: 'pc-desc' }, description) : null,
          h(Chips, { items: chips }),
          item.install ? h(CopyCommand, { label: t('howInstall'), command: item.install.command, copyLabel: t('copy'), copiedLabel: t('copied') }) : null,
          item.use ? h('div', { className: 'pc-line' }, h('b', null, t('howUse') + ':'), h('span', null, pickText(item.use, chinese))) : null,
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' } },
          h('div', { className: 'pc-score' }, String(item.score), h('small', null, chinese ? '匹配' : 'fit')),
          h('div', { style: { display: 'flex', gap: '6px' } },
            h(Button, { variant: 'primary', disabled: busy !== '', onClick: () => onInstall(item) }, installing ? t('installing') : t('install')),
            h(Button, { variant: 'ghost', disabled: busy !== '', onClick: () => onDismiss(item.id) }, t('dismiss')),
          ),
        ),
      )
    }

    function InstalledRow(props) {
      const { item, t, chinese, busy, confirming, onToggle, onRemove, onConfirm } = props
      const title = pickText(item.titleI18n, chinese) || item.title || item.name
      const statusLabel = item.status === 'active' ? t('active') : item.status === 'watching' ? t('watching') : t('unused')
      const statusTone = item.status === 'active' ? 'ok' : item.status === 'watching' ? '' : 'warn'
      const tools = (item.tools ?? []).slice(0, 3).map((tool) => tool.name + ' ' + tool.calls).join(' · ')
      const toggling = busy === 'toggle:' + item.name
      return h('div', { className: 'pc-row' },
        h('div', { className: 'pc-avatar' }, (title || item.name).slice(0, 1)),
        h('div', { className: 'pc-grow' },
          h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' } },
            h('span', { className: 'pc-name', title: item.name }, title),
            item.version ? h('span', { className: 'pc-chip' }, 'v' + item.version) : null,
            h('span', { className: 'pc-chip ' + statusTone }, statusLabel),
            item.update ? h('span', { className: 'pc-chip warn' }, fill(t('updateAvailable'), { v: item.update.latest })) : null,
          ),
          h('div', { className: 'pc-line' },
            h('span', null, numberFmt(item.calls ?? 0, chinese) + ' ' + (chinese ? '次调用' : 'calls')),
            tools ? h('span', { className: 'pc-mono' }, ' · ' + tools) : null,
            item.lastUsed ? h('span', null, ' · ' + t('lastUsed') + ' ' + item.lastUsed) : null,
          ),
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h(Switch, {
            checked: item.enabled === true,
            title: item.enabled ? t('disable') : t('enable'),
            onToggle: () => { if (!toggling) onToggle(item.name, !item.enabled) },
          }),
          item.removable
            ? h(Button, {
              variant: 'danger',
              disabled: busy !== '',
              onClick: () => (confirming === item.name ? onRemove(item.name) : onConfirm(item.name)),
            }, confirming === item.name ? t('confirmRemove') : t('remove'))
            : null,
        ),
      )
    }

    function IdleRow(props) {
      const { item, t, chinese, busy, onRemove, onSnooze } = props
      return h('div', { className: 'pc-row' },
        h('div', { className: 'pc-avatar' }, (item.title || item.name).slice(0, 1)),
        h('div', { className: 'pc-grow' },
          h('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline' } },
            h('span', { className: 'pc-name' }, item.title || item.name),
            item.version ? h('span', { className: 'pc-chip' }, 'v' + item.version) : null,
          ),
          h('div', { className: 'pc-desc' }, item.reason ? pickText(item.reason, chinese) : fill(t('daysAgo'), { n: item.daysInactive })),
        ),
        h('div', { style: { display: 'flex', gap: '6px' } },
          h(Button, { variant: 'ghost', disabled: busy !== '', onClick: () => onSnooze(item.name) }, t('snooze')),
          h(Button, { variant: 'danger', disabled: busy !== '', onClick: () => onRemove(item.name) }, t('remove')),
        ),
      )
    }

    function SettingsCard(props) {
      const { t, chinese, value, status, testing, onSave, onTest } = props
      const [draft, setDraft] = React.useState(value)
      const [saving, setSaving] = React.useState(false)
      React.useEffect(() => { setDraft(value) }, [value])
      if (!draft || !draft.catalog || draft.catalog.available !== true) return null
      const settings = draft.settings || {}
      const model = settings.model || { provider: '', model: '', supportsVision: false, reasoningEffort: '' }
      const providers = draft.catalog.providers || []
      const current = providers.find((item) => item.id === model.provider)
      const models = (current && current.models) || []
      const update = (patch) => setDraft({ ...draft, settings: { ...settings, ...patch } })
      const save = () => {
        setSaving(true)
        Promise.resolve(onSave({ llmEnabled: settings.llmEnabled === true, model, runsPerDay: settings.runsPerDay }))
          .finally(() => setSaving(false))
      }
      const reasoning = [
        ['', t('modelReasoningOff')],
        ['low', 'low'],
        ['medium', 'medium'],
        ['high', 'high'],
      ]
      return h(Card, { title: t('modelTitle'), hint: t('modelHint') },
        h('div', { className: 'pc-form' },
          h('span', { className: 'pc-label' }, t('modelEnable')),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('input', {
              type: 'checkbox',
              checked: settings.llmEnabled === true,
              onChange: (event) => update({ llmEnabled: event.target.checked }),
            }),
            h('span', { className: 'pc-desc', style: { margin: 0 } }, settings.llmEnabled ? t('enable') : t('disable')),
          ),
          h('span'),

          h('span', { className: 'pc-label' }, t('modelProvider')),
          h('select', {
            className: 'pc-select',
            value: model.provider,
            onChange: (event) => update({ model: { ...model, provider: event.target.value, model: '' } }),
          },
            h('option', { value: '' }, t('modelNone')),
            ...providers.map((item) => h('option', { key: item.id, value: item.id }, item.name || item.id)),
          ),
          h('span'),

          h('span', { className: 'pc-label' }, t('modelModel')),
          h('select', {
            className: 'pc-select',
            value: model.model,
            onChange: (event) => {
              const picked = models.find((item) => item.id === event.target.value)
              update({ model: { ...model, model: event.target.value, supportsVision: picked && picked.image === true } })
            },
          },
            h('option', { value: '' }, t('modelNone')),
            ...models.map((item) => h('option', { key: item.id, value: item.id }, (item.name || item.id) + (item.image === true ? ' · 图片' : ''))),
          ),
          h('span'),

          h('span', { className: 'pc-label' }, t('modelReasoning')),
          h('select', {
            className: 'pc-select',
            value: model.reasoningEffort || '',
            onChange: (event) => update({ model: { ...model, reasoningEffort: event.target.value } }),
          }, reasoning.map(([value_, label]) => h('option', { key: value_ || 'default', value: value_ }, label))),
          h('span'),

          h('span', { className: 'pc-label' }, t('modelVision')),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('input', {
              type: 'checkbox',
              checked: model.supportsVision === true,
              onChange: (event) => update({ model: { ...model, supportsVision: event.target.checked } }),
            }),
            h('span', { className: 'pc-desc', style: { margin: 0 } }, 'image → text'),
          ),
          h('span'),

          h('span', { className: 'pc-label' }, t('modelRuns')),
          h('input', {
            className: 'pc-input',
            type: 'number',
            min: 1,
            max: 24,
            value: settings.runsPerDay ?? 3,
            onChange: (event) => update({ runsPerDay: Number(event.target.value) || 3 }),
          }),
          h('span', { style: { display: 'flex', gap: '8px' } },
            h(Button, { variant: 'ghost', disabled: testing === true, onClick: () => onTest(model) }, testing ? t('modelTesting') : t('modelTest')),
            h(Button, { variant: 'primary', disabled: saving, onClick: save }, saving ? t('working') : t('modelSave')),
          ),
        ),
        status && status.ok === false
          ? h('div', { className: 'pc-line', style: { color: 'var(--dsw-alias-state-error-primary)' } }, fill(t('modelFailed'), { reason: status.reason || 'unknown' }))
          : status && status.ok === true
            ? h('div', { className: 'pc-line' }, fill(t('modelOk'), { n: status.needs ?? 0 }))
            : null,
        h('div', { className: 'pc-desc', style: { marginTop: '8px' } }, t('modelCost')),
      )
    }

    /** Market signals, labelled honestly: npm publishes downloads, not installs. */
    function metricsFor(item, t, chinese) {
      const adoption = item.adoption ?? {
        downloads: item.downloads,
        stars: item.stars,
        percentile: 0,
        updated: item.added,
      }
      const out = []
      if (adoption.downloads > 0) out.push('↓ ' + numberFmt(adoption.downloads, chinese) + ' ' + t('mDownloads'))
      if (adoption.stars > 0) out.push('★ ' + numberFmt(adoption.stars, chinese) + ' ' + t('mStars'))
      if (adoption.forks > 0) out.push('⑂ ' + numberFmt(adoption.forks, chinese) + ' ' + t('mForks'))
      if (adoption.percentile > 0) out.push(t('mRank') + ' ' + adoption.percentile + '%')
      if (adoption.updated) out.push(t('mUpdated') + ' ' + String(adoption.updated).slice(5))
      if (out.length === 0) out.push(t('mNoSignal'))
      return out
    }

    function RecommendationCard(props) {
      const { item, t, chinese, busy, onInstall, onDismiss } = props
      const title = pickText(item.title, chinese) || item.name
      const description = (chinese && item.descriptionZh) ? item.descriptionZh : pickText(item.description, chinese)
      const reasons = (item.reasons ?? []).map((reason) => pickText(reason, chinese)).filter(Boolean).slice(0, 3)
      const installing = busy === 'install:' + item.id
      return h('div', { className: 'pc-card', style: { display: 'flex', flexDirection: 'column' } },
        h('div', { style: { padding: '13px 15px 10px', display: 'flex', gap: '10px', alignItems: 'flex-start' } },
          h('div', { className: 'pc-avatar' }, (title || item.name).slice(0, 1)),
          h('div', { className: 'pc-grow' },
            h('div', { style: { display: 'flex', gap: '6px', alignItems: 'baseline', flexWrap: 'wrap' } },
              h('span', { className: 'pc-name' }, title),
              item.verified ? h('span', { className: 'pc-chip ok' }, t('verified')) : null,
              item.modelPick ? h('span', { className: 'pc-chip warn' }, t('aiChip')) : null,
              item.forced ? h('span', { className: 'pc-chip warn' }, t('classChip')) : null,
            ),
            description ? h('div', { className: 'pc-desc', style: { marginTop: '4px' } }, description) : null,
            h('div', { className: 'pc-metrics' }, metricsFor(item, t, chinese).map((metric, index) =>
              h('span', { key: index, className: 'pc-metric' }, metric))),
          ),
          h('div', { className: 'pc-score' }, String(item.score), h('small', null, chinese ? '匹配' : 'fit')),
        ),
        h('div', { style: { padding: '0 15px 12px' } },
          h(Chips, { items: reasons.map((label) => ({ label })) }),
          item.install ? h(CopyCommand, { label: t('howInstall'), command: item.install.command, copyLabel: t('copy'), copiedLabel: t('copied') }) : null,
          item.use ? h('div', { className: 'pc-line' }, h('b', null, t('howUse') + ':'), h('span', null, pickText(item.use, chinese))) : null,
        ),
        h('div', { style: { marginTop: 'auto', padding: '10px 15px 13px', display: 'flex', gap: '8px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
          h(Button, { variant: 'primary', disabled: busy !== '', onClick: () => onInstall(item) }, installing ? t('installing') : t('install')),
          h(Button, { variant: 'ghost', disabled: busy !== '', onClick: () => onDismiss(item.id) }, t('dismiss')),
        ),
      )
    }

    function CuratorTab(props) {
      const t = props.t
      const locale = props.locale
      const localeId = React.useSyncExternalStore(
        (callback) => locale.subscribe(callback),
        () => locale.getSnapshot().active,
      )
      const chinese = String(localeId).startsWith('zh')

      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState('')
      const [busy, setBusy] = React.useState('')
      const [toast, setToast] = React.useState(null)
      const [confirming, setConfirming] = React.useState('')
      const [settingsValue, setSettingsValue] = React.useState(null)
      const [testing, setTesting] = React.useState(false)
      const [tab, setTab] = React.useState('recs')
      const [messages, setMessages] = React.useState([])
      const [draft, setDraft] = React.useState('')
      const [sending, setSending] = React.useState(false)
      const [busyFor, setBusyFor] = React.useState(0)


      const load = React.useCallback(async () => {
        try {
          const response = await fetch(API_STATE, { cache: 'no-store', credentials: 'same-origin' })
          const body = await response.json().catch(() => null)
          if (response.status === 401) { setError(t('loginRequired')); return }
          if (!response.ok || body === null || body.ok !== true) {
            setError((body && body.error) || 'HTTP ' + response.status)
            return
          }
          setData(body.value)
          setError('')
        } catch (cause) {
          setError(String(cause && cause.message ? cause.message : cause))
        }
      }, [t])

      React.useEffect(() => {
        ensureStyles()
        void load()
        const timer = setInterval(() => { void load() }, 45_000)
        return () => clearInterval(timer)
      }, [load])

      React.useEffect(() => {
        let alive = true
        fetch(API_SETTINGS, { cache: 'no-store', credentials: 'same-origin' })
          .then((response) => response.json())
          .then((body) => { if (alive && body && body.ok) setSettingsValue(body.value) })
          .catch(() => {})
        return () => { alive = false }
      }, [])

      const running = data !== null && data.busy === true
      React.useEffect(() => {
        if (!running) { setBusyFor(0); return undefined }
        const started = Date.now()
        const timer = setInterval(() => setBusyFor(Math.floor((Date.now() - started) / 1000)), 1000)
        return () => clearInterval(timer)
      }, [running])

      React.useEffect(() => {
        if (confirming === '') return undefined
        const timer = setTimeout(() => setConfirming(''), 4000)
        return () => clearTimeout(timer)
      }, [confirming])

      const act = React.useCallback(async (action, payload, label) => {
        const key = payload && payload.id ? action + ':' + payload.id : payload && payload.name ? action + ':' + payload.name : action
        setBusy(key)
        setToast(null)
        try {
          const response = await fetch(API_ACTION, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || body === null || body.ok !== true) throw new Error((body && body.error) || 'HTTP ' + response.status)
          setToast({ kind: 'ok', text: label || action })
          await load()
        } catch (cause) {
          setToast({ kind: 'err', text: fill(t('actionFailed'), { reason: String(cause && cause.message ? cause.message : cause) }) })
        } finally {
          setBusy('')
        }
      }, [load, t])

      const saveSettings = React.useCallback(async (next) => {
        const response = await fetch(API_SETTINGS, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(next),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok || body === null || body.ok !== true) throw new Error((body && body.error) || 'HTTP ' + response.status)
        setSettingsValue((current) => (current ? { ...current, settings: body.value.settings } : current))
        setToast({ kind: 'ok', text: t('modelSaved') })
      }, [t])

      const testModel = React.useCallback(async (model) => {
        setTesting(true)
        setToast(null)
        try {
          const response = await fetch(API_TEST, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ model }),
          })
          const body = await response.json().catch(() => null)
          const value = body && body.value
          setToast(value && value.ok
            ? { kind: 'ok', text: fill(t('modelTestOk'), { ms: value.ms }) }
            : { kind: 'err', text: fill(t('modelTestFail'), { reason: (value && value.reason) || 'unknown' }) })
        } catch (cause) {
          setToast({ kind: 'err', text: fill(t('modelTestFail'), { reason: String(cause && cause.message ? cause.message : cause) }) })
        } finally {
          setTesting(false)
        }
      }, [t])

      const sendChat = React.useCallback(async (text) => {
        const query = String(text ?? '').trim()
        if (query === '' || sending) return
        setMessages((current) => [...current, { role: 'user', text: query }])
        setDraft('')
        setSending(true)
        try {
          const response = await fetch(API_CHAT, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: query }),
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || body === null || body.ok !== true) throw new Error((body && body.error) || 'HTTP ' + response.status)
          setMessages((current) => [...current, { role: 'assistant', text: body.value.reply, picks: body.value.picks || [], model: body.value.model }])
        } catch (cause) {
          setMessages((current) => [...current, { role: 'assistant', text: fill(t('actionFailed'), { reason: String(cause && cause.message ? cause.message : cause) }), picks: [] }])
        } finally {
          setSending(false)
        }
      }, [sending, t])

      /** Install straight from a card: the server validates the spec, so no id lookup is needed. */
      const installCard = React.useCallback(async (item) => {
        setBusy('install:' + item.id)
        setToast(null)
        try {
          const response = await fetch(API_ACTION, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'installSpec', spec: item.spec }),
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || body === null || body.ok !== true) throw new Error((body && body.error) || 'HTTP ' + response.status)
          const application = body.result && body.result.application
          const errorCode = body.result && body.result.error && body.result.error.code
          if (errorCode) {
            setToast({ kind: 'err', text: fill(t('installedFailed'), { reason: errorCode }) })
          } else if (application === 'restart-required') {
            setToast({ kind: 'ok', text: t('installedRestart') })
          } else {
            setToast({ kind: 'ok', text: t('installedLive') })
          }
          await load()
        } catch (cause) {
          setToast({ kind: 'err', text: fill(t('actionFailed'), { reason: String(cause && cause.message ? cause.message : cause) }) })
        } finally {
          setBusy('')
        }
      }, [load, t])

      const installSpec = React.useCallback(async (pick) => {
        setBusy('installSpec:' + pick.spec)
        try {
          const response = await fetch(API_ACTION, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'installSpec', spec: pick.spec }),
          })
          const body = await response.json().catch(() => null)
          if (!response.ok || body === null || body.ok !== true) throw new Error((body && body.error) || 'HTTP ' + response.status)
          setToast({ kind: 'ok', text: t('installedLive') + ' · ' + pick.name })
          await load()
        } catch (cause) {
          setToast({ kind: 'err', text: fill(t('actionFailed'), { reason: String(cause && cause.message ? cause.message : cause) }) })
        } finally {
          setBusy('')
        }
      }, [load, t])

      if (error !== '' && data === null) {
        return h('div', { className: 'pc-root' }, h('div', { className: 'pc-empty' }, error),
          h(Button, { onClick: () => { setError(''); void load() } }, t('refresh')))
      }
      if (data === null) {
        return h('div', { className: 'pc-root' }, h('div', { className: 'pc-empty' }, t('loading')))
      }

      const pkgOf = (value) => {
        const text = String(value ?? '').toLowerCase()
        const scoped = /^(@[^/]+\/[^@]+)/.exec(text)
        if (scoped !== null) return scoped[1]
        const plain = /^([a-z0-9._-]+)/.exec(text)
        return plain === null ? text : plain[1]
      }
      const installed = data.installed || []
      const installedKeys = new Set(installed.map((item) => pkgOf(item.name)))
      const isInstalled = (item) =>
        item.installed === true ||
        installedKeys.has(pkgOf(item.spec)) ||
        installedKeys.has(pkgOf(item.name)) ||
        installedKeys.has(pkgOf(item.npm))

      const recommendations = (data.recommendations || []).filter((item) => !isInstalled(item))
      const idle = data.idle || []
      const gaps = (data.gaps || []).map((gap) => ({
        ...gap,
        suggestions: (gap.suggestions || []).filter((item) => !isInstalled(item)),
      }))
      const diff = data.diff
      const conflicts = data.conflicts || []
      const coverage = data.coverage || {}
      const totals = data.totals || {}
      const settings = data.settings || {}
      const sources = (coverage.sources || data.sourceStatus || [])

      const header = h('div', { className: 'pc-head' },
        h('div', null,
          h('h2', { className: 'pc-title' }, t('title')),
          h('p', { className: 'pc-sub' }, t('subtitle')),
        ),
        h('div', { className: 'pc-headmeta' },
          h('div', { className: 'pc-meta' },
            h('span', null, data.generatedAt ? t('updated') + ' ' + clock(data.generatedAt, chinese) : t('never')),
            data.nextRunAt ? h('span', null, t('nextRun') + ' ' + clock(data.nextRunAt, chinese)) : null,
            running ? h('span', { style: { color: 'var(--dsw-alias-brand-primary)' } }, t('refreshing') + ' ' + busyFor + 's') : null,
          ),
          h('div', { className: 'pc-actions' },
            h(Button, { variant: 'primary', disabled: busy !== '', onClick: () => act('refresh', {}, t('refresh')) },
              busy === 'refresh' ? t('refreshing') + '…' : t('refresh')),
          ),
        ),
      )

      const tiles = h('div', { className: 'pc-tiles' },
        h('div', { className: 'pc-tile' }, h('b', null, String(totals.recommendations ?? recommendations.length)), h('span', null, t('statsRecommend'))),
        h('div', { className: 'pc-tile' }, h('b', null, String(totals.installed ?? installed.length)), h('span', null, t('statsInstalled'))),
        h('div', { className: 'pc-tile' }, h('b', null, String(totals.idle ?? idle.length)), h('span', null, t('statsIdle'))),
        h('div', { className: 'pc-tile' }, h('b', null, numberFmt(totals.calls7 ?? 0, chinese)), h('span', null, t('statsCalls'))),
      )

      const tabs = h('div', { className: 'pc-tabs' },
        [['recs', t('tabRecs') + ' ' + recommendations.length], ['installed', t('tabInstalled') + ' ' + installed.length], ['insight', t('tabInsight')]]
          .map(([key, label]) => h('button', {
            key,
            type: 'button',
            className: 'pc-tab',
            'data-active': tab === key ? 'true' : 'false',
            onClick: () => setTab(key),
          }, label)))

      const chatView = h(Card, { title: t('chatTitle'), hint: t('chatHint') },
        h('div', { className: 'pc-chat' },
          messages.length === 0
            ? h('div', { className: 'pc-empty' }, t('chatEmpty'))
            : messages.map((message, index) => h('div', { key: index, className: 'pc-msg ' + message.role },
              h('div', { className: 'pc-bubble' },
                h('div', null, message.text),
                (message.picks || []).map((pick, pickIndex) => h('div', { key: pickIndex, className: 'pc-pick' },
                  h('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline' } },
                    h('span', { className: 'pc-name' }, pick.name),
                    h('span', { className: 'pc-mono', style: { color: 'var(--dsw-alias-label-tertiary)' } }, pick.spec),
                  ),
                  pick.why ? h('div', { className: 'pc-desc' }, pick.why) : null,
                  h('div', { style: { marginTop: '6px' } },
                    h(Button, {
                      variant: 'primary',
                      disabled: busy !== '',
                      onClick: () => installSpec(pick),
                    }, t('install')),
                  ),
                )),
              ))),
        ),
        h('div', { className: 'pc-suggest' },
          [t('chatSuggest1'), t('chatSuggest2'), t('chatSuggest3')].map((text, index) =>
            h('button', { key: index, type: 'button', onClick: () => { setDraft(text) } }, text))),
        h('div', { className: 'pc-composer' },
          h('textarea', {
            className: 'pc-textarea',
            placeholder: t('chatPlaceholder'),
            value: draft,
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendChat(draft)
              }
            },
          }),
          h(Button, { variant: 'primary', disabled: sending || draft.trim() === '', onClick: () => sendChat(draft) },
            sending ? t('chatThinking') : t('chatSend')),
        ),
      )

      const recsView = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        chatView,
        h('div', { className: 'pc-grid' },
          recommendations.length === 0
            ? h('div', { className: 'pc-empty' }, t('emptyRecommend'))
            : recommendations.map((item) => h(RecommendationCard, {
              key: item.id,
              item,
              t,
              chinese,
              busy,
              onInstall: installCard,
              onDismiss: (id) => act('dismiss', { id }, t('dismissDone')),
            }))))

      const installedView = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        h(Card, { title: t('installedTitle'), count: installed.length, hint: t('installedHint') },
          installed.length === 0 ? h('div', { className: 'pc-empty' }, '—') : installed.map((item, index) => h(InstalledRow, {
            key: item.name, item, t, chinese, busy, confirming, first: index === 0,
            onToggle: (name, enabled) => act('toggle', { name, enabled }, enabled ? t('toggleOn') : t('toggleOff')),
            onRemove: (name) => act('remove', { name }, t('removedLive')),
            onConfirm: (name) => setConfirming(name),
          }))),
        h(Card, { title: t('idleTitle'), count: idle.length, hint: t('idleHint') },
          idle.length === 0 ? h('div', { className: 'pc-empty' }, t('emptyIdle')) : idle.map((item, index) => h(IdleRow, {
            key: item.name, item, t, chinese, busy, first: index === 0,
            onSnooze: (name) => act('snooze', { name }, t('snoozed')),
            onRemove: (name) => act('remove', { name }, t('removedLive')),
          }))),
      )

      const diffItems = []
      if (diff) {
        if (diff.added.length > 0) diffItems.push({ label: t('diffAdded') + ' ' + diff.added.length, tone: 'ok' })
        if (diff.dropped.length > 0) diffItems.push({ label: t('diffDropped') + ' ' + diff.dropped.length })
        if (diff.installed.length > 0) diffItems.push({ label: t('diffInstalled') + ' ' + diff.installed.length, tone: 'ok' })
        if (diff.removed.length > 0) diffItems.push({ label: t('diffRemoved') + ' ' + diff.removed.length, tone: 'warn' })
      }

      const insightView = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        h(Card, { title: t('diffTitle'), hint: t('diffHint') },
          h(Chips, { items: diffItems.length > 0 ? diffItems : [{ label: t('diffEmpty') }] })),
        conflicts.length === 0 ? null : h(Card, { title: t('conflictsTitle'), count: conflicts.length, hint: t('conflictsHint') },
          conflicts.map((conflict, index) => h('div', { key: conflict.tag, className: 'pc-row', style: index === 0 ? { borderTop: 'none' } : null },
            h('div', { className: 'pc-avatar' }, '∩'),
            h('div', { className: 'pc-grow' },
              h('div', { className: 'pc-name' }, conflict.tag),
              h('div', { className: 'pc-desc' }, conflict.names.join(' · '))))))
        ,
        h(Card, { title: t('gapsTitle'), count: gaps.length, hint: t('gapsHint') },
          gaps.length === 0 ? h('div', { className: 'pc-empty' }, t('gapEmpty')) : gaps.map((gap, index) => h('div', { key: gap.tag, className: 'pc-row', style: index === 0 ? { borderTop: 'none' } : null },
            h('div', { className: 'pc-avatar' }, pickText(gap.label, chinese).slice(0, 1)),
            h('div', { className: 'pc-grow' },
              h('div', { style: { display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' } },
                h('span', { className: 'pc-name' }, pickText(gap.label, chinese)),
                h('span', { className: 'pc-chip' + (gap.source === 'baseline' ? ' warn' : '') },
                  gap.source === 'baseline' ? t('gapBaseline') : gap.source === 'behavior' ? t('gapBehavior') : gap.source === 'model' ? t('gapModel') : fill(t('gapSessions'), { n: gap.sessions, hits: gap.hits })),
              ),
              gap.evidence && gap.evidence[0] ? h('div', { className: 'pc-desc' }, '“' + gap.evidence[0] + '”') : null,
              (gap.suggestions ?? []).length > 0
                ? h('div', { className: 'pc-gap-picks' },
                  (gap.suggestions ?? []).map((suggestion) => h(RecommendationCard, {
                    key: suggestion.id,
                    item: suggestion,
                    t,
                    chinese,
                    busy,
                    onInstall: installCard,
                    onDismiss: (id) => act('dismiss', { id }, t('dismissDone')),
                  })))
                : h('div', { className: 'pc-desc' }, t('gapNoPlugin')),
            ))),
        ),
        h(SettingsCard, { t, chinese, value: settingsValue, status: data.modelStatus, testing, onSave: saveSettings, onTest: testModel }),
        h(Card, { title: t('coverageTitle'), hint: t('coverageHint') },
          h('div', { className: 'pc-meta', style: { marginBottom: '6px' } },
            h('span', null, t('coverageCandidates') + ' ' + numberFmt(coverage.candidates ?? 0, chinese)),
            h('span', null, t('coverageVerified') + ' ' + numberFmt(coverage.verified ?? 0, chinese)),
            h('span', null, t('coverageRejected') + ' ' + numberFmt(coverage.rejected ?? 0, chinese)),
            h('span', null, t('coverageLowSignal') + ' ' + numberFmt(coverage.lowSignal ?? 0, chinese)),
            h('span', null, t('coverageNew') + ' ' + numberFmt(coverage.newThisWeek ?? 0, chinese))),
          sources.map((source, index) => h('div', { key: index, className: 'pc-row', style: { padding: '6px 0' } },
            h('span', { style: { width: '7px', height: '7px', borderRadius: '50%', marginTop: '6px', background: source.status === 'ok' ? 'var(--dsw-alias-state-success-primary,#2f9e44)' : 'var(--dsw-alias-state-error-primary)' } }),
            h('span', { className: 'pc-mono', style: { color: 'var(--dsw-alias-label-secondary)' } }, source.kind),
            h('span', { className: 'pc-grow', title: source.id, style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, source.id),
            h('span', { className: 'pc-mono', style: { color: 'var(--dsw-alias-label-secondary)' } },
              source.status === 'ok' ? numberFmt(source.fetched ?? 0, chinese) + (source.total ? ' / ' + numberFmt(source.total, chinese) : '') : (source.error || 'error'))))),
      )

      const toastCard = toast === null ? null : h('div', { className: 'pc-toast' + (toast.kind === 'err' ? ' err' : '') }, toast.text)

      return h('div', { className: 'pc-root' },
        header,
        tiles,
        tabs,
        tab === 'recs' ? recsView : tab === 'installed' ? installedView : insightView,
        toastCard,
      )
    }

    function CuratorIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' },
        h('rect', { x: 2.5, y: 2.5, width: 11, height: 11, rx: 3 }),
        h('path', { d: 'M8 5.4v5.2M5.4 8h5.2' }))
    }

    function CuratorPanel(props) {
      return h('div', { style: { height: '100%', overflowY: 'auto' } }, h(CuratorTab, props))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        try {
          ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'plugin-curator: dictionaries')
        } catch {
          /* duplicate namespace on HMR must not blank the page */
        }
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
          name: 'settings.plugins.tab',
          id: PANEL_ID,
          order: 55,
          label: () => t('tab'),
          locale: NS,
          inject: () => ({ t, locale: ctx.locale }),
        }, CuratorTab))
        try {
          ctx.slots.inject('sidebar.panellist', () => {
            const offRow = ctx.slots.register({
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 2,
              label: () => t('nav'),
              locale: NS,
            }, CuratorIcon)
            const offPanel = ctx.slots.register({
              name: 'main',
              key: PANEL_ID,
              locale: NS,
              inject: () => ({ t, locale: ctx.locale }),
            }, CuratorPanel)
            return () => {
              if (typeof offRow === 'function') offRow()
              if (typeof offPanel === 'function') offPanel()
            }
          })
        } catch (error) {
          console.warn('[plugin-curator] sidebar registration skipped', error)
        }
      },
    }
  },
})
