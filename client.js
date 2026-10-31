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
    const API_EXPLAIN = '/plugin-curator/api/explain'
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
      overlapCount: '{n} 个插件覆盖同类能力',
      overlapPrimary: '主力',
      overlapCalls: '调用 {n} 次',
      overlapTools: '{n} 个工具',
      overlapLastUsed: '最近使用',
      overlapIdle: '闲置 {n} 天',
      overlapAfterInstall: '与 {n} 组已装插件功能重叠',
      overlapEvidenceTool: '共同工具：{list}',
      overlapEvidenceName: '名称同属该领域',
      overlapGroup_memory: '记忆',
      overlapGroup_session: '会话',
      overlapGroup_automation: '自动化',
      overlapGroup_documents: '文档处理',
      overlapGroup_ui: '界面外观',
      overlapGroup_research: '检索联网',
      overlapGroup_tooling: '底层工具',
      disabledTag: '已停用',
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
      installedSearch: '搜索已装插件或工具…',
      installedSortActive: '按调用量',
      installedSortName: '按名称',
      installedFilterAll: '全部',
      installedFilterActive: '在用',
      installedFilterIdle: '闲置',
      installedNone: '没有匹配的插件',
      installedCalls: '次调用',
      emptyRecommendHint: '点上面的「换一批」重新扫描社区，或稍等今天的自动巡检。',
      chatEmptyHint: '比如问：「我最近在忙什么，有哪个插件能省事？」',
      emptyInstalled: '还没有装任何插件',
      emptyInstalledHint: '推荐会带上安装命令，装完回来这里能看到调用情况。',
      installedNoneHint: '换个关键词，或把筛选调回「全部」。',
      emptyIdleHint: '插件装了但一直没被调用时，会出现在这里。',
      gapEmptyHint: '当前的能力缺口都已被填上。',
      tabsLabel: '插件管家分区',
      statsLabel: '今日概览',
      explainTitle: '为什么没推荐某个插件',
      explainHint: '输入插件名，插件管家会按它自己的门槛逐条告诉你它被卡在哪一步。',
      explainSearch: '输入插件名，例如 dsh-session-toolbox',
      explainBtn: '查一下',
      explainNotFound: '候选池里没有这个名字',
      explainAdmitted: '已在今日推荐里',
      explainRank: '排第',
      explainScore: '得分',
      explainTier: '档位',
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
      modelEyebrow: '模型分析 · AI',
      modelCurrent: '当前模型',
      modelUnset: '还没有选择模型，AI 分析不会运行',
      modelMissing: '这个供应商已经不存在了，请重新选择',
      modelPick: '选择模型',
      modelSearch: '搜索模型…',
      modelEmpty: '没有可用的模型',
      modelNoResult: '没有匹配的模型',
      modelBack: '返回',
      modelReasoningShort: '推理',
      modelReasonFollow: '跟随默认',
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
      rotate: '换一批',
      rotating: '换一批中',
      rotated: '已换一批',
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
      overlapCount: '{n} plugins overlap',
      overlapPrimary: 'primary',
      overlapCalls: '{n} calls',
      overlapTools: '{n} tools',
      overlapLastUsed: 'last used',
      overlapIdle: 'idle {n}d',
      overlapAfterInstall: 'overlaps {n} installed groups',
      overlapEvidenceTool: 'shared tools: {list}',
      overlapEvidenceName: 'same domain by name',
      overlapGroup_memory: 'Memory',
      overlapGroup_session: 'Sessions',
      overlapGroup_automation: 'Automation',
      overlapGroup_documents: 'Documents',
      overlapGroup_ui: 'Appearance',
      overlapGroup_research: 'Retrieval',
      overlapGroup_tooling: 'Tooling',
      disabledTag: 'disabled',
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
      installedSearch: 'Search bundles or tools…',
      installedSortActive: 'By calls',
      installedSortName: 'By name',
      installedFilterAll: 'All',
      installedFilterActive: 'Active',
      installedFilterIdle: 'Idle',
      installedNone: 'No matching bundles',
      installedCalls: 'calls',
      emptyRecommendHint: 'Use Refresh above to rescan the community, or wait for the next scheduled sweep.',
      chatEmptyHint: 'Try: which bundle would save me time on what I was doing this week?',
      emptyInstalled: 'No bundles installed yet',
      emptyInstalledHint: 'Every pick ships with an install command; call counts show up here once used.',
      installedNoneHint: 'Try another keyword, or set the filter back to all.',
      emptyIdleHint: 'Bundles that are installed but never called land here.',
      gapEmptyHint: 'Every capability gap this sweep found is already covered.',
      tabsLabel: 'Plugin curator sections',
      statsLabel: 'Today at a glance',
      explainTitle: 'Why was a bundle not recommended?',
      explainHint: 'Type a bundle name; the curator replays its own gates and names the step that dropped it.',
      explainSearch: 'Bundle name, e.g. dsh-session-toolbox',
      explainBtn: 'Explain',
      explainNotFound: 'No candidate by that name',
      explainAdmitted: "Already in today's picks",
      explainRank: 'rank',
      explainScore: 'score',
      explainTier: 'tier',
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
      modelEyebrow: 'Model analysis · AI',
      modelCurrent: 'Current model',
      modelUnset: 'No model selected yet; AI analysis will not run',
      modelMissing: 'That provider no longer exists, pick a model again',
      modelPick: 'Pick a model',
      modelSearch: 'Search models…',
      modelEmpty: 'No models available',
      modelNoResult: 'No matching model',
      modelBack: 'Back',
      modelReasoningShort: 'reasoning',
      modelReasonFollow: 'follow default',
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
      rotate: 'Shuffle',
      rotating: 'Shuffling',
      rotated: 'New batch loaded',
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
      '.pc-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px;}',
      '.pc-search{flex:1 1 180px;min-width:0;appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:9px;padding:7px 11px;font-size:12px;font-family:inherit;}',
      '.pc-search::placeholder{color:var(--dsw-alias-label-tertiary);}',
      '.pc-search:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.pc-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;overflow:hidden;}',
      '.pc-seg button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;font-family:inherit;padding:6px 10px;cursor:pointer;}',
      '.pc-seg button[data-on="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.pc-seg button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}',
      '.pc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;}',
      '.pc-chip{font-size:11px;line-height:18px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);white-space:nowrap;}',
      '.pc-chip.warn{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary);}',
      '.pc-chip.ok{border-color:var(--dsw-alias-state-success-primary,#2f9e44);color:var(--dsw-alias-state-success-primary,#2f9e44);}',
      '.pc-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:9px;padding:6px 12px;font-size:12px;cursor:pointer;transition:background .14s ease,border-color .14s ease,transform .06s ease;}',
      '.pc-btn:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.pc-btn:active{transform:translateY(1px);}',
      '.pc-btn[disabled]{opacity:.55;cursor:default;}',
      '.pc-btn.primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-on-primary,#fff);}',
      '.pc-btn.primary:hover{filter:brightness(1.06);}',
      '.pc-btn.danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-border-l1);}',
      '.pc-btn.danger:hover{background:rgba(220,38,38,.08);}',
      '.pc-btn.ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary);}',
      '.pc-btn.ghost:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.pc-input,.pc-select{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:9px;padding:6px 10px;font-size:12px;transition:border-color .14s ease,box-shadow .14s ease;}',
      '.pc-input:focus,.pc-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(59,130,246,.15);}',
      '.pc-form{display:grid;grid-template-columns:110px 1fr auto;gap:10px 12px;align-items:center;}',
      '.pc-label{color:var(--dsw-alias-label-secondary);}',
      '.pc-model{position:relative;display:flex;flex-direction:column;gap:10px;}',
      '.pc-model-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.pc-model-name{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);}',
      '.pc-model-sub{font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      '.pc-pop{position:absolute;z-index:40;left:0;right:0;top:100%;margin-top:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-base);box-shadow:0 12px 32px rgba(0,0,0,.16);overflow:hidden;}',
      '.pc-pop-search{padding:8px;border-bottom:1px solid var(--dsw-alias-border-l1);}',
      '.pc-pop-search input{width:100%;box-sizing:border-box;}',
      '.pc-pop-list{max-height:260px;overflow-y:auto;padding:4px;margin:0;}',
      '.pc-pop-group{position:sticky;top:0;z-index:1;padding:6px 8px 4px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-base);}',
      '.pc-pop-item{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:7px 8px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;text-align:left;cursor:pointer;}',
      '.pc-pop-item[data-active="true"]{background:var(--dsw-alias-bg-l2,rgba(127,127,127,.12));}',
      '.pc-pop-item .pc-grow{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.pc-pop-item .pc-tick{color:var(--dsw-alias-brand-primary);font-weight:700;}',
      '.pc-pop-note{padding:14px 10px;font-size:12px;color:var(--dsw-alias-label-tertiary);text-align:center;}',
      '.pc-switch{position:relative;width:34px;height:19px;border-radius:999px;background:var(--dsw-alias-border-l1);cursor:pointer;transition:background .16s ease;border:none;padding:0;}',
      '.pc-switch[data-on="true"]{background:var(--dsw-alias-brand-primary);}',
      '.pc-switch i{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:var(--dsw-alias-bg-layer-1,#fff);transition:transform .16s ease;display:block;}',
      '.pc-switch[data-on="true"] i{transform:translateX(15px);}',
      '.pc-empty{color:var(--dsw-alias-label-tertiary);padding:8px 0;}',
      '.pc-empty-box{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:16px;border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;color:var(--dsw-alias-label-secondary);}',
      '.pc-empty-box b{font-size:13px;color:var(--dsw-alias-label-primary);}',
      '.pc-empty-box span{font-size:12px;color:var(--dsw-alias-label-tertiary);}',
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
      '@media (max-width:520px){.pc-tiles{grid-template-columns:1fr;}.pc-head{flex-wrap:wrap;}.pc-actions{flex-wrap:wrap;}}',
      '.pc-chat{display:flex;flex-direction:column;gap:10px;min-height:220px;max-height:52vh;overflow-y:auto;padding:4px 2px;}',
      '.pc-msg{display:flex;gap:8px;max-width:88%;}',
      '.pc-msg.user{align-self:flex-end;flex-direction:row-reverse;}',
      '.pc-bubble{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:8px 11px;background:var(--dsw-alias-bg-layer-2);white-space:pre-wrap;}',
      '.pc-msg.user .pc-bubble{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-on-primary,#fff);}',
      '.pc-composer{display:flex;gap:8px;align-items:flex-end;border-top:1px solid var(--dsw-alias-border-l1);padding-top:10px;margin-top:4px;}',
      '.pc-textarea{flex:1 1 auto;min-height:38px;max-height:120px;resize:vertical;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);color:inherit;padding:8px 10px;font:inherit;}',
      '.pc-textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(59,130,246,.15);}',
      '.pc-pick{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:8px 10px;margin-top:8px;background:var(--dsw-alias-bg-base);}',
      '.pc-pane-actions{display:flex;gap:8px;justify-content:flex-end;}',
      '.pc-overlap{padding:12px 4px;border-top:1px solid var(--dsw-alias-border-subtle,rgba(0,0,0,.08));}',
      '.pc-overlap-head{display:flex;gap:8px;align-items:baseline;}',
      '.pc-overlap-item{display:flex;gap:10px;align-items:flex-start;margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));}',
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

    // Ask the host why one candidate did or did not make today's picks.
    // The host replays its real gates, so this reports the actual reason rather
    // than a second guess invented for the UI.
    function ExplainCard(props) {
      const { t, chinese } = props
      const [query, setQuery] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [answer, setAnswer] = React.useState(null)
      const [error, setError] = React.useState('')

      const ask = React.useCallback(async () => {
        const needle = query.trim()
        if (needle === '' || busy) return
        setBusy(true)
        setError('')
        try {
          const response = await fetch(API_EXPLAIN + '?q=' + encodeURIComponent(needle), {
            cache: 'no-store',
            credentials: 'same-origin',
          })
          const body = await response.json()
          if (!body || body.ok !== true) throw new Error(body && body.error ? body.error : 'failed')
          setAnswer(body.value)
        } catch (failure) {
          setError(String(failure && failure.message ? failure.message : failure))
          setAnswer(null)
        } finally {
          setBusy(false)
        }
      }, [query, busy])

      let result = null
      if (answer !== null) {
        if (answer.found !== true) {
          result = h('div', { className: 'pc-desc' }, t('explainNotFound'))
        } else {
          result = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            answer.matches.map((match) => {
              const steps = match.admitted === true
                ? [{ text: t('explainAdmitted') + ' · ' + t('explainRank') + ' ' + match.rank, tone: 'ok' }]
                : (match.steps ?? []).map((step) => ({ text: pickText(step, chinese), tone: 'warn' }))
              return h('div', { key: match.name, className: 'pc-overlap' },
                h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' } },
                  h('b', null, match.name),
                  h('span', { className: 'pc-chip' }, t('explainScore') + ' ' + match.score),
                  h('span', { className: 'pc-chip' }, t('explainTier') + ' ' + match.tier),
                ),
                h(Chips, { items: steps.map((step) => ({ label: step.text, tone: step.tone })) }),
              )
            }),
          )
        }
      }

      return h(Card, { title: t('explainTitle'), hint: t('explainHint') },
        h('div', { className: 'pc-tools' },
          h('input', {
            className: 'pc-search',
            type: 'search',
            value: query,
            placeholder: t('explainSearch'),
            'aria-label': t('explainSearch'),
            onChange: (event) => setQuery(event.target.value),
            onKeyDown: (event) => { if (event.key === 'Enter') void ask() },
          }),
          h(Button, { variant: 'primary', disabled: busy || query.trim() === '', onClick: () => { void ask() } },
            busy ? t('loading') : t('explainBtn')),
        ),
        error === '' ? null : h('div', { className: 'pc-desc', style: { color: 'var(--dsw-alias-state-danger-primary)' } }, error),
        result,
      )
    }

    // Toolbar for the installed list: free-text search over bundle names and
    // their attributed tool names, a call-count / name sort, and an on/off state
    // filter. Kept local to the panel so no host round trip is needed.
    function InstalledTools(props) {
      const { t, query, sort, filter, onChange } = props
      const seg = (key, value, label) => h('button', {
        type: 'button',
        key: key,
        'data-on': props[key] === value ? 'true' : 'false',
        'aria-pressed': props[key] === value ? 'true' : 'false',
        onClick: () => onChange(key, value),
      }, label)
      return h('div', { className: 'pc-tools' },
        h('input', {
          className: 'pc-search',
          type: 'search',
          value: query,
          placeholder: t('installedSearch'),
          'aria-label': t('installedSearch'),
          onChange: (event) => onChange('query', event.target.value),
        }),
        h('div', { className: 'pc-seg', role: 'group', 'aria-label': t('installedSortActive') },
          seg('sort', 'calls', t('installedSortActive')),
          seg('sort', 'name', t('installedSortName')),
        ),
        h('div', { className: 'pc-seg', role: 'group', 'aria-label': t('installedFilterAll') },
          seg('filter', 'all', t('installedFilterAll')),
          seg('filter', 'active', t('installedFilterActive')),
          seg('filter', 'idle', t('installedFilterIdle')),
        ),
      )
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

    function EmptyBox(props) {
      const { title, hint } = props
      return h('div', { className: 'pc-empty-box', role: 'status' },
        h('b', null, title),
        hint ? h('span', null, hint) : null)
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
      const { item, t, chinese, busy, stage, onInstall, onDismiss, first } = props
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
            h(Button, { variant: 'primary', disabled: busy !== '', onClick: () => onInstall(item) }, installing ? t('installing') + (stage !== '' ? ' · ' + stage : elapsed > 3 ? ' ' + elapsed + 's' : '') : t('install')),
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

    /**
     * A searchable provider/model menu, mirroring the harness model picker:
     * one flat list grouped under sticky provider headers, a substring filter
     * over both the model id and its display name, arrow/Enter/Escape keys and
     * a tick on the current selection. It cannot reuse the harness picker
     * itself — that one is bound to the session-scoped modelDirectories
     * service and refuses addressed subagent sessions — but it reads the same
     * provider list, so anything configured in Harness shows up here.
     */
    function ModelPicker(props) {
      const { t, chinese, catalog, value, disabled, onPick } = props
      const [open, setOpen] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [active, setActive] = React.useState(0)
      const boxRef = React.useRef(null)
      const inputRef = React.useRef(null)
      const providers = (catalog && catalog.providers) || []
      const groups = providers.map((provider) => ({ provider, models: provider.models || [] }))
      const all = groups.flatMap((group) => group.models.map((model) => ({ provider: group.provider, model })))
      const needle = query.trim().toLowerCase()
      const shown = {}
      for (const group of groups) {
        const models = group.models.filter((model) =>
          needle === '' ||
          String(model.id || '').toLowerCase().includes(needle) ||
          String(model.name || '').toLowerCase().includes(needle) ||
          String(group.provider.name || group.provider.id || '').toLowerCase().includes(needle))
        if (models.length > 0) shown[group.provider.id] = models
      }
      const visibleGroups = groups.filter((group) => shown[group.provider.id] !== undefined)
      const visible = visibleGroups.flatMap((group) =>
        shown[group.provider.id].map((model) => ({ providerId: group.provider.id, model })))
      const flat = visible
      const clamped = visible.length === 0 ? 0 : Math.min(active, visible.length - 1)
      const currentProvider = providers.find((item) => item.id === value.provider)
      const currentModel = currentProvider && (currentProvider.models || []).find((item) => item.id === value.model)
      const label = currentModel ? (currentModel.name || currentModel.id) : (value.model || '')
      const missing = value.provider !== '' && currentProvider === undefined

      React.useEffect(() => {
        if (!open) return undefined
        const onDown = (event) => {
          if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        const timer = setTimeout(() => { if (inputRef.current) inputRef.current.focus() }, 0)
        return () => {
          document.removeEventListener('mousedown', onDown)
          clearTimeout(timer)
        }
      }, [open])
      React.useEffect(() => {
        const item = boxRef.current && boxRef.current.querySelector('[data-active="true"]')
        if (item && item.scrollIntoView) item.scrollIntoView({ block: 'nearest' })
      }, [clamped, open])
      React.useEffect(() => {
        if (open) { setQuery(''); setActive(0) }
      }, [open])

      const pick = (entry) => {
        onPick({
          provider: entry.providerId,
          model: entry.model.id,
          supportsVision: entry.model.image === true,
          reasoningEffort: value.reasoningEffort || '',
        })
        setOpen(false)
      }
      const onKeyDown = (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          if (flat.length === 0) return
          const step = event.key === 'ArrowDown' ? 1 : -1
          setActive((current) => {
            const next = Math.min(flat.length - 1, Math.max(0, current + step))
            return next
          })
          return
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          const entry = flat[clamped]
          if (entry !== undefined) pick(entry)
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setOpen(false)
        }
      }

      const header = h('div', { className: 'pc-model-head' },
        h('span', { className: 'pc-model-sub' }, t('modelCurrent') + '：'),
        label === ''
          ? h('span', { className: 'pc-chip warn' }, t('modelUnset'))
          : h('span', { className: 'pc-model-name' }, label),
        currentProvider ? h('span', { className: 'pc-chip' }, currentProvider.name || currentProvider.id) : null,
        currentModel && currentModel.image === true ? h('span', { className: 'pc-chip' }, '图片') : null,
        missing ? h('span', { className: 'pc-chip warn' }, t('modelMissing') + '（' + value.provider + '）') : null,
        currentModel && value.reasoningEffort
          ? h('span', { className: 'pc-chip' }, t('modelReasoningShort') + ' ' + value.reasoningEffort)
          : null,
        h('span', { className: 'pc-grow' }),
        h(Button, {
          variant: 'ghost',
          disabled: Boolean(disabled),
          onClick: () => setOpen((current) => !current),
        }, open ? t('modelBack') : t('modelPick')),
      )

      const list = flat.length === 0
        ? h('div', { className: 'pc-pop-note' }, all.length === 0 ? t('modelEmpty') : t('modelNoResult'))
        : h('div', { className: 'pc-pop-list', role: 'listbox' },
          visibleGroups.map((group) => h('div', { key: group.provider.id },
            h('div', { className: 'pc-pop-group' }, group.provider.name || group.provider.id),
            shown[group.provider.id].map((model) => {
              const key = group.provider.id + '::' + model.id
              const isCurrent = group.provider.id === value.provider && model.id === value.model
              const isActive = flat[clamped] !== undefined &&
                flat[clamped].providerId === group.provider.id && flat[clamped].model.id === model.id
              return h('button', {
                key,
                type: 'button',
                role: 'option',
                className: 'pc-pop-item',
                'data-active': isActive ? 'true' : 'false',
                'aria-selected': isCurrent ? 'true' : 'false',
                onMouseEnter: () => setActive(visible.findIndex((entry) =>
                  entry.providerId === group.provider.id && entry.model.id === model.id)),
                onClick: () => pick({ providerId: group.provider.id, model }),
              },
                h('span', { className: 'pc-grow' }, model.name || model.id),
                model.name && model.name !== model.id ? h('span', { className: 'pc-model-sub' }, model.id) : null,
                model.image === true ? h('span', { className: 'pc-chip' }, '图片') : null,
                isCurrent ? h('span', { className: 'pc-tick' }, '✓') : null,
              )
            }),
          )),
        )

      return h('div', { className: 'pc-model', ref: boxRef },
        header,
        open
          ? h('div', { className: 'pc-pop', onKeyDown },
            h('div', { className: 'pc-pop-search' },
              h('input', {
                ref: inputRef,
                className: 'pc-input',
                type: 'text',
                placeholder: t('modelSearch'),
                value: query,
                onChange: (event) => { setQuery(event.target.value); setActive(0) },
              }),
            ),
            list,
          )
          : null,
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

          h('span', { className: 'pc-label' }, t('modelModel')),
          h(ModelPicker, {
            t,
            chinese,
            catalog: draft.catalog,
            value: model,
            disabled: saving,
            onPick: (next) => update({ model: { ...model, ...next } }),
          }),
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
      const { item, t, chinese, busy, stage, onInstall, onDismiss } = props
      const title = pickText(item.title, chinese) || item.name
      const description = (chinese && item.descriptionZh) ? item.descriptionZh : pickText(item.description, chinese)
      const reasons = (item.reasons ?? []).map((reason) => pickText(reason, chinese)).filter(Boolean).slice(0, 3)
      const installing = busy === 'install:' + item.id
      const [elapsed, setElapsed] = React.useState(0)
      React.useEffect(() => {
        if (!installing) { setElapsed(0); return undefined }
        const started = Date.now()
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
        return () => clearInterval(timer)
      }, [installing])
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
          h(Button, { variant: 'primary', disabled: busy !== '', onClick: () => onInstall(item) }, installing ? t('installing') + (stage !== '' ? ' · ' + stage : elapsed > 3 ? ' ' + elapsed + 's' : '') : t('install')),
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
      const [installedQuery, setInstalledQuery] = React.useState('')
      const [installedSort, setInstalledSort] = React.useState('calls')
      const [installedFilter, setInstalledFilter] = React.useState('all')
      const [messages, setMessages] = React.useState([])
      const [draft, setDraft] = React.useState('')
      const [sending, setSending] = React.useState(false)
      const [busyFor, setBusyFor] = React.useState(0)
      const [dismissedLocal, setDismissedLocal] = React.useState([])


      // Remember the validator of the last body we rendered so the 45-second
      // poll can ask for a 304 instead of re-downloading (and re-parsing) the
      // whole snapshot every time nothing changed. Kept per tab: the validator
      // describes the bytes of one tab's slice.
      const etagRef = React.useRef({ tab: '', value: '' })

      const load = React.useCallback(async () => {
        try {
          const headers = {}
          // The ETag keys the exact bytes for one tab, so a cached validator is
          // only reusable while the tab stays put. Reset it when the tab moves.
          if (etagRef.current.tab === tab) {
            if (etagRef.current.value !== '') headers['if-none-match'] = etagRef.current.value
          } else {
            etagRef.current = { tab, value: '' }
          }
          const response = await fetch(API_STATE + '?tab=' + encodeURIComponent(tab), {
            cache: 'no-store',
            credentials: 'same-origin',
            headers,
          })
          if (response.status === 304) { setError(''); return }
          const etag = response.headers.get('etag')
          const body = await response.json().catch(() => null)
          if (response.status === 401) { setError(t('loginRequired')); return }
          if (!response.ok || body === null || body.ok !== true) {
            setError((body && body.error) || 'HTTP ' + response.status)
            return
          }
          if (typeof etag === 'string' && etag !== '') etagRef.current = { tab, value: etag }
          setData(body.value)
          setError('')
        } catch (cause) {
          setError(String(cause && cause.message ? cause.message : cause))
        }
      }, [t, tab])

      React.useEffect(() => {
        ensureStyles()
        void load()
        // Poll every 45s when idle. While an install/refresh of ours is in
        // flight, the host writes stage events as it goes, so poll fast enough
        // for those to reach the button instead of leaving the user counting seconds.
        const period = busy === '' ? 45_000 : 1_500
        const timer = setInterval(() => { void load() }, period)
        return () => clearInterval(timer)
      }, [load, busy])

      // Latest stage the host reported for the action we are waiting on.
      const stage = data === null || busy === '' ? '' : String(
        (data.events ?? []).find((event) => String(event?.message ?? '').includes('install stage:'))?.message ?? ''
      ).replace('install stage:', '').trim()

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

      const dismissCard = React.useCallback(async (id) => {
        setDismissedLocal((current) => (current.includes(id) ? current : [...current, id]))
        await act('dismiss', { id }, t('dismissDone'))
      }, [act, t])

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
          const overlaps = Array.isArray(body.overlaps) ? body.overlaps : []
          if (errorCode) {
            setToast({ kind: 'err', text: fill(t('installedFailed'), { reason: errorCode }) })
          } else if (overlaps.length > 0) {
            setToast({ kind: 'ok', text: t('installedLive') + ' · ' + fill(t('overlapAfterInstall'), { n: overlaps.length }) })
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

      const groupKey = (tag) => 'overlapGroup_' + tag
      const groupLabel = (tag) => {
        const key = groupKey(tag)
        const label = t(key)
        return label === key ? tag : label
      }
      const hiddenLocal = new Set(dismissedLocal)
      const recommendations = (data.recommendations || []).filter(
        (item) => !isInstalled(item) && !hiddenLocal.has(item.id),
      )
      const idle = data.idle || []
      const gaps = (data.gaps || []).map((gap) => ({
        ...gap,
        suggestions: (gap.suggestions || []).filter(
          (item) => !isInstalled(item) && !hiddenLocal.has(item.id),
        ),
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

      const tiles = h('div', { className: 'pc-tiles', role: 'group', 'aria-label': t('statsLabel') },
        h('div', { className: 'pc-tile' }, h('b', null, String(totals.recommendations ?? recommendations.length)), h('span', null, t('statsRecommend'))),
        h('div', { className: 'pc-tile' }, h('b', null, String(totals.installed ?? installed.length)), h('span', null, t('statsInstalled'))),
        h('div', { className: 'pc-tile' }, h('b', null, String(totals.idle ?? idle.length)), h('span', null, t('statsIdle'))),
        h('div', { className: 'pc-tile' }, h('b', null, numberFmt(totals.calls7 ?? 0, chinese)), h('span', null, t('statsCalls'))),
      )

      const tabKeys = ['recs', 'installed', 'insight']
      const tabLabels = {
        recs: t('tabRecs') + ' ' + recommendations.length,
        installed: t('tabInstalled') + ' ' + installed.length,
        insight: t('tabInsight'),
      }
      // Roving focus: arrows move between tabs so the bar is reachable without
      // a mouse, matching how the host's own segmented controls behave.
      const onTabKey = (event) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if (step === 0) return
        event.preventDefault()
        const at = tabKeys.indexOf(tab)
        setTab(tabKeys[(at + step + tabKeys.length) % tabKeys.length])
      }
      const tabs = h('div', { className: 'pc-tabs', role: 'tablist', 'aria-label': t('tabsLabel'), onKeyDown: onTabKey },
        tabKeys.map((key, index) => h('button', {
          key,
          type: 'button',
          role: 'tab',
          tabIndex: tab === key ? 0 : -1,
          'aria-selected': tab === key ? 'true' : 'false',
          'aria-controls': 'pc-panel-' + key,
          'aria-posinset': index + 1,
          'aria-setsize': tabKeys.length,
          className: 'pc-tab',
          'data-active': tab === key ? 'true' : 'false',
          onClick: () => setTab(key),
        }, tabLabels[key])))

      const chatView = h(Card, { title: t('chatTitle'), hint: t('chatHint') },
        h('div', { className: 'pc-chat' },
          messages.length === 0
            ? h(EmptyBox, { title: t('chatEmpty'), hint: t('chatEmptyHint') })
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

      const paneActions = h('div', { className: 'pc-pane-actions' },
        h(Button, { variant: 'ghost', disabled: busy !== '', onClick: () => act('rotate', {}, t('rotated')) },
          busy === 'rotate' ? t('rotating') : t('rotate')),
        h(Button, { variant: 'ghost', disabled: busy !== '', onClick: () => act('refresh', {}, t('refresh')) },
          busy === 'refresh' ? t('refreshing') + '…' : t('refresh')),
      )

      const modelBadge = (() => {
        const catalog = settingsValue && settingsValue.catalog
        if (!catalog || catalog.available !== true) return null
        const picked = settings.model || {}
        const provider = (catalog.providers || []).find((item) => item.id === picked.provider)
        const chosen = provider && (provider.models || []).find((item) => item.id === picked.model)
        const status = data.modelStatus
        const failed = status && status.ok === false
        const reason = failed ? String(status.reason || '') : ''
        const note = reason === 'provider-missing'
          ? fill(t('modelMissing'), { p: String(status.detail || picked.provider || '') })
          : reason !== '' ? fill(t('modelFailed'), { reason }) : ''
        return h(Card, { title: t('modelTitle'), hint: t('modelHint') },
          h('div', { className: 'pc-model-head' },
            chosen
              ? h('span', { className: 'pc-model-name' }, chosen.name || chosen.id)
              : h('span', { className: 'pc-chip warn' }, t('modelUnset')),
            chosen && provider ? h('span', { className: 'pc-chip' }, provider.name || provider.id) : null,
            chosen && chosen.image === true ? h('span', { className: 'pc-chip' }, '图片') : null,
            h('span', { className: 'pc-grow' }),
            h(Button, { variant: 'ghost', onClick: () => setTab('insight') }, t('modelPick')),
          ),
          note !== '' ? h('div', { className: 'pc-desc', style: { color: 'var(--dsw-alias-state-warn-primary)' } }, note) : null,
        )
      })()

      const recsView = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        chatView,
        modelBadge,
        paneActions,
        h('div', { className: 'pc-grid' },
          recommendations.length === 0
            ? h(EmptyBox, { title: t('emptyRecommend'), hint: t('emptyRecommendHint') })
            : recommendations.map((item) => h(RecommendationCard, {
              key: item.id,
              item,
              t,
              chinese,
              busy,
              stage,
              onInstall: installCard,
              onDismiss: dismissCard,
            }))))

      // Search covers the bundle name and every attributed tool name, which is
      // what a user actually remembers when they wonder whether a plugin is
      // installed. Calls are the sum of the tools already counted by the host.
      const installedShown = (() => {
        const needle = installedQuery.trim().toLowerCase()
        const callsOf = (item) => (item.tools ?? []).reduce((sum, tool) => sum + (Number(tool.calls) || 0), 0)
        const kept = installed.filter((item) => {
          if (installedFilter === 'active' && item.status !== 'active') return false
          if (installedFilter === 'idle' && item.status === 'active') return false
          if (needle === '') return true
          const haystack = [item.name, item.title, item.titleZh, ...(item.tools ?? []).map((tool) => tool.name)]
            .filter(Boolean).join(' ').toLowerCase()
          return haystack.includes(needle)
        })
        return installedSort === 'name'
          ? kept.slice().sort((left, right) => String(left.name).localeCompare(String(right.name)))
          : kept.slice().sort((left, right) => callsOf(right) - callsOf(left))
      })()

      const installedView = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        h(Card, { title: t('installedTitle'), count: installedShown.length, hint: t('installedHint') },
          h(InstalledTools, {
            t,
            query: installedQuery,
            sort: installedSort,
            filter: installedFilter,
            onChange: (key, value) => {
              if (key === 'query') setInstalledQuery(value)
              else if (key === 'sort') setInstalledSort(value)
              else setInstalledFilter(value)
            },
          }),
          installedShown.length === 0 ? h(EmptyBox, { title: installed.length === 0 ? t('emptyInstalled') : t('installedNone'), hint: installed.length === 0 ? t('emptyInstalledHint') : t('installedNoneHint') }) : installedShown.map((item, index) => h(InstalledRow, {
            key: item.name, item, t, chinese, busy, confirming, first: index === 0,
            onToggle: (name, enabled) => act('toggle', { name, enabled }, enabled ? t('toggleOn') : t('toggleOff')),
            onRemove: (name) => act('remove', { name }, t('removedLive')),
            onConfirm: (name) => setConfirming(name),
          }))),
        h(Card, { title: t('idleTitle'), count: idle.length, hint: t('idleHint') },
          idle.length === 0 ? h(EmptyBox, { title: t('emptyIdle'), hint: t('emptyIdleHint') }) : idle.map((item, index) => h(IdleRow, {
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
        paneActions,
        h(ExplainCard, { t, chinese }),
        h(Card, { title: t('diffTitle'), hint: t('diffHint') },
          h(Chips, { items: diffItems.length > 0 ? diffItems : [{ label: t('diffEmpty') }] })),
        conflicts.length === 0 ? null : h(Card, { title: t('conflictsTitle'), count: conflicts.length, hint: t('conflictsHint') },
          conflicts.map((conflict, index) => h('div', {
            key: conflict.tag,
            className: 'pc-overlap',
            style: index === 0 ? { borderTop: 'none' } : null,
          },
            h('div', { className: 'pc-overlap-head' },
              h('span', { className: 'pc-name' }, groupLabel(conflict.tag)),
              h('span', { className: 'pc-chip' }, fill(t('overlapCount'), { n: (conflict.plugins ?? []).length })),
            ),
            conflict.reason
              ? h('div', { className: 'pc-desc', style: { marginTop: '4px' } }, pickText(conflict.reason, chinese))
              : null,
            (conflict.plugins ?? []).map((plugin) => h('div', { key: plugin.name, className: 'pc-overlap-item' },
              h('div', { className: 'pc-grow' },
                h('div', { style: { display: 'flex', gap: '6px', alignItems: 'baseline', flexWrap: 'wrap' } },
                  h('span', { className: 'pc-name' }, plugin.title || plugin.name),
                  plugin.version ? h('span', { className: 'pc-chip' }, 'v' + plugin.version) : null,
                  plugin.primary ? h('span', { className: 'pc-chip ok' }, t('overlapPrimary')) : null,
                  plugin.enabled === false ? h('span', { className: 'pc-chip' }, t('disabledTag')) : null,
                ),
                (chinese && plugin.descriptionZh) || plugin.description
                  ? h('div', { className: 'pc-desc' }, (chinese && plugin.descriptionZh) || plugin.description)
                  : null,
                (plugin.evidence ?? []).length > 0
                  ? h('div', { className: 'pc-metrics' },
                    h('span', { className: 'pc-metric' }, fill(t('overlapEvidenceTool'), { list: plugin.evidence.join('、') })))
                  : plugin.evidenceKind === 'name'
                    ? h('div', { className: 'pc-metrics' },
                      h('span', { className: 'pc-metric' }, t('overlapEvidenceName')))
                    : null,
                h('div', { className: 'pc-metrics' },
                  h('span', { className: 'pc-metric' }, fill(t('overlapCalls'), { n: plugin.calls })),
                  h('span', { className: 'pc-metric' }, fill(t('overlapTools'), { n: plugin.toolCount })),
                  plugin.lastUsed ? h('span', { className: 'pc-metric' }, t('overlapLastUsed') + ' ' + plugin.lastUsed) : null,
                  plugin.daysInactive === null || plugin.daysInactive === undefined ? null : h('span', { className: 'pc-metric' }, fill(t('overlapIdle'), { n: plugin.daysInactive })),
                ),
              ),
              plugin.removable
                ? h(Button, {
                  variant: 'danger',
                  disabled: busy !== '',
                  onClick: () => (confirming === plugin.name
                    ? act('remove', { name: plugin.name }, t('removedLive'))
                    : setConfirming(plugin.name)),
                }, confirming === plugin.name ? t('confirmRemove') : t('remove'))
                : null,
            )),
          )))
        ,
        h(Card, { title: t('gapsTitle'), count: gaps.length, hint: t('gapsHint') },
          gaps.length === 0 ? h(EmptyBox, { title: t('gapEmpty'), hint: t('gapEmptyHint') }) : gaps.map((gap, index) => h('div', { key: gap.tag, className: 'pc-row', style: index === 0 ? { borderTop: 'none' } : null },
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
                    stage,
                    onInstall: installCard,
                    onDismiss: dismissCard,
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
