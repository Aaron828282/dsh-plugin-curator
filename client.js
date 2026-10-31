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
      statsGap: '能力缺口',
      statsPool: '候选池',
      statsNext: '下次巡检',
      chartOfficial: '官方内置',
      chartNpm: 'npm 关键词',
      chartGithub: 'GitHub 话题',
      chartRegistry: '社区注册表',
      statSecondary: '{main}',
      statInstalledMain: '共 {n} 个已装',
      statInstalledSub: '{active} 个在用 · {unused} 个未调用',
      statRecommendSub: 'AI 参与挑选 {n} 条',
      statCallsSub: '覆盖 {n} 个插件',
      statGapSub: '{list}',
      statPoolMain: '{n} 个候选',
      statPoolSub: '已校验 {n} 个',
      statNextSub: '上次 {time}',
      chartUsageTitle: '插件使用分布',
      chartUsageHint: '按近 {days} 天关联调用划分',
      chartUsageEmpty: '还没有插件被调用过',
      chartScoreTitle: '推荐分数分布',
      chartScoreHint: '分数越高越贴合你当前的使用习惯',
      chartScoreEmpty: '今天还没有推荐',
      chartSourceTitle: '采集来源覆盖',
      chartSourceHint: '发现要宽，展示要窄。条形越长说明该渠道抓取得越完整',
      chartSourceEmpty: '还没有采集记录',
      chartActive: '在用',
      chartWatching: '待观察',
      chartUnused: '未调用',
      chartTotal: '合计',
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

      railOverview: '概览',
      railRecs: '推荐',
      railInstalled: '已装',
      railInsight: '洞察',
      railGap: '缺口',
      cvToday: '今日',
      cvOver: '较昨日',
      cvPrev: '昨天',
      cvFlat: '与昨日持平',
      cvPanel: '总览',
      cvPanelHint: '四个数字讲完今天的状态，下面的卡片才是细节。',
      cvNext: '下次巡检',
      cvLast: '上次生成',
      cvTop: '调用最多的插件',
      cvTopEmpty: '近 {days} 天还没有插件被调用',
      cvSplit: '已装构成',
      cvExcluded: '未进推荐',
      cvExcludedHint: '被门槛挡在外面，点开看每一档各有多少。',
      cvHealth: '体检',
      cvHealthGood: '没有发现需要处理的问题。',
      cvHealthIdle: '{n} 个插件装上后没被调用',
      cvHealthConflict: '{n} 组插件能力重叠',
      cvHealthModel: 'AI 分析没有成功：{reason}',
      cvHealthSource: '{n} 个采集渠道异常',
      cvDetail: '详情',
      cvCollapse: '收起',
      cvSidebarHint: '宽屏时显示左侧分组导航',
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
      statsGap: 'Gaps',
      statsPool: 'Pool',
      statsNext: 'Next run',
      chartOfficial: 'Official',
      chartNpm: 'npm keyword',
      chartGithub: 'GitHub topic',
      chartRegistry: 'Registry',
      statSecondary: '{main}',
      statInstalledMain: '{n} installed',
      statInstalledSub: '{active} active · {unused} unused',
      statRecommendSub: 'AI picked {n}',
      statCallsSub: 'across {n} bundles',
      statGapSub: '{list}',
      statPoolMain: '{n} candidates',
      statPoolSub: '{n} verified',
      statNextSub: 'last {time}',
      chartUsageTitle: 'Bundle usage',
      chartUsageHint: 'By attributed calls over the last {days} days',
      chartUsageEmpty: 'No bundle has been called yet',
      chartScoreTitle: 'Recommendation scores',
      chartScoreHint: 'Higher means it fits how you actually work',
      chartScoreEmpty: 'No recommendations today',
      chartSourceTitle: 'Source coverage',
      chartSourceHint: 'Wide discovery, narrow display. Longer bars mean that source was crawled more completely',
      chartSourceEmpty: 'No crawl records yet',
      chartActive: 'Active',
      chartWatching: 'Watching',
      chartUnused: 'Unused',
      chartTotal: 'Total',
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

      railOverview: 'Overview',
      railRecs: 'Picks',
      railInstalled: 'Installed',
      railInsight: 'Insight',
      railGap: 'Gaps',
      cvToday: 'Today',
      cvOver: 'vs yesterday',
      cvPrev: 'Yesterday',
      cvFlat: 'unchanged from yesterday',
      cvPanel: 'At a glance',
      cvPanelHint: 'Four numbers cover the state of today; the cards below carry the detail.',
      cvNext: 'Next run',
      cvLast: 'Last built',
      cvTop: 'Most-called bundles',
      cvTopEmpty: 'No bundle was called in the last few days',
      cvSplit: 'Installed mix',
      cvExcluded: 'Kept out',
      cvExcludedHint: 'Filtered by the gates. Open to see how many fell in each.',
      cvHealth: 'Checkup',
      cvHealthGood: 'Nothing needs attention.',
      cvHealthIdle: '{n} bundles installed but never called',
      cvHealthConflict: '{n} groups of overlapping bundles',
      cvHealthModel: 'AI analysis failed: {reason}',
      cvHealthSource: '{n} source channels errored',
      cvDetail: 'Detail',
      cvCollapse: 'Collapse',
      cvSidebarHint: 'The group rail appears on wide panels',
    }

    const CSS = [
      '.pc-root{--pc-gap:14px;container-type:inline-size;--cv-accent:var(--dsw-alias-brand-primary);}',
      '.cv{padding:2px 2px 22px;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary,#1f2328);}',
      '.cv-body{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start;}',
      '.cv-main{display:flex;flex-direction:column;gap:12px;min-width:0;}',
      '.cv-side{display:none;}',
      '.cv-console{display:flex;flex-direction:column;gap:12px;padding:14px 15px 16px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-base);}',
      '.cv-compact{display:flex;flex-direction:column;gap:12px;}',
      '.cv-full{display:none;}',
      '.cv-grid2{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-items:start;}',
      '.cv-grid3{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}',
      '.cv-grid4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}',
      '.cv-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-items:start;}',
      '@container (min-width:560px){.cv-body{grid-template-columns:158px minmax(0,1fr);gap:16px;}.cv-side{display:flex;flex-direction:column;gap:2px;position:sticky;top:0;padding-top:2px;}.cv-grid3{grid-template-columns:repeat(3,minmax(0,1fr));}.cv-grid4{grid-template-columns:repeat(4,minmax(0,1fr));}}',
      '@container (min-width:900px){.cv-grid2{grid-template-columns:repeat(2,minmax(0,1fr));}.cv-grid3{grid-template-columns:repeat(3,minmax(0,1fr));}.cv-cols{grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);}.cv-compact{display:none;}.cv-full{display:flex;flex-direction:column;gap:12px;}}',
      '.pc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}',
      '.pc-title{font-size:19px;font-weight:650;letter-spacing:.2px;margin:0 0 2px;}',
      '.pc-sub{color:var(--dsw-alias-label-secondary);font-size:12.5px;margin:0;}',
      '.pc-headmeta{display:flex;flex-direction:column;align-items:flex-end;gap:8px;}',
      '.pc-meta{display:flex;gap:10px;color:var(--dsw-alias-label-tertiary);font-size:11.5px;flex-wrap:wrap;}',
      '.pc-actions{display:flex;gap:8px;align-items:center;}',
      '.pc-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}',
      '.pc-tile small{display:block;color:var(--dsw-alias-label-secondary);font-size:11px;margin-top:5px;line-height:1.4;}',
      '.pc-card-sub{color:var(--dsw-alias-label-secondary);font-size:11.5px;margin:0 0 10px;}',
      '.pc-bars{display:flex;flex-direction:column;gap:7px;}',
      '.pc-bar{display:grid;grid-template-columns:minmax(56px,110px) minmax(0,1fr) auto;align-items:center;gap:9px;}',
      '.pc-bar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.pc-bar-track{height:9px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;}',
      '.pc-bar-fill{height:100%;border-radius:999px;transition:width .3s ease;}',
      '.pc-bar-value{color:var(--dsw-alias-label-secondary);font-size:11.5px;white-space:nowrap;}',
      '.pc-donut{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}',
      '.pc-donut-svg{flex:0 0 auto;width:104px;height:104px;}',
      '.pc-donut-num{font-size:19px;font-weight:650;fill:currentColor;}',
      '.pc-donut-lab{font-size:9.5px;fill:currentColor;opacity:.62;}',
      '.pc-legend{flex:1 1 130px;min-width:0;display:flex;flex-direction:column;gap:6px;}',
      '.pc-legend-row{display:grid;grid-template-columns:9px minmax(0,1fr) auto auto;align-items:center;gap:7px;font-size:11.5px;}',
      '.pc-legend-dot{width:9px;height:9px;border-radius:3px;}',
      '.pc-legend-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);}',
      '.pc-legend-pct{font-variant-numeric:tabular-nums;}',
      '.pc-legend-val{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;}',
      '.pc-bar-icon{display:block;width:100%;height:100%;opacity:.35;}',
      '.pc-bar-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--dsw-alias-border-l1);}',
      '.pc-bar-row:first-child{border-top:none;}',
      '.pc-bar-title{display:block;font-size:12px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.pc-bar-sub{display:block;color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:1.35;}',
      '.pc-bar-score{font-size:20px;font-weight:650;font-variant-numeric:tabular-nums;line-height:1;}',
      '.pc-bar-meter{grid-column:1 / -1;height:6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;}',
      '.pc-bar-meter span{display:block;height:100%;border-radius:999px;}',
      '.pc-bar-btn{appearance:none;border:0;background:transparent;font:inherit;color:inherit;text-align:left;cursor:pointer;border-radius:8px;padding-left:5px;padding-right:5px;margin-left:-5px;margin-right:-5px;}',
      '.pc-bar-btn:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.pc-bar-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;}',
      '.pc-charts{display:flex;flex-direction:column;gap:var(--pc-gap);}',
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
      '.pc-name{font-weight:600;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
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


    // Compact panel system: one rail, four KPI tiles, stacked cards. Sizes
    // are tuned for the 260-420px sidebar and grow only when the container
    // itself gets wide, never when the window does.
    const CV_CSS = [
      '.cv-chip{display:inline-flex;align-items:center;gap:6px;height:29px;padding:0 11px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;}',
      '.cv-chip:hover{border-color:var(--cv-accent);color:var(--cv-accent);}',
      '.cv-chip:disabled{opacity:.55;cursor:default;}',
      '.cv-chip.primary{background:var(--cv-accent);border-color:var(--cv-accent);color:var(--dsw-alias-brand-on-primary,#fff);font-weight:600;}',
      '.cv-chip.primary:hover{filter:brightness(1.05);color:var(--dsw-alias-brand-on-primary,#fff);}',
      '.cv-chip.ghost{background:transparent;}',
      '.cv-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:27px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;}',
      '.cv-btn:hover{border-color:var(--cv-accent);color:var(--cv-accent);}',
      '.cv-btn:disabled{opacity:.5;cursor:default;}',
      '.cv-btn.primary{background:var(--cv-accent);border-color:var(--cv-accent);color:var(--dsw-alias-brand-on-primary,#fff);font-weight:600;}',
      '.cv-btn.primary:hover{color:var(--dsw-alias-brand-on-primary,#fff);filter:brightness(1.05);}',
      '.cv-btn.danger{color:var(--dsw-alias-state-error-primary,#c92a2a);}',
      '.cv-btn.wide{width:100%;height:32px;font-size:12.5px;}',
      '.cv-btn:focus-visible,.cv-chip:focus-visible,.cv-side-item:focus-visible,.cv-rec-main:focus-visible{outline:2px solid var(--cv-accent);outline-offset:2px;}',
      '.cv-side-item{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;text-align:left;cursor:pointer;}',
      '.cv-side-item b{margin-left:auto;font-size:12.5px;font-weight:650;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);}',
      '.cv-side-item small{font-size:11px;color:var(--dsw-alias-label-tertiary);}',
      '.cv-side-item:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.cv-side-item[data-on=true]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.cv-head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;flex-wrap:wrap;}',
      '.cv-head h1{margin:0;font-size:18px;font-weight:650;letter-spacing:.2px;}',
      '.cv-head p{margin:3px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);max-width:60ch;}',
      '.cv-meta{display:flex;flex-wrap:wrap;gap:3px 11px;margin-top:6px;font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;}',
      '.cv-head-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}',
      '.cv-kpi{display:flex;flex-direction:column;gap:3px;min-width:0;padding:10px 12px 11px;border-radius:13px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);}',
      '.cv-kpi-label{font-size:11px;line-height:1.25;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-kpi-value{font-size:23px;line-height:1.1;font-weight:650;letter-spacing:-.4px;font-variant-numeric:tabular-nums;}',
      '.cv-kpi-unit{font-size:11.5px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-left:2px;letter-spacing:0;}',
      '.cv-kpi-foot{display:flex;align-items:center;gap:5px;font-size:10.5px;line-height:1.3;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-delta{font-weight:650;font-variant-numeric:tabular-nums;}',
      '.cv-delta.up{color:var(--dsw-alias-state-success-primary,#2f9e44);}',
      '.cv-delta.down{color:var(--dsw-alias-state-error-primary,#c92a2a);}',
      '.cv-delta.flat{color:var(--dsw-alias-label-tertiary);}',
      '.cv-spark{display:flex;align-items:flex-end;gap:2px;height:16px;margin-top:2px;}',
      '.cv-spark i{display:block;width:5px;border-radius:2px 2px 0 0;background:var(--cv-accent);opacity:.8;}',
      '.cv-tile{display:flex;align-items:center;gap:11px;min-width:0;padding:10px 13px;border:1px solid var(--dsw-alias-border-l1);border-radius:13px;background:var(--dsw-alias-bg-base);}',
      '.cv-tile-body{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px;}',
      '.cv-tile-label{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-tile-main{font-size:16px;line-height:1.2;font-weight:650;font-variant-numeric:tabular-nums;}',
      '.cv-tile-sub{font-size:10.5px;line-height:1.35;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-bar{height:5px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;}',
      '.cv-bar>i{display:block;height:100%;border-radius:999px;background:var(--cv-accent);}',
      '.cv-card{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;background:var(--dsw-alias-bg-base);padding:11px 13px 12px;min-width:0;}',
      '.cv-card-head{display:flex;align-items:baseline;gap:7px;margin-bottom:7px;}',
      '.cv-card-head h3{margin:0;font-size:12.5px;font-weight:620;letter-spacing:.1px;}',
      '.cv-card-count{font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}',
      '.cv-card-note{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-tertiary);text-align:right;}',
      '.cv-card-sub{margin:0 0 7px;font-size:11px;line-height:1.45;color:var(--dsw-alias-label-tertiary);}',
      '.cv-empty{display:flex;flex-direction:column;gap:2px;padding:11px 11px;border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;color:var(--dsw-alias-label-secondary);}',
      '.cv-empty b{font-size:12px;font-weight:600;}',
      '.cv-empty span{font-size:11px;line-height:1.45;color:var(--dsw-alias-label-tertiary);}',
      '.cv-recs{display:flex;flex-direction:column;gap:7px;}',
      '.cv-rec{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-base);transition:border-color .15s ease,box-shadow .15s ease;}',
      '.cv-rec:hover{border-color:var(--cv-accent);}',
      '.cv-rec[data-open=true]{border-color:var(--cv-accent);}',
      '.cv-rec[data-flag=true]{box-shadow:0 0 0 2px var(--cv-accent);}',
      '.cv-rec[data-flag=true] .cv-rec-main{border:1px solid var(--cv-accent);border-radius:9px;padding:2px 4px;}',
      '.cv-rec-main{display:flex;flex-direction:column;gap:2px;min-width:0;}',
      '.cv-rec-title{font-size:12.5px;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-rec-sub{font-size:10.5px;line-height:1.4;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-rec-ops{display:flex;align-items:center;gap:5px;}',
      '.cv-tag{display:inline-flex;align-items:center;gap:3px;padding:0 6px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:10px;line-height:1.7;white-space:nowrap;}',
      '.cv-tag.ok{background:var(--dsw-alias-state-success-subtle,rgba(47,158,68,.12));color:var(--dsw-alias-state-success-primary,#2f9e44);}',
      '.cv-tag.warn{background:var(--dsw-alias-state-warn-subtle,rgba(240,140,0,.14));color:var(--dsw-alias-state-warn-primary,#b35c00);}',
      '.cv-rec-more{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:9px;cursor:pointer;}',
      '.cv-rec-more:hover{border-color:var(--cv-accent);color:var(--cv-accent);}',
      '.cv-donut{display:flex;align-items:center;gap:13px;flex-wrap:wrap;}',
      '.cv-donut svg{flex:0 0 auto;}',
      '.cv-donut-num{font-size:17px;font-weight:650;fill:currentColor;}',
      '.cv-donut-lab{font-size:9px;fill:currentColor;opacity:.62;}',
      '.cv-legend{flex:1 1 120px;min-width:0;display:flex;flex-direction:column;gap:4px;}',
      '.cv-legend-row{display:grid;grid-template-columns:8px minmax(0,1fr) auto auto;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-secondary);}',
      '.cv-legend-dot{width:8px;height:8px;border-radius:2px;}',
      '.cv-legend-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-legend-pct,.cv-legend-val{font-variant-numeric:tabular-nums;}',
      '.cv-legend-val{min-width:24px;text-align:right;color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.cv-bars{display:flex;flex-direction:column;gap:5px;}',
      '.cv-bar-item{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:7px;padding:2px 0;}',
      '.cv-bar-name{font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.cv-bar-val{font-size:11px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);}',
      '.cv-bar-track{grid-column:1 / -1;height:5px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;}',
      '.cv-bar-track>i{display:block;height:100%;border-radius:999px;transition:width .3s ease;}',
      '.cv-chat{display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;padding-right:2px;}',
      '.cv-msg{display:flex;}',
      '.cv-msg.user{justify-content:flex-end;}',
      '.cv-bubble{max-width:88%;padding:7px 10px;border-radius:10px;font-size:12px;line-height:1.5;background:var(--dsw-alias-bg-layer-2);white-space:pre-wrap;word-break:break-word;}',
      '.cv-msg.user .cv-bubble{background:var(--cv-accent);color:var(--dsw-alias-brand-on-primary,#fff);}',
      '.cv-pick{margin-top:7px;padding-top:6px;border-top:1px dashed var(--dsw-alias-border-l1);}',
      '.cv-suggest{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;}',
      '.cv-suggest button{padding:2px 9px;border-radius:999px;border:1px dashed var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer;}',
      '.cv-suggest button:hover{border-color:var(--cv-accent);color:var(--cv-accent);}',
      '.cv-composer{display:flex;gap:7px;align-items:flex-end;margin-top:8px;}',
      '.cv-textarea{flex:1;min-height:34px;max-height:100px;resize:vertical;padding:6px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:inherit;font:inherit;font-size:12px;line-height:1.45;}',
      '.cv-textarea:focus{outline:2px solid var(--cv-accent);outline-offset:1px;}',
      '.cv-tools{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:8px;}',
      '.cv-input{flex:1 1 150px;height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:inherit;font:inherit;font-size:11.5px;}',
      '.cv-input:focus{outline:2px solid var(--cv-accent);outline-offset:1px;}',
      '.cv-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;}',
      '.cv-seg button{height:26px;padding:0 9px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer;}',
      '.cv-seg button[data-on=true]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600;}',
      '.cv-form{display:grid;grid-template-columns:72px minmax(0,1fr);gap:8px 9px;align-items:center;font-size:11.5px;}',
      '.cv-form-label{font-size:11px;color:var(--dsw-alias-label-secondary);}',
      '.cv-select,.cv-form input[type=number]{height:26px;padding:0 8px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:inherit;font:inherit;font-size:11.5px;}',
      '.cv-dl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;font-size:11.5px;margin:0;}',
      '.cv-dl dt{color:var(--dsw-alias-label-secondary);}',
      '.cv-dl dd{margin:0;text-align:right;font-variant-numeric:tabular-nums;}',
      '.cv-note{font-size:11px;line-height:1.45;color:var(--dsw-alias-label-tertiary);}',
      '.cv-err{font-size:11px;line-height:1.45;color:var(--dsw-alias-state-error-primary,#c92a2a);}',
      '.cv-warn{font-size:11px;line-height:1.45;color:var(--dsw-alias-state-warn-primary,#b35c00);}',
      '.cv-hero{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}',
      '.cv-hero b{font-size:26px;font-weight:650;letter-spacing:-.5px;font-variant-numeric:tabular-nums;}',
      '.cv-hero span{font-size:11.5px;color:var(--dsw-alias-label-secondary);}',
      '@media (max-width:480px){.cv-head h1{font-size:16.5px;}.cv-kpi-value{font-size:21px;}.cv-grid3,.cv-grid4{grid-template-columns:repeat(2,minmax(0,1fr));}}',
    ].join('')

    let stylesInjected = false
    function ensureStyles() {
      if (stylesInjected || typeof document === 'undefined') return
      stylesInjected = true
      const el = document.createElement('style')
      el.dataset.curator = 'client'
      el.textContent = CSS + CV_CSS
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

    // One button, three weights: primary carries the action the panel wants
    // the reader to take, ghost is neutral, danger deletes something.
    function Button(props) {
      const variant = props.variant || 'ghost'
      const className = [
        'cv-btn',
        variant === 'primary' ? 'primary' : '',
        variant === 'danger' ? 'danger' : '',
        variant === 'wide' ? 'wide' : '',
      ].filter(Boolean).join(' ')
      return h('button', {
        type: 'button',
        className,
        disabled: props.disabled === true,
        title: props.title || undefined,
        'aria-label': props.label || undefined,
        onClick: props.disabled === true ? undefined : props.onClick,
      }, props.children)
    }

    function Switch(props) {
      return h('button', {
        type: 'button',
        className: 'pc-switch',
        'data-on': props.checked === true ? 'true' : 'false',
        'aria-pressed': props.checked === true ? 'true' : 'false',
        'aria-label': props.title || '',
        title: props.title || '',
        onClick: props.onToggle,
      }, h('i', null))
    }

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

    // The dashboard charts are hand-written SVG on purpose: the client ships as a
    // single bundled file, so pulling in a chart library would mean another build
    // dependency, and the host theme is expressed as CSS variables that an SVG
    // inherits for free.
    const CHART_TONES = [
      'var(--dsw-alias-brand-primary)',
      'var(--dsw-alias-state-success-primary,#2f9e44)',
      'var(--dsw-alias-border-l1)',
      'var(--dsw-alias-label-tertiary)',
    ]

    // A tiny bar chart for the recent days. Bars are normalised to the busiest
    // day so a quiet week still reads as a shape instead of four flat stubs.
    function Spark(props) {
      const { values, height = 16, width = 5 } = props
      const max = Math.max(1, ...values.map((value) => Number(value) || 0))
      return h('div', { className: 'cv-spark', style: { height: height + 'px' }, 'aria-hidden': 'true' },
        values.map((value, index) => {
          const share = (Number(value) || 0) / max
          const tall = Math.max(2, Math.round(share * height))
          return h('i', { key: index, style: { height: tall + 'px', width: width + 'px', opacity: 0.35 + share * 0.65 } })
        }))
    }

    /**
     * One headline number. The value carries the reading, the foot line says
     * what it is measured against so the number is never bare.
     */
    function Kpi(props) {
      const { label, value, unit, foot, delta, spark, onPick } = props
      const tone = delta === null || delta === undefined || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down'
      const arrow = tone === 'up' ? '▲' : tone === 'down' ? '▼' : '='
      const body = [
        h('span', { key: 'label', className: 'cv-kpi-label' }, label),
        h('span', { key: 'value', className: 'cv-kpi-value' },
          String(value),
          unit ? h('span', { className: 'cv-kpi-unit' }, unit) : null),
        delta === null || delta === undefined
          ? (foot ? h('span', { key: 'foot', className: 'cv-kpi-foot' }, foot) : null)
          : h('span', { key: 'foot', className: 'cv-kpi-foot' },
            h('span', { className: 'cv-delta ' + tone }, arrow + ' ' + Math.abs(delta)),
            foot ? h('span', null, foot) : null),
        spark && spark.length > 1 ? h(Spark, { key: 'spark', values: spark }) : null,
      ]
      if (typeof onPick !== 'function') return h('div', { className: 'cv-kpi' }, body)
      return h('button', {
        type: 'button',
        className: 'cv-kpi',
        style: { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' },
        onClick: onPick,
      }, body)
    }

    /** Plain label/value tile with an optional meter, used for slower facts. */
    function Tile(props) {
      const { label, main, sub, meter, meterColor, onPick } = props
      const body = [
        h('span', { key: 'label', className: 'cv-tile-label' }, label),
        h('span', { key: 'main', className: 'cv-tile-main' }, main),
        meter === null || meter === undefined
          ? null
          : h('div', { key: 'meter', className: 'cv-bar' },
            h('i', { style: { width: Math.max(0, Math.min(100, meter * 100)) + '%', background: meterColor || undefined } })),
        sub ? h('span', { key: 'sub', className: 'cv-tile-sub' }, sub) : null,
      ]
      if (typeof onPick !== 'function') {
        return h('div', { className: 'cv-tile' }, h('div', { className: 'cv-tile-body' }, body))
      }
      return h('button', {
        type: 'button',
        className: 'cv-tile',
        style: { textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' },
        onClick: onPick,
      }, h('div', { className: 'cv-tile-body' }, body))
    }

    /** Ring chart. Slices are drawn with dash offsets, so no chart library. */
    function Donut(props) {
      const { slices, size = 78, stroke = 11, centerValue, centerLabel, onPick } = props
      const live = slices.filter((slice) => (Number(slice.value) || 0) > 0)
      const total = live.reduce((sum, slice) => sum + (Number(slice.value) || 0), 0)
      const radius = (size - stroke) / 2
      const circumference = 2 * Math.PI * radius
      let offset = 0
      const rings = live.map((slice, index) => {
        const share = total > 0 ? (Number(slice.value) || 0) / total : 0
        const dash = share * circumference
        const ring = h('circle', {
          key: index,
          cx: size / 2,
          cy: size / 2,
          r: radius,
          fill: 'none',
          stroke: slice.color,
          strokeWidth: stroke,
          strokeDasharray: dash + ' ' + Math.max(0, circumference - dash),
          strokeDashoffset: -offset,
          transform: 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')',
        })
        offset += dash
        return ring
      })
      return h('div', { className: 'cv-donut' },
        h('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, role: 'img', 'aria-label': String(centerLabel || '') },
          h('circle', { cx: size / 2, cy: size / 2, r: radius, fill: 'none', stroke: 'var(--dsw-alias-bg-layer-2)', strokeWidth: stroke }),
          rings,
          centerValue === undefined || centerValue === null
            ? null
            : h('text', { x: '50%', y: '50%', textAnchor: 'middle', dominantBaseline: 'central', className: 'cv-donut-num' }, String(centerValue)),
          centerLabel ? h('text', { x: '50%', y: '66%', textAnchor: 'middle', className: 'cv-donut-lab' }, centerLabel) : null),
        h('div', { className: 'cv-legend' },
          slices.map((slice, index) => {
            const share = total > 0 ? Math.round(((Number(slice.value) || 0) / total) * 100) : 0
            const row = [
              h('span', { key: 'dot', className: 'cv-legend-dot', style: { background: slice.color } }),
              h('span', { key: 'name', className: 'cv-legend-name' }, slice.label),
              h('span', { key: 'pct', className: 'cv-legend-pct' }, share + '%'),
              h('span', { key: 'val', className: 'cv-legend-val' }, String(slice.value)),
            ]
            return typeof onPick === 'function'
              ? h('button', {
                key: index,
                type: 'button',
                className: 'cv-legend-row',
                style: { border: 0, background: 'transparent', font: 'inherit', color: 'inherit', cursor: 'pointer', padding: 0, textAlign: 'left' },
                onClick: () => onPick(slice),
              }, row)
              : h('div', { key: index, className: 'cv-legend-row' }, row)
          })))
    }

    /** Ranked horizontal bars; a row can be a shortcut into the detail below. */
    function BarList(props) {
      const { items, color, max } = props
      const top = max === undefined ? Math.max(1, ...items.map((item) => Number(item.value) || 0)) : max
      return h('div', { className: 'cv-bars' },
        items.map((item, index) => {
          const share = top > 0 ? Math.max(0.02, (Number(item.value) || 0) / top) : 0
          const body = [
            h('span', { key: 'name', className: 'cv-bar-name', title: item.hint || item.label }, item.label),
            h('span', { key: 'val', className: 'cv-bar-val' }, item.display === undefined ? String(item.value) : item.display),
            h('div', { key: 'track', className: 'cv-bar-track' },
              h('i', { style: { width: share * 100 + '%', background: item.color || color || 'var(--cv-accent)' } })),
          ]
          if (typeof item.onPick !== 'function') return h('div', { key: index, className: 'cv-bar-item' }, body)
          return h('button', {
            key: index,
            type: 'button',
            className: 'cv-bar-item',
            style: { border: 0, background: 'transparent', font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' },
            onClick: item.onPick,
          }, body)
        }))
    }

    /** Card shell: a title, an optional count, a note, and a body. */
    function Panel(props) {
      const { title, count, note, sub, children, id, tone } = props
      return h('section', { className: 'cv-card' + (tone ? ' ' + tone : ''), id },
        h('div', { className: 'cv-card-head' },
          h('h3', null, title),
          count === undefined || count === null ? null : h('span', { className: 'cv-card-count' }, String(count)),
          note ? h('span', { className: 'cv-card-note' }, note) : null),
        sub ? h('p', { className: 'cv-card-sub' }, sub) : null,
        children)
    }

    function Bare(props) {
      const { title, count, note, sub, children } = props
      return h('div', null,
        h('div', { className: 'cv-card-head' },
          h('h3', null, title),
          count === undefined || count === null ? null : h('span', { className: 'cv-card-count' }, String(count)),
          note ? h('span', { className: 'cv-card-note' }, note) : null),
        sub ? h('p', { className: 'cv-card-sub' }, sub) : null,
        children)
    }

    function EmptyBox(props) {
      return h('div', { className: 'cv-empty', role: 'status' },
        h('b', null, props.title),
        props.hint ? h('span', null, props.hint) : null)
    }

    function Chips(props) {
      return h('div', { className: 'pc-chips' },
        (props.items || []).map((item, index) => h('span', {
          key: index,
          className: 'pc-chip' + (item.tone ? ' ' + item.tone : ''),
        }, item.label)))
    }

    /** Left rail of the wide layout: one row per block, count on the right. */
    function Rail(props) {
      const { items, active, onPick, foot } = props
      return h('nav', { className: 'cv-side', 'aria-label': props.label || '' },
        items.map((item) => h('button', {
          key: item.key,
          type: 'button',
          className: 'cv-side-item',
          'data-on': active === item.key ? 'true' : 'false',
          'aria-current': active === item.key ? 'true' : 'false',
          onClick: () => onPick(item.key),
        },
          h('span', null, item.label),
          item.count === undefined || item.count === null ? null : h('b', null, String(item.count)))),
        foot ? h('div', { className: 'cv-note', style: { marginTop: '10px', paddingLeft: '10px' } }, foot) : null)
    }

    /** A recommendation, collapsed to one line until the reader asks for more. */
    function RecRow(props) {
      const { item, t, chinese, busy, stage, open, onToggle, onInstall, onDismiss } = props
      const title = pickText(item.title, chinese) || item.name
      const description = (chinese && item.descriptionZh) ? item.descriptionZh : pickText(item.description, chinese)
      const reasons = (item.reasons ?? []).map((reason) => pickText(reason, chinese)).filter(Boolean)
      const installing = busy === 'install:' + item.id
      const sub = reasons.length > 0 ? reasons[0] : description
      const tags = []
      if (item.verified) tags.push({ label: t('verified'), tone: 'ok' })
      if (item.modelPick) tags.push({ label: t('aiChip'), tone: 'warn' })
      if (item.forced) tags.push({ label: t('classChip'), tone: 'warn' })
      if (item.tier === 'new') tags.push({ label: t('tierNew'), tone: 'warn' })
      return h('div', { className: 'cv-rec', id: 'pc-rec-' + item.id, 'data-open': open ? 'true' : 'false' },
        h('div', { className: 'pc-score', style: { fontSize: '17px', minWidth: '32px' } }, String(item.score),
          h('small', { style: { fontSize: '9px' } }, chinese ? '匹配' : 'fit')),
        h('div', { className: 'cv-rec-main' },
          h('div', { className: 'cv-rec-title', title: item.name }, title),
          h('div', { className: 'cv-rec-sub', title: sub || '' }, sub || t('mNoSignal')),
          tags.length === 0 ? null : h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' } },
            tags.map((tag, index) => h('span', { key: index, className: 'cv-tag' + (tag.tone ? ' ' + tag.tone : '') }, tag.label)))),
        h('div', { className: 'cv-rec-ops' },
          h('button', {
            type: 'button',
            className: 'cv-rec-more',
            'aria-expanded': open ? 'true' : 'false',
            'aria-label': open ? t('cvCollapse') : t('cvDetail'),
            title: open ? t('cvCollapse') : t('cvDetail'),
            onClick: () => onToggle(item.id),
          }, open ? '▲' : '▼'),
          h('button', {
            type: 'button',
            className: 'cv-btn primary',
            disabled: busy !== '',
            onClick: () => onInstall(item),
          }, installing
            ? t('installing') + (stage !== '' ? ' · ' + stage : '')
            : t('install'))),
        open
          ? h('div', { style: { gridColumn: '1 / -1', borderTop: '1px solid var(--dsw-alias-border-l1)', marginTop: '4px', paddingTop: '8px' } },
            description ? h('div', { className: 'pc-desc', style: { whiteSpace: 'normal' } }, description) : null,
            reasons.length === 0 ? null : h('div', { style: { display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' } },
              reasons.map((label, index) => h('span', { key: index, className: 'cv-tag' }, label))),
            metricsFor(item, t, chinese).length === 0 ? null : h('div', { className: 'pc-metrics' },
              metricsFor(item, t, chinese).map((metric, index) => h('span', { key: index, className: 'pc-metric' }, metric))),
            item.install ? h(CopyCommand, { label: t('howInstall'), command: item.install.command, copyLabel: t('copy'), copiedLabel: t('copied') }) : null,
            item.use ? h('div', { className: 'pc-line', style: { alignItems: 'flex-start' } },
              h('b', null, t('howUse') + ':'), h('span', { style: { whiteSpace: 'normal' } }, pickText(item.use, chinese))) : null,
            h('div', { style: { display: 'flex', gap: '6px', marginTop: '8px' } },
              h('button', { type: 'button', className: 'cv-btn', disabled: busy !== '', onClick: () => onDismiss(item.id) }, t('dismiss'))))
          : null)
    }

    /** Installed bundle as a dense row: state on the left, controls on the right. */
    function InstRow(props) {
      const { item, t, chinese, busy, confirming, onToggle, onRemove, onConfirm } = props
      const title = pickText(item.titleI18n, chinese) || item.title || item.name
      const tone = item.status === 'active' ? 'ok' : item.status === 'watching' ? '' : 'warn'
      const label = item.status === 'active' ? t('active') : item.status === 'watching' ? t('watching') : t('unused')
      const tools = (item.tools ?? []).slice(0, 3).map((tool) => tool.name + ' ' + tool.calls).join(' · ')
      const toggling = busy === 'toggle:' + item.name
      return h('div', { className: 'cv-rec' },
        h('span', { className: 'cv-tag ' + tone, style: { minWidth: '40px', justifyContent: 'center' } }, label),
        h('div', { className: 'cv-rec-main' },
          h('div', { className: 'cv-rec-title', title: item.name }, title),
          h('div', { className: 'cv-rec-sub', title: tools }, numberFmt(item.calls ?? 0, chinese) + ' ' + t('installedCalls') + (tools ? ' · ' + tools : ''))),
        h('div', { className: 'cv-rec-ops' },
          item.update ? h('span', { className: 'cv-tag warn' }, item.update.latest) : null,
          item.removable
            ? h('button', {
              type: 'button',
              className: 'cv-btn danger',
              disabled: busy !== '',
              onClick: () => (confirming === item.name ? onRemove(item.name) : onConfirm(item.name)),
            }, confirming === item.name ? t('confirmRemove') : t('remove'))
            : null,
          h(Switch, {
            checked: item.enabled === true,
            title: item.enabled ? t('disable') : t('enable'),
            onToggle: () => { if (!toggling) onToggle(item.name, !item.enabled) },
          })))
    }

    function IdleRow(props) {
      const { item, t, chinese, busy, onRemove, onSnooze } = props
      return h('div', { className: 'cv-rec' },
        h('span', { className: 'cv-tag warn' }, String(item.daysInactive ?? '?') + 'd'),
        h('div', { className: 'cv-rec-main' },
          h('div', { className: 'cv-rec-title' }, item.title || item.name),
          h('div', { className: 'cv-rec-sub' }, item.reason ? pickText(item.reason, chinese) : fill(t('daysAgo'), { n: item.daysInactive }))),
        h('div', { className: 'cv-rec-ops' },
          h('button', { type: 'button', className: 'cv-btn', disabled: busy !== '', onClick: () => onSnooze(item.name) }, t('snooze')),
          h('button', { type: 'button', className: 'cv-btn danger', disabled: busy !== '', onClick: () => onRemove(item.name) }, t('remove'))))
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
      const [view, setView] = React.useState('overview')
      const [openRec, setOpenRec] = React.useState('')
      const [installedQuery, setInstalledQuery] = React.useState('')
      const [installedSort, setInstalledSort] = React.useState('calls')
      const [installedFilter, setInstalledFilter] = React.useState('all')
      const [messages, setMessages] = React.useState([])
      const [draft, setDraft] = React.useState('')
      const [sending, setSending] = React.useState(false)
      const [busyFor, setBusyFor] = React.useState(0)
      const [dismissedLocal, setDismissedLocal] = React.useState([])
      const [accordion, setAccordion] = React.useState('')
      const [explainQuery, setExplainQuery] = React.useState('')
      const [explainBusy, setExplainBusy] = React.useState(false)
      const [explainAnswer, setExplainAnswer] = React.useState(null)
      const [explainError, setExplainError] = React.useState('')

      // The whole snapshot now rides on one request: the KPI band is shared by
      // every section, so a per-section slice would only save bytes and then
      // force a refetch the moment the reader switches section.
      const etagRef = React.useRef({ tab: 'all', value: '' })

      const load = React.useCallback(async () => {
        try {
          const headers = {}
          if (etagRef.current.value !== '') headers['if-none-match'] = etagRef.current.value
          const response = await fetch(API_STATE + '?tab=insight', {
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
          if (typeof etag === 'string' && etag !== '') etagRef.current = { tab: 'all', value: etag }
          setData(body.value)
          setError('')
        } catch (cause) {
          setError(String(cause && cause.message ? cause.message : cause))
        }
      }, [t])

      React.useEffect(() => {
        ensureStyles()
        void load()
        // Poll slowly while idle; fast enough while an action is in flight that
        // the stage events the host writes reach the button.
        const period = busy === '' ? 45_000 : 1_500
        const timer = setInterval(() => { void load() }, period)
        return () => clearInterval(timer)
      }, [load, busy])

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

      const askExplain = React.useCallback(async (raw) => {
        const needle = String(raw ?? '').trim()
        if (needle === '' || explainBusy) return
        setExplainBusy(true)
        setExplainError('')
        try {
          const response = await fetch(API_EXPLAIN + '?q=' + encodeURIComponent(needle), { credentials: 'same-origin' })
          const body = await response.json().catch(() => null)
          if (!body || body.ok !== true) throw new Error(body && body.error ? body.error : 'failed')
          setExplainAnswer(body.value)
        } catch (failure) {
          setExplainError(String(failure && failure.message ? failure.message : failure))
          setExplainAnswer(null)
        } finally {
          setExplainBusy(false)
        }
      }, [explainBusy])

      /** Install straight from a row: the server validates the spec itself. */
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
        return h('div', { className: 'cv' },
          h(EmptyBox, { title: error }),
          h('button', { type: 'button', className: 'cv-btn wide', onClick: () => { setError(''); void load() } }, t('refresh')))
      }
      if (data === null) {
        return h('div', { className: 'cv' }, h(EmptyBox, { title: t('loading') }))
      }

      const groupLabel = (tag, translate) => {
        const key = groupKey(tag)
        const label = translate(key)
        return label === key ? tag : label
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

      const hiddenLocal = new Set(dismissedLocal)
      const recommendations = (data.recommendations || []).filter(
        (item) => !isInstalled(item) && !hiddenLocal.has(item.id),
      )
      const idle = data.idle || []
      const gaps = (data.gaps || []).map((gap) => ({
        ...gap,
        suggestions: (gap.suggestions || []).filter((item) => !isInstalled(item) && !hiddenLocal.has(item.id)),
      }))
      const diff = data.diff
      const conflicts = data.conflicts || []
      const coverage = data.coverage || {}
      const totals = data.totals || {}
      const settings = data.settings || {}
      const profile = data.profile || {}
      const sources = (coverage.sources || data.sourceStatus || [])
      const days = profile.windowDays || 7

      const statusCount = (want) => installed.filter((item) => item.status === want).length
      const activeCount = statusCount('active')
      const watchingCount = statusCount('watching')
      const unusedCount = statusCount('unused')
      const installedCount = Number(totals.installed ?? installed.length) || 0
      const recCount = Number(totals.recommendations ?? recommendations.length) || 0
      const callsTotal = Number(totals.calls7 ?? profile.totalCalls ?? 0) || 0
      const aiPicks = recommendations.filter(
        (item) => item.modelPick === true || (item.reasons ?? []).some((reason) => reason?.code === 'model-pick'),
      ).length
      const latestRun = data.generatedAt ? new Date(data.generatedAt) : null
      const prevRun = data.prevAt ? new Date(data.prevAt) : null
      // The host only keeps today and the last run, so a delta is shown only
      // when both numbers exist. A missing baseline reads as "unchanged".
      const prevTotals = data.prevTotals || null
      const deltaOf = (now, before) => {
        if (prevTotals === null || before === undefined || before === null) return null
        return (Number(now) || 0) - (Number(before) || 0)
      }
      const idleDelta = deltaOf(installedCount - activeCount, prevTotals && prevTotals.installed !== undefined ? prevTotals.installed - (prevTotals.active ?? 0) : null)
      const recDelta = deltaOf(recCount, prevTotals ? prevTotals.recommendations : null)
      const callsDelta = deltaOf(callsTotal, prevTotals ? prevTotals.calls : null)

      const topTools = (profile.topTools || []).slice(0, 4).map((tool) => ({
        label: pickText(tool.name, chinese) || String(tool.name || ''),
        value: Number(tool.calls) || 0,
        display: numberFmt(tool.calls, chinese),
      }))

      const scored = [...recommendations].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      const scoreItems = scored.slice(0, 6).map((item) => ({
        label: pickText(item.title, chinese) || item.name,
        hint: item.name,
        value: Number(item.score) || 0,
        display: String(Number(item.score) || 0),
        color: (Number(item.score) || 0) >= 60 ? CHART_TONES[0] : CHART_TONES[1],
        onPick: () => {
          setView('recs')
          setOpenRec(item.id)
          setTimeout(() => {
            const node = typeof document === 'undefined' ? null : document.getElementById('pc-rec-' + item.id)
            if (node === null) return
            if (typeof node.scrollIntoView === 'function') node.scrollIntoView({ behavior: 'smooth', block: 'center' })
            node.setAttribute('data-flag', 'true')
            setTimeout(() => node.removeAttribute('data-flag'), 1600)
          }, 40)
        },
      }))

      const sourceItems = sources.map((source) => ({
        label: source.kind === 'official' ? t('chartOfficial')
          : String(source.kind ?? '').startsWith('npm') ? t('chartNpm')
            : source.kind === 'github' ? t('chartGithub')
              : source.kind === 'registry' ? t('chartRegistry')
                : (source.kind || source.id),
        hint: String(source.id),
        value: source.total > 0 ? Math.round((Number(source.fetched) || 0) / Number(source.total) * 100) : 0,
        display: numberFmt(source.fetched, chinese) + (source.total ? '/' + numberFmt(source.total, chinese) : ''),
        color: source.status === 'ok' ? CHART_TONES[0] : 'var(--dsw-alias-state-error-primary,#c92a2a)',
        onPick: /^https?:\/\//.test(String(source.id ?? ''))
          ? () => { if (typeof window !== 'undefined') window.open(source.id, '_blank', 'noopener') }
          : undefined,
      }))

      // ---- pieces shared by every section ------------------------------
      const kpis = h('div', { className: 'cv-grid4', role: 'group', 'aria-label': t('statsLabel') },
        h(Kpi, {
          label: t('statsRecommend'),
          value: numberFmt(recCount, chinese),
          foot: fill(t('statRecommendSub'), { n: aiPicks }),
          delta: recDelta,
        }),
        h(Kpi, {
          label: t('statsInstalled'),
          value: numberFmt(installedCount, chinese),
          foot: fill(t('statInstalledSub'), { active: activeCount, unused: unusedCount }),
          onPick: () => setView('installed'),
        }),
        h(Kpi, {
          label: t('statsCalls'),
          value: numberFmt(callsTotal, chinese),
          foot: fill(t('statCallsSub'), { n: installed.filter((item) => (Number(item.calls) || 0) > 0).length }),
          delta: callsDelta,
        }),
        h(Kpi, {
          label: t('statsGap'),
          value: numberFmt(gaps.length, chinese),
          foot: gaps.length === 0
            ? t('gapEmpty')
            : gaps.slice(0, 2).map((gap) => pickText(gap.label, chinese)).join(' · '),
          onPick: () => setView('gaps'),
        }))

      const head = h('div', { className: 'cv-head' },
        h('div', { style: { minWidth: 0 } },
          h('h1', null, t('title')),
          h('p', null, t('subtitle')),
          h('div', { className: 'cv-meta' },
            h('span', null, (latestRun ? t('updated') + ' ' + clock(data.generatedAt, chinese) : t('never'))),
            data.nextRunAt ? h('span', null, t('nextRun') + ' ' + clock(data.nextRunAt, chinese)) : null,
            running ? h('span', { style: { color: 'var(--cv-accent)' } }, t('refreshing') + ' ' + busyFor + 's') : null)),
        h('div', { className: 'cv-head-actions' },
          h('button', { type: 'button', className: 'cv-chip', disabled: busy !== '', onClick: () => act('rotate', {}, t('rotated')) },
            busy === 'rotate' ? t('rotating') : t('rotate')),
          h('button', { type: 'button', className: 'cv-chip primary', disabled: busy !== '', onClick: () => act('refresh', {}, t('refresh')) },
            busy === 'refresh' ? t('refreshing') + '…' : t('refresh'))))

      const railItems = [
        { key: 'overview', label: t('railOverview'), count: null },
        { key: 'recs', label: t('railRecs'), count: recommendations.length },
        { key: 'installed', label: t('railInstalled'), count: installedCount },
        { key: 'insight', label: t('railInsight'), count: null },
        { key: 'gaps', label: t('railGap'), count: gaps.length },
      ]

      const usageDonut = h(Donut, {
        slices: [
          { label: t('chartActive'), value: activeCount, color: CHART_TONES[0] },
          { label: t('chartWatching'), value: watchingCount, color: CHART_TONES[1] },
          { label: t('chartUnused'), value: unusedCount, color: CHART_TONES[2] },
        ],
        centerValue: String(activeCount),
        centerLabel: t('chartActive'),
        onPick: () => setView('installed'),
      })

      const healthItems = []
      if (unusedCount > 0) healthItems.push({ tone: 'warn', text: fill(t('cvHealthIdle'), { n: unusedCount }), go: 'installed' })
      if (conflicts.length > 0) healthItems.push({ tone: 'warn', text: fill(t('cvHealthConflict'), { n: conflicts.length }), go: 'insight' })
      if (data.modelStatus && data.modelStatus.ok === false) {
        healthItems.push({ tone: 'warn', text: fill(t('cvHealthModel'), { reason: String(data.modelStatus.reason || 'unknown') }), go: 'insight' })
      }
      const badSources = sources.filter((source) => source.status !== 'ok')
      if (badSources.length > 0) healthItems.push({ tone: 'warn', text: fill(t('cvHealthSource'), { n: badSources.length }), go: 'insight' })

      const healthCard = h(Panel, { title: t('cvHealth'), count: healthItems.length === 0 ? undefined : healthItems.length },
        healthItems.length === 0
          ? h(EmptyBox, { title: t('cvHealthGood') })
          : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } },
            healthItems.map((item, index) => h('button', {
              key: index,
              type: 'button',
              className: 'cv-bar-item',
              style: { border: 0, background: 'transparent', font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left', gridTemplateColumns: 'minmax(0,1fr)' },
              onClick: () => setView(item.go),
            }, h('span', { className: 'cv-warn' }, '· ' + item.text)))))

      const topCard = h(Panel, { title: t('cvTop'), note: fill(t('chartUsageHint'), { days }) },
        topTools.length === 0
          ? h(EmptyBox, { title: fill(t('cvTopEmpty'), { days }) })
          : h(BarList, { items: topTools }))

      const adhocCard = h(Panel, { title: t('chartSourceTitle'), note: t('chartSourceHint') },
        sourceItems.length === 0
          ? h(EmptyBox, { title: t('chartSourceEmpty') })
          : h(BarList, { items: sourceItems }))

      const modelCard = (() => {
        const catalog = settingsValue && settingsValue.catalog
        if (!catalog || catalog.available !== true) return null
        const picked = settings.model || {}
        const provider = (catalog.providers || []).find((entry) => entry.id === picked.provider)
        const chosen = provider && (provider.models || []).find((entry) => entry.id === picked.model)
        const status = data.modelStatus
        const failed = status && status.ok === false
        const reason = failed ? String(status.reason || '') : ''
        const note = reason === 'provider-missing'
          ? fill(t('modelMissing'), { p: String(status.detail || picked.provider || '') })
          : reason !== '' ? fill(t('modelFailed'), { reason }) : ''
        return h(Panel, { title: t('modelTitle') },
          h('div', { className: 'cv-rec', style: { padding: '8px 10px' } },
            h('span', { className: 'cv-tag ' + (chosen ? 'ok' : 'warn') }, chosen ? t('chartActive') : t('modelNone')),
            h('div', { className: 'cv-rec-main' },
              h('div', { className: 'cv-rec-title' }, chosen ? (chosen.name || chosen.id) : t('modelUnset')),
              h('div', { className: 'cv-rec-sub' }, provider ? (provider.name || provider.id) : '')),
            h('button', { type: 'button', className: 'cv-btn', onClick: () => { setView('insight'); setAccordion('model') } }, t('modelPick'))),
          note !== '' ? h('div', { className: 'cv-warn', style: { marginTop: '6px' } }, note) : null)
      })()

      const overviewCards = h('div', { className: 'cv-grid3' },
        topCard,
        h(Panel, { title: t('chartUsageTitle'), note: t('cvSplit') }, usageDonut),
        healthCard,
        modelCard,
        adhocCard)

      const chatCard = h(Panel, { title: t('chatTitle'), note: t('chatHint') },
        h('div', { className: 'cv-chat' },
          messages.length === 0
            ? h(EmptyBox, { title: t('chatEmpty'), hint: t('chatEmptyHint') })
            : messages.map((message, index) => h('div', { key: index, className: 'cv-msg ' + message.role },
              h('div', { className: 'cv-bubble' },
                h('div', null, message.text),
                (message.picks || []).map((pick, pickIndex) => h('div', { key: pickIndex, className: 'cv-pick' },
                  h('div', { style: { display: 'flex', gap: '6px', alignItems: 'baseline', flexWrap: 'wrap' } },
                    h('b', null, pick.name),
                    h('span', { className: 'pc-mono', style: { fontSize: '10.5px', color: 'var(--dsw-alias-label-tertiary)' } }, pick.spec)),
                  pick.why ? h('div', { style: { fontSize: '11px', marginTop: '2px' } }, pick.why) : null,
                  h('button', {
                    type: 'button',
                    className: 'cv-btn primary',
                    style: { marginTop: '5px' },
                    disabled: busy !== '',
                    onClick: () => installSpec(pick),
                  }, t('install'))))))),
        h('div', { className: 'cv-suggest' },
          [t('chatSuggest1'), t('chatSuggest2'), t('chatSuggest3')].map((suggestion, index) =>
            h('button', { key: index, type: 'button', onClick: () => { setDraft(suggestion) } }, suggestion))),
        h('div', { className: 'cv-composer' },
          h('textarea', {
            className: 'cv-textarea',
            placeholder: t('chatPlaceholder'),
            'aria-label': t('chatPlaceholder'),
            value: draft,
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendChat(draft) }
            },
          }),
          h('button', {
            type: 'button',
            className: 'cv-btn primary',
            style: { height: '32px' },
            disabled: sending || draft.trim() === '',
            onClick: () => { void sendChat(draft) },
          }, sending ? t('chatThinking') : t('chatSend')))))

      const recList = h('div', { className: 'cv-recs' },
        recommendations.length === 0
          ? h(EmptyBox, { title: t('emptyRecommend'), hint: t('emptyRecommendHint') })
          : recommendations.map((item) => h(RecRow, {
            key: item.id,
            item,
            t,
            chinese,
            busy,
            stage,
            open: openRec === item.id,
            onToggle: (id) => setOpenRec(openRec === id ? '' : id),
            onInstall: installCard,
            onDismiss: dismissCard,
          })))

      const scoreCard = h(Panel, { title: t('chartScoreTitle'), count: scoreItems.length, note: t('chartScoreHint') },
        scoreItems.length === 0 ? h(EmptyBox, { title: t('chartScoreEmpty') }) : h(BarList, { items: scoreItems }))

      const recsSection = h('div', { className: 'cv-compact' },
        chatCard,
        scoreCard,
        h(Panel, { title: t('recommendTitle'), count: recommendations.length, note: t('recommendHint') }, recList))

      // Wide layout: the list is the page, the score chart sits beside it.
      const recsWide = h('div', { className: 'cv-full' },
        h('div', { className: 'cv-cols' },
          h(Panel, { title: t('recommendTitle'), count: recommendations.length, note: t('recommendHint') }, recList),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            scoreCard,
            chatCard)))

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

      const installedSection = h('div', { className: 'cv-compact' },
        h(Panel, { title: t('installedTitle'), count: installedShown.length, note: t('installedHint') },
          h('div', { className: 'cv-tools' },
            h('input', {
              className: 'cv-input',
              type: 'search',
              value: installedQuery,
              placeholder: t('installedSearch'),
              'aria-label': t('installedSearch'),
              onChange: (event) => setInstalledQuery(event.target.value),
            }),
            h('div', { className: 'cv-seg', role: 'group', 'aria-label': t('installedSortActive') },
              [['calls', t('installedSortActive')], ['name', t('installedSortName')]].map(([key, label]) =>
                h('button', {
                  key,
                  type: 'button',
                  'data-on': installedSort === key ? 'true' : 'false',
                  'aria-pressed': installedSort === key ? 'true' : 'false',
                  onClick: () => setInstalledSort(key),
                }, label))),
            h('div', { className: 'cv-seg', role: 'group', 'aria-label': t('installedFilterAll') },
              [['all', t('installedFilterAll')], ['active', t('installedFilterActive')], ['idle', t('installedFilterIdle')]].map(([key, label]) =>
                h('button', {
                  key,
                  type: 'button',
                  'data-on': installedFilter === key ? 'true' : 'false',
                  'aria-pressed': installedFilter === key ? 'true' : 'false',
                  onClick: () => setInstalledFilter(key),
                }, label)))),
          installedShown.length === 0
            ? h(EmptyBox, {
              title: installed.length === 0 ? t('emptyInstalled') : t('installedNone'),
              hint: installed.length === 0 ? t('emptyInstalledHint') : t('installedNoneHint'),
            })
            : h('div', { className: 'cv-recs' }, installedShown.map((item) => h(InstRow, {
              key: item.name,
              item,
              t,
              chinese,
              busy,
              confirming,
              onToggle: (name, enabled) => act('toggle', { name, enabled }, enabled ? t('toggleOn') : t('toggleOff')),
              onRemove: (name) => act('remove', { name }, t('removedLive')),
              onConfirm: (name) => setConfirming(name),
            })))),
        h(Panel, { title: t('idleTitle'), count: idle.length, note: t('idleHint') },
          idle.length === 0
            ? h(EmptyBox, { title: t('emptyIdle'), hint: t('emptyIdleHint') })
            : h('div', { className: 'cv-recs' }, idle.map((item) => h(IdleRow, {
              key: item.name,
              item,
              t,
              chinese,
              busy,
              onSnooze: (name) => act('snooze', { name }, t('snoozed')),
              onRemove: (name) => act('remove', { name }, t('removedLive')),
            })))))

      const installedWide = h('div', { className: 'cv-full' },
        h('div', { className: 'cv-cols' },
          h(Panel, { title: t('installedTitle'), count: installedShown.length, note: t('installedHint') },
            h('div', { className: 'cv-tools' },
              h('input', {
                className: 'cv-input',
                type: 'search',
                value: installedQuery,
                placeholder: t('installedSearch'),
                'aria-label': t('installedSearch'),
                onChange: (event) => setInstalledQuery(event.target.value),
              }),
              h('div', { className: 'cv-seg', role: 'group', 'aria-label': t('installedSortActive') },
                [['calls', t('installedSortActive')], ['name', t('installedSortName')]].map(([key, label]) =>
                  h('button', {
                    key,
                    type: 'button',
                    'data-on': installedSort === key ? 'true' : 'false',
                    onClick: () => setInstalledSort(key),
                  }, label))),
              h('div', { className: 'cv-seg', role: 'group', 'aria-label': t('installedFilterAll') },
                [['all', t('installedFilterAll')], ['active', t('installedFilterActive')], ['idle', t('installedFilterIdle')]].map(([key, label]) =>
                  h('button', {
                    key,
                    type: 'button',
                    'data-on': installedFilter === key ? 'true' : 'false',
                    onClick: () => setInstalledFilter(key),
                  }, label)))),
            installedShown.length === 0
              ? h(EmptyBox, { title: installed.length === 0 ? t('emptyInstalled') : t('installedNone') })
              : h('div', { className: 'cv-recs' }, installedShown.map((item) => h(InstRow, {
                key: item.name,
                item,
                t,
                chinese,
                busy,
                confirming,
                onToggle: (name, enabled) => act('toggle', { name, enabled }, enabled ? t('toggleOn') : t('toggleOff')),
                onRemove: (name) => act('remove', { name }, t('removedLive')),
                onConfirm: (name) => setConfirming(name),
              })))),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            h(Panel, { title: t('chartUsageTitle'), note: t('cvSplit') }, usageDonut),
            h(Panel, { title: t('idleTitle'), count: idle.length, note: t('idleHint') },
              idle.length === 0
                ? h(EmptyBox, { title: t('emptyIdle'), hint: t('emptyIdleHint') })
                : h('div', { className: 'cv-recs' }, idle.map((item) => h(IdleRow, {
                  key: item.name,
                  item,
                  t,
                  chinese,
                  busy,
                  onSnooze: (name) => act('snooze', { name }, t('snoozed')),
                  onRemove: (name) => act('remove', { name }, t('removedLive')),
                })))))))

      const diffItems = []
      if (diff) {
        if (diff.added.length > 0) diffItems.push({ label: t('diffAdded') + ' ' + diff.added.length, tone: 'ok' })
        if (diff.dropped.length > 0) diffItems.push({ label: t('diffDropped') + ' ' + diff.dropped.length })
        if (diff.installed.length > 0) diffItems.push({ label: t('diffInstalled') + ' ' + diff.installed.length, tone: 'ok' })
        if (diff.removed.length > 0) diffItems.push({ label: t('diffRemoved') + ' ' + diff.removed.length, tone: 'warn' })
      }

      const fold = (key, title, node, count) => h(Panel, { title, count },
        h('button', {
          type: 'button',
          className: 'cv-btn wide',
          'aria-expanded': accordion === key ? 'true' : 'false',
          onClick: () => setAccordion(accordion === key ? '' : key),
        }, accordion === key ? t('cvCollapse') : t('cvDetail')),
        accordion === key ? h('div', { style: { marginTop: '9px' } }, node) : null)

      const explainNode = (() => {
        const rows = []
        if (explainError !== '') {
          rows.push(h('div', { key: 'err', className: 'cv-err' }, explainError))
        }
        if (explainAnswer !== null && explainAnswer.found !== true) {
          rows.push(h('div', { key: 'none', className: 'cv-note' }, t('explainNotFound')))
        } else if (explainAnswer !== null) {
          for (const match of explainAnswer.matches ?? []) {
            const badges = match.admitted === true
              ? [t('explainAdmitted') + ' · ' + t('explainRank') + ' ' + match.rank]
              : (match.steps ?? []).map((step) => pickText(step, chinese))
            rows.push(h('div', {
              key: match.name,
              style: { borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: '6px' },
            },
            h('div', { style: { display: 'flex', gap: '5px', alignItems: 'baseline', flexWrap: 'wrap' } },
              h('b', { style: { fontSize: '12px' } }, match.name),
              h('span', { className: 'cv-tag' }, t('explainScore') + ' ' + match.score),
              h('span', { className: 'cv-tag' }, t('explainTier') + ' ' + match.tier)),
            h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' } },
              badges.map((badge, index) => h('span', { key: index, className: 'cv-tag warn' }, badge)))))
          }
        }
        return h('div', null,
          h('p', { className: 'cv-card-sub' }, t('explainHint')),
          h('div', { className: 'cv-tools', style: { marginBottom: 0 } },
            h('input', {
              className: 'cv-input',
              type: 'search',
              value: explainQuery,
              placeholder: t('explainSearch'),
              'aria-label': t('explainSearch'),
              onChange: (event) => setExplainQuery(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter') void askExplain(explainQuery) },
            }),
            h('button', {
              type: 'button',
              className: 'cv-btn primary',
              disabled: explainBusy || explainQuery.trim() === '',
              onClick: () => { void askExplain(explainQuery) },
            }, explainBusy ? t('loading') : t('explainBtn'))),
          rows.length === 0 ? null : h('div', { style: { marginTop: '8px' } }, rows))
      })()

      const gapSuggestion = (item) => h('div', { key: item.id, className: 'cv-rec' },
        h('span', { className: 'pc-score', style: { fontSize: '14px', minWidth: '26px' } }, String(item.score)),
        h('div', { className: 'cv-rec-main' },
          h('div', { className: 'cv-rec-title' }, pickText(item.title, chinese) || item.name),
          h('div', { className: 'cv-rec-sub' }, pickText(item.description, chinese) || item.name)),
        h('button', {
          type: 'button',
          className: 'cv-btn primary',
          disabled: busy !== '',
          onClick: () => installCard(item),
        }, t('install')))

      const gapBlock = (gap) => h('div', {
        key: gap.tag,
        style: { borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: '7px' },
      },
      h('div', { style: { display: 'flex', gap: '6px', alignItems: 'baseline', flexWrap: 'wrap' } },
        h('b', { style: { fontSize: '12.5px' } }, pickText(gap.label, chinese)),
        gap.evidence ? h('span', { className: 'cv-tag' }, pickText(gap.evidence, chinese)) : null),
      (gap.suggestions ?? []).length === 0
        ? h('div', { className: 'cv-note', style: { marginTop: '4px' } }, t('gapNoPlugin'))
        : h('div', { className: 'cv-recs', style: { marginTop: '6px' } }, (gap.suggestions ?? []).map(gapSuggestion)))

      const gapsNode = gaps.length === 0
        ? h(EmptyBox, { title: t('gapEmpty'), hint: t('gapEmptyHint') })
        : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, gaps.map(gapBlock))

      const settingsNode = h(SettingsCard, {
        t,
        chinese,
        value: settingsValue,
        status: data.modelStatus,
        testing,
        onSave: saveSettings,
        onTest: testModel,
      })

      const diffCard = h(Panel, { title: t('diffTitle'), note: t('diffHint') },
        h('div', { style: { display: 'flex', gap: '5px', flexWrap: 'wrap' } },
          (diffItems.length > 0 ? diffItems : [{ label: t('diffEmpty') }]).map((item, index) =>
            h('span', { key: index, className: 'cv-tag' + (item.tone ? ' ' + item.tone : '') }, item.label))))

      const conflictPlugin = (plugin) => h('div', { key: plugin.name, style: { paddingTop: '4px' } },
        h('div', { style: { display: 'flex', gap: '5px', alignItems: 'baseline', flexWrap: 'wrap' } },
          h('span', { className: 'cv-rec-title' }, plugin.title || plugin.name),
          plugin.primary ? h('span', { className: 'cv-tag ok' }, t('overlapPrimary')) : null,
          plugin.enabled === false ? h('span', { className: 'cv-tag' }, t('disabledTag')) : null,
          h('span', { className: 'cv-tag' }, fill(t('overlapCalls'), { n: plugin.calls }))),
        (plugin.evidence ?? []).length > 0
          ? h('div', { className: 'cv-note' }, fill(t('overlapEvidenceTool'), { list: plugin.evidence.join('、') }))
          : plugin.evidenceKind === 'name' ? h('div', { className: 'cv-note' }, t('overlapEvidenceName')) : null)

      const conflictBlock = (conflict, index) => h('div', {
        key: conflict.tag,
        style: index === 0 ? null : { borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: '7px', marginTop: '7px' },
      },
      h('div', { style: { display: 'flex', gap: '6px', alignItems: 'baseline' } },
        h('b', { style: { fontSize: '12.5px' } }, groupLabel(conflict.tag, t)),
        h('span', { className: 'cv-tag' }, fill(t('overlapCount'), { n: (conflict.plugins ?? []).length }))),
      conflict.reason ? h('div', { className: 'cv-card-sub' }, pickText(conflict.reason, chinese)) : null,
      (conflict.plugins ?? []).map(conflictPlugin))

      const conflictsCard = conflicts.length === 0 ? null : h(Panel, {
        title: t('conflictsTitle'),
        count: conflicts.length,
        note: t('conflictsHint'),
      }, conflicts.map(conflictBlock))

      const sourcesNode = h(BarList, { items: sourceItems })

      const insightSection = h('div', { className: 'cv-compact' },
        diffCard,
        conflictsCard,
        fold('explain', t('explainTitle'), explainNode),
        fold('gaps', t('gapsTitle'), gapsNode, gaps.length),
        fold('model', t('modelTitle'), settingsNode),
        fold('sources', t('coverageTitle'), h('div', null,
          h('p', { className: 'cv-card-sub' }, t('coverageHint')),
          sourcesNode)))

      const insightWide = h('div', { className: 'cv-full' },
        h('div', { className: 'cv-cols' },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            diffCard,
            h(Panel, { title: t('explainTitle') }, explainNode),
            h(Panel, { title: t('gapsTitle'), count: gaps.length }, gapsNode)),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
            h(Panel, { title: t('modelTitle') }, settingsNode),
            h(Panel, { title: t('coverageTitle'), note: t('coverageHint') }, sourcesNode),
            conflictsCard)))

      const gapsSection = h(Panel, { title: t('gapsTitle'), count: gaps.length, note: t('gapsHint') }, gapsNode)

      const body =
        view === 'recs' ? [recsSection, recsWide]
          : view === 'installed' ? [installedSection, installedWide]
            : view === 'insight' ? [insightSection, insightWide]
              : view === 'gaps' ? [gapsSection]
                : [overviewCards]

      const toastCard = toast === null ? null : h('div', {
        className: 'cv-note',
        role: 'status',
        style: {
          position: 'sticky',
          bottom: 0,
          marginTop: '2px',
          padding: '7px 10px',
          borderRadius: '9px',
          background: 'var(--dsw-alias-bg-layer-2)',
          color: toast.kind === 'err' ? 'var(--dsw-alias-state-error-primary,#c92a2a)' : 'inherit',
          boxShadow: '0 4px 14px rgba(0,0,0,.10)',
        },
      }, toast.text)

      return h('div', { className: 'cv' },
        head,
        kpis,
        h('div', { className: 'cv-body' },
          h(Rail, {
            items: railItems,
            active: view,
            onPick: setView,
            label: t('tabsLabel'),
            foot: t('cvPanelHint'),
          }),
          h('main', { className: 'cv-main', id: 'pc-panel-' + view, role: 'tabpanel' }, body)),
        toastCard)
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
