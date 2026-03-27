import { Button, Card, Layout, Modal, Tag } from '@douyinfe/semi-ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import './App.css'
import { AccountDrawer } from './components/AccountDrawer'
import { AccountsWorkspace } from './components/AccountsWorkspace'
import { OverviewDashboard } from './components/OverviewDashboard'
import { PageIntro } from './components/PageIntro'
import { SidebarNav } from './components/SidebarNav'
import { demoBaseUrl, demoCodexRecords } from './data/demo'
import {
  applyCodexMetadata,
  collectCleanupCandidateNames,
  deriveCodexRecord,
  filterCodexRecords,
  formatGroupLabel,
} from './lib/codex'
import { clearSessionConfig, loadSessionConfig, saveSessionConfig } from './lib/session'
import { loadThemeMode, resolveTheme, saveThemeMode, type ThemeMode } from './lib/theme'
import { LoginPage } from './pages/LoginPage'
import {
  deleteAuthFile,
  downloadAuthJson,
  fetchCodexRecords,
  probeConnection,
  saveAuthJson,
  setAuthDisabled,
} from './services/cpa'
import type { CodexAuthRecord, CodexSessionConfig } from './types/codex'

type ViewKey = 'overview' | 'accounts' | 'cleanup' | 'settings'
export type ListFilter = 'all' | 'team' | 'free' | 'cleanup' | 'disabled' | `group:${string}`

const themeOrder: ThemeMode[] = ['auto', 'light', 'dark']
const themeModeLabels: Record<ThemeMode, string> = {
  auto: '跟随系统',
  light: '浅色',
  dark: '深色',
}

const issueLabels: Record<string, string> = {
  'token-revoked': '令牌已失效',
  'refresh-token-reused': '刷新令牌已复用',
  unauthorized: '访问未授权',
  'payment-required': '订阅状态异常',
  'not-found': '账号记录缺失',
  'status-warning': '状态待确认',
}

function App() {
  const { Sider, Content, Header } = Layout
  const [session, setSession] = useState<CodexSessionConfig | null>(() => loadSessionConfig())
  const [view, setView] = useState<ViewKey>('overview')
  const [records, setRecords] = useState<CodexAuthRecord[]>(demoCodexRecords)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<ListFilter>('all')
  const [groupDraft, setGroupDraft] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'create' | null>(null)
  const [activeRecord, setActiveRecord] = useState<CodexAuthRecord | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode())
  const [prefersDark, setPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  )
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Debounce search input to avoid re-filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const activeFilter = view === 'cleanup' ? 'cleanup' : filter
  const resolvedTheme = useMemo(() => resolveTheme(themeMode, prefersDark), [themeMode, prefersDark])
  const contextTarget = useMemo(() => session?.baseUrl.replace(/^https?:\/\//, '') ?? '', [session])

  const summary = useMemo(() => {
    const teamCount = records.filter((record) => record.systemGroup === 'team').length
    const freeCount = records.filter((record) => record.systemGroup === 'free').length
    const cleanupCount = records.filter((record) => record.cleanupCandidate).length
    const disabledCount = records.filter((record) => record.disabled).length
    return { teamCount, freeCount, cleanupCount, disabledCount }
  }, [records])

  const totalAccounts = useMemo(() => records.length, [records])

  const visibleRecords = useMemo(
    () => filterCodexRecords(records, activeFilter, debouncedSearch),
    [activeFilter, records, debouncedSearch],
  )

  const cleanupNames = useMemo(() => collectCleanupCandidateNames(records), [records])

  const customGroups = useMemo(
    () =>
      Array.from(
        new Set(records.map((record) => record.customGroup).filter((value): value is string => Boolean(value))),
      ).sort((left, right) => left.localeCompare(right)),
    [records],
  )

  const customGroupCounts = useMemo(
    () =>
      customGroups.map((group) => ({
        group,
        count: records.filter((record) => record.customGroup === group).length,
      })),
    [customGroups, records],
  )

  const selectedVisibleCount = useMemo(
    () => visibleRecords.filter((record) => selected.has(record.source.name)).length,
    [selected, visibleRecords],
  )

  const activityFeed = useMemo(() => {
    const cleanupRecords = records.filter((record) => record.cleanupCandidate)
    if (cleanupRecords.length > 0) {
      return cleanupRecords.slice(0, 4).map((record) => ({
        title: record.source.name,
        detail: `${issueLabels[record.issueKind || 'status-warning'] || '待处理账号'} · ${formatGroupLabel(record.customGroup)} · 刚刚更新`,
      }))
    }

    return records.slice(0, 4).map((record) => ({
      title: record.source.name,
      detail: `${formatGroupLabel(record.customGroup)} · ${record.planType === 'team' ? '团队版' : record.planType === 'free' ? '标准版' : '未标注'} · 今日可用`,
    }))
  }, [records])

  const dominantGroup = customGroupCounts[0]?.group || '未分组'
  const workspaceIdentity = useMemo(
    () => ({
      tenantName: session?.demo ? 'Northwind 团队工作区' : contextTarget || '当前工作区',
      workspaceName: '客户协作工作台',
      roleLabel: session?.demo ? '演示观察者' : '当前使用者',
      freshnessLabel: session?.demo ? '刚刚准备好' : '刚刚同步',
      syncLabel: session?.demo ? '示例数据已经准备好，可以先完整走一遍流程' : '这里展示的是当前空间最近一次同步后的状态',
      trustLabel: session?.demo ? '演示只影响示例数据，不会碰到真实账号' : '涉及批量调整时，会先让你确认再继续',
    }),
    [contextTarget, session],
  )

  const pageMeta: Record<ViewKey, { title: string; description: string; eyebrow: string }> = {
    overview: {
      title: '今日总览',
      description: '快速了解账号现状、需要处理的事项与接下来的重点动作。',
      eyebrow: '首页',
    },
    accounts: {
      title: '今天的客户任务',
      description: '先从任务队列决定今天要推进的事项，再查看详情、原因与下一步动作。',
      eyebrow: '账户',
    },
    cleanup: {
      title: '待处理事项',
      description: '集中处理需要确认、更新或下线的账号，保持整体状态清晰。',
      eyebrow: '提醒',
    },
    settings: {
      title: '我的空间',
      description: '整理当前空间、显示习惯和进入前提醒，让每次打开都更顺手。',
      eyebrow: '我的空间',
    },
  }

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches)

    setPrefersDark(query.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    if (!session) return

    if (session.demo) {
      setRecords(demoCodexRecords)
      setWorkspaceError('')
      setWorkspaceLoading(false)
      return
    }

    let cancelled = false
    setWorkspaceLoading(true)
    setWorkspaceError('')

    fetchCodexRecords(session)
      .then((fresh) => {
        if (cancelled) return
        setRecords(fresh)
      })
      .catch((error) => {
        if (cancelled) return
        setWorkspaceError(error instanceof Error ? error.message : '加载账号失败')
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    const visibleNames = new Set(visibleRecords.map((record) => record.source.name))
    setSelected((current) => {
      const next = new Set(Array.from(current).filter((name) => visibleNames.has(name)))
      return next.size === current.size ? current : next
    })
  }, [visibleRecords])

  const currentMeta = pageMeta[view]
  const topbarSummary =
    view === 'overview'
      ? summary.cleanupCount > 0
        ? `今天有 ${summary.cleanupCount} 项需要优先处理`
        : '当前没有需要优先处理的事项'
      : view === 'accounts'
        ? summary.cleanupCount > 0
          ? `${summary.cleanupCount} 项待确认状态正在等你处理`
          : `${totalAccounts} 个账号已经准备就绪`
        : view === 'cleanup'
          ? `待处理队列当前有 ${cleanupNames.length} 个账号`
          : '整理你的空间、显示习惯与进入前提醒'

  const updateThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode)
    saveThemeMode(mode)
  }

  const cycleThemeMode = () => {
    const currentIndex = themeOrder.indexOf(themeMode)
    const nextMode = themeOrder[(currentIndex + 1) % themeOrder.length]
    updateThemeMode(nextMode)
  }

  const refreshWorkspace = async () => {
    if (!session) return
    if (session.demo) {
      setSettingsMessage('演示模式，操作不会请求接口。')
      return
    }

    setWorkspaceLoading(true)
    setWorkspaceError('')
    try {
      const fresh = await fetchCodexRecords(session)
      setRecords(fresh)
      setSettingsMessage('数据已更新')
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : '刷新失败')
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const handleLogin = async (config: CodexSessionConfig) => {
    await probeConnection(config)
    saveSessionConfig(config)
    setSession(config)
    setView('overview')
    setSelected(new Set())
    setSearch('')
    setSettingsMessage('')
  }

  const enterDemoMode = () => {
    const config = { baseUrl: demoBaseUrl, token: 'demo-token', demo: true }
    saveSessionConfig(config)
    setSession(config)
    setRecords(demoCodexRecords)
    setView('overview')
    setSelected(new Set())
    setSettingsMessage('')
  }

  const clearCurrentSession = () => {
    clearSessionConfig()
    setSession(null)
    setRecords(demoCodexRecords)
    setSelected(new Set())
    setSearch('')
    setFilter('all')
    setView('overview')
    setWorkspaceError('')
    setSettingsMessage('')
  }

  const toggleSelection = useCallback((name: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const selectAllVisible = () => {
    setSelected(new Set(visibleRecords.map((record) => record.source.name)))
  }

  const selectAllCleanup = () => {
    setView('cleanup')
    setSelected(new Set(cleanupNames))
    setSettingsMessage(cleanupNames.length > 0 ? `已选中 ${cleanupNames.length} 个待处理账号` : '没有需要关注的账号')
  }

  const applyGroup = async () => {
    const group = groupDraft.trim()
    if (!group || selected.size === 0) return

    if (session?.demo) {
      setRecords((current) =>
        current.map((record) =>
          selected.has(record.source.name) ? { ...record, customGroup: group } : record,
        ),
      )
      setGroupDraft('')
      setSettingsMessage(`已将 ${selected.size} 个账号归入「${group}」`)
      return
    }

    if (!session) return

    await Promise.all(
      Array.from(selected).map(async (name) => {
        const authJson = await downloadAuthJson(session, name)
        await saveAuthJson(session, name, applyCodexMetadata(authJson, { customGroup: group }))
      }),
    )

    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setGroupDraft('')
    setSettingsMessage(`已将 ${selected.size} 个账号归入「${group}」`)
  }

  const saveRecord = async (payload: {
    name: string
    planType: string
    accountId: string
    customGroup: string
    cleanupCandidate: boolean
    cleanupNote: string
  }) => {
    if (session?.demo) {
      setRecords((current) => {
        const existing = current.find((record) => record.source.name === payload.name)
        if (existing) {
          return current.map((record) =>
            record.source.name === payload.name
              ? {
                  ...record,
                  planType: payload.planType,
                  systemGroup: payload.planType === 'team' ? 'team' : payload.planType === 'free' ? 'free' : 'other',
                  chatgptAccountId: payload.accountId || null,
                  customGroup: payload.customGroup || null,
                  cleanupCandidate: payload.cleanupCandidate,
                  cleanupNote: payload.cleanupNote || null,
                }
              : record,
          )
        }

        const created = deriveCodexRecord(
          {
            name: payload.name,
            type: 'codex',
            disabled: false,
            id_token: {
              plan_type: payload.planType,
              chatgpt_account_id: payload.accountId,
            },
          },
          applyCodexMetadata(
            {},
            {
              customGroup: payload.customGroup,
              cleanupCandidate: payload.cleanupCandidate,
              cleanupNote: payload.cleanupNote,
            },
          ),
        )

        return [created, ...current]
      })
      setView('accounts')
      setSettingsMessage(`${payload.name} 已更新`)
      return
    }

    if (!session) return

    const baseJson = activeRecord ? await downloadAuthJson(session, payload.name) : {}
    const nextJson = applyCodexMetadata(
      {
        ...baseJson,
        type: 'codex',
        id_token: {
          ...(typeof baseJson.id_token === 'object' && baseJson.id_token ? baseJson.id_token : {}),
          plan_type: payload.planType,
          chatgpt_account_id: payload.accountId,
        },
      },
      {
        customGroup: payload.customGroup,
        cleanupCandidate: payload.cleanupCandidate,
        cleanupNote: payload.cleanupNote,
      },
    )

    await saveAuthJson(session, payload.name, nextJson)
    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setView('accounts')
    setSettingsMessage(`${payload.name} 已更新`)
  }

  const updateCleanupState = async (names: string[], cleanupCandidate: boolean) => {
    if (names.length === 0) return

    if (session?.demo) {
      setRecords((current) =>
        current.map((record) =>
          names.includes(record.source.name)
            ? {
                ...record,
                cleanupCandidate,
                cleanupNote: cleanupCandidate ? record.cleanupNote || 'manual-review' : null,
              }
            : record,
        ),
      )
      setSettingsMessage(cleanupCandidate ? '已标记为关注' : '已取消关注')
      return
    }

    if (!session) return

    await Promise.all(
      names.map(async (name) => {
        const authJson = await downloadAuthJson(session, name)
        await saveAuthJson(
          session,
          name,
          applyCodexMetadata(authJson, {
            cleanupCandidate,
            cleanupNote: cleanupCandidate ? 'manual-review' : '',
          }),
        )
      }),
    )

    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setSettingsMessage(cleanupCandidate ? '已标记为关注' : '已取消关注')
  }

  const toggleDisabledForRecord = async (record: CodexAuthRecord) => {
    if (session?.demo) {
      setRecords((current) =>
        current.map((item) =>
          item.source.name === record.source.name ? { ...item, disabled: !item.disabled } : item,
        ),
      )
      setSettingsMessage(`${record.source.name} 已${record.disabled ? '启用' : '禁用'}`)
      return
    }

    if (!session) return
    await setAuthDisabled(session, record.source.name, !record.disabled)
    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setSettingsMessage(`${record.source.name} 已${record.disabled ? '启用' : '禁用'}`)
  }

  const batchToggleDisabled = async (disabled: boolean) => {
    if (selected.size === 0) return

    if (session?.demo) {
      setRecords((current) =>
        current.map((record) =>
          selected.has(record.source.name) ? { ...record, disabled } : record,
        ),
      )
      setSettingsMessage(disabled ? '已停用所选账号' : '已启用所选账号')
      return
    }

    if (!session) return
    await Promise.all(Array.from(selected).map((name) => setAuthDisabled(session, name, disabled)))
    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setSettingsMessage(disabled ? '已停用所选账号' : '已启用所选账号')
  }

  const deleteRecord = async (record: CodexAuthRecord) => {
    if (session?.demo) {
      setRecords((current) => current.filter((item) => item.source.name !== record.source.name))
      setSelected((current) => {
        const next = new Set(current)
        next.delete(record.source.name)
        return next
      })
      setSettingsMessage(`${record.source.name} 已移出当前工作区`)
      return
    }

    if (!session) return
    await deleteAuthFile(session, record.source.name)
    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setSelected((current) => {
      const next = new Set(current)
      next.delete(record.source.name)
      return next
    })
    setSettingsMessage(`${record.source.name} 已移出当前工作区`)
  }

  const batchDeleteRecords = async () => {
    if (selected.size === 0) return

    if (session?.demo) {
      setRecords((current) => current.filter((record) => !selected.has(record.source.name)))
      setSelected(new Set())
      setSettingsMessage('已移除所选账号')
      return
    }

    if (!session) return
    await Promise.all(Array.from(selected).map((name) => deleteAuthFile(session, name)))
    const fresh = await fetchCodexRecords(session)
    setRecords(fresh)
    setSelected(new Set())
    setSettingsMessage('已移除所选账号')
  }

  if (!session) {
    return <LoginPage onSubmit={handleLogin} onDemo={enterDemoMode} />
  }

  return (
    <Layout className="console-shell">
      <Header className="topbar-shell">
        <div className="topbar">
          <div className="topbar-brand">
            <div className="topbar-brand-mark">C</div>
            <div className="topbar-brand-copy">
              <strong>{workspaceIdentity.tenantName}</strong>
              <span className="topbar-subline">{topbarSummary}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <Button className="topbar-button topbar-button-muted" theme="light" type="tertiary" onClick={cycleThemeMode}>
              主题 {themeModeLabels[themeMode]}
            </Button>
            <Button className="topbar-button topbar-button-muted" theme="light" type="tertiary" icon={<RefreshCw size={15} />} onClick={() => void refreshWorkspace()}>
              同步
            </Button>
            {(view === 'accounts' || view === 'cleanup') && (
              <Button className="topbar-button topbar-button-primary" theme="solid" type="primary" icon={<Plus size={15} />} onClick={() => setDrawerMode('create')}>
                接入账号
              </Button>
            )}
          </div>
        </div>
      </Header>

      <Layout className="console-body">
        <Sider className="console-sidebar" style={{ width: 248, minWidth: 248 }}>
          <div className="sidebar-panel">
            <div className="brand-block">
              <span className="brand-kicker">Codex</span>
              <div className="brand-title">{workspaceIdentity.workspaceName}</div>
              <p>围绕客户状态、待办变化与协作节奏安排今天的工作。</p>
            </div>

            <div className="sidebar-section-label">导航</div>
            <SidebarNav active={view} onChange={setView} />

            <div className="sidebar-section-label">上下文</div>
            <div className="sidebar-foot-card">
              <span className="sidebar-foot-kicker">工作区状态</span>
              <strong>{workspaceIdentity.roleLabel}</strong>
              <div className="sidebar-foot-meta">
                <span className="sidebar-foot-note">{workspaceIdentity.syncLabel}</span>
                <span className="sidebar-foot-url">{workspaceIdentity.trustLabel}</span>
              </div>
            </div>
          </div>
        </Sider>

        <Content className="console-main">
          {workspaceError ? <div className="form-error">{workspaceError}</div> : null}
          {!workspaceError && settingsMessage ? <div className="status-banner">{settingsMessage}</div> : null}

          <PageIntro
            compact={view !== 'overview'}
            eyebrow={currentMeta.eyebrow}
            title={currentMeta.title}
            description={currentMeta.description}
            metaItems={[]}
          />

          {view === 'overview' ? (
            <OverviewDashboard
              summary={summary}
              sessionDemo={Boolean(session.demo)}
              totalAccounts={totalAccounts}
              dominantGroup={dominantGroup}
              cleanupNamesCount={cleanupNames.length}
              customGroupsCount={customGroups.length}
              activeFilterLabel={activeFilter}
              customGroupCounts={customGroupCounts}
              activityFeed={activityFeed}
              workspaceIdentity={workspaceIdentity}
              onViewAccounts={() => setView('accounts')}
              onSelectAllCleanup={selectAllCleanup}
              onViewCleanup={() => setView('cleanup')}
            />
          ) : null}

          {view === 'accounts' || view === 'cleanup' ? (
            <AccountsWorkspace
              view={view}
              recordsCount={records.length}
              summary={summary}
              cleanupNamesCount={cleanupNames.length}
              activeFilter={activeFilter}
              visibleRecords={visibleRecords}
              customGroupCounts={customGroupCounts}
              selected={selected}
              selectedVisibleCount={selectedVisibleCount}
              search={search}
              groupDraft={groupDraft}
              workspaceLoading={workspaceLoading}
              onSearchChange={setSearch}
              onGroupDraftChange={setGroupDraft}
              onSetFilter={setFilter}
              onRefresh={() => void refreshWorkspace()}
              onSelectAllVisible={selectAllVisible}
              onSelectAllCleanup={selectAllCleanup}
              onClearSelection={clearSelection}
              onApplyGroup={() => void applyGroup()}
              onBatchMarkCleanup={(value) => void updateCleanupState(Array.from(selected), value)}
              onBatchToggleDisabled={(value) => void batchToggleDisabled(value)}
              onBatchDelete={() => void batchDeleteRecords()}
              onToggleSelection={toggleSelection}
              onViewRecord={(record) => {
                setActiveRecord(record)
                setDrawerMode('view')
              }}
              onEditRecord={(record) => {
                setActiveRecord(record)
                setDrawerMode('edit')
              }}
              onToggleDisabledRecord={(record) => void toggleDisabledForRecord(record)}
              onToggleCleanupRecord={(record, cleanupCandidate) =>
                void updateCleanupState([record.source.name], cleanupCandidate)
              }
              onDeleteRecord={(record) => void deleteRecord(record)}
            />
          ) : null}

          {view === 'settings' ? (
            <section className="settings-grid-panel">
              <Card className="settings-card" bordered={false} shadows="hover">
                <div className="card-headline">
                  <h3>今天进入的是哪个空间</h3>
                  <Tag color={session.demo ? 'green' : 'blue'} shape="circle">{session.demo ? '示例数据' : '已连接'}</Tag>
                </div>
                <p className="settings-description">
                  这里会告诉你当前看到的是哪套数据、最近同步到哪里，以及这次进入会影响什么。
                </p>
                <div className="settings-summary-hero">
                  <div className="settings-summary-main">
                    <span className="settings-summary-kicker">当前空间</span>
                    <strong>{workspaceIdentity.tenantName}</strong>
                    <p>{session.demo ? '这是示例数据，适合先熟悉页面结构、提醒节奏和批量操作。' : '这里展示的是你最近一次同步后的真实空间状态。'}</p>
                  </div>
                  <div className="settings-summary-badges">
                    <span>{session.demo ? '示例数据' : '真实连接'}</span>
                    <span>{workspaceIdentity.roleLabel}</span>
                  </div>
                </div>
                <dl className="settings-grid">
                  <div className="settings-item-primary">
                    <dt>空间名称</dt>
                    <dd>{workspaceIdentity.tenantName}</dd>
                  </div>
                  <div className="settings-item-primary">
                    <dt>当前身份</dt>
                    <dd>{workspaceIdentity.roleLabel}</dd>
                  </div>
                  <div className="settings-item-secondary">
                    <dt>连接入口</dt>
                    <dd>{contextTarget || session.baseUrl}</dd>
                  </div>
                  <div className="settings-item-secondary">
                    <dt>当前分组</dt>
                    <dd>{customGroups.length}</dd>
                  </div>
                  <div className="settings-item-secondary">
                    <dt>最近同步</dt>
                    <dd>{workspaceIdentity.freshnessLabel}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="settings-card" bordered={false} shadows="hover">
                <div className="card-headline">
                  <h3>你喜欢怎么工作</h3>
                  <Tag color="grey" shape="circle">显示习惯</Tag>
                </div>
                <p className="settings-description">
                  选一个最顺手的显示方式。这里不会改变数据，只会影响你看待这个空间的方式。
                </p>
                <div className="settings-preview-strip">
                  <div className={`settings-preview-card ${themeMode === 'dark' ? 'settings-preview-card-active' : ''}`}>
                    <span>夜间复核</span>
                    <strong>深色主题</strong>
                    <p>适合长时间工作与夜间查看。</p>
                  </div>
                  <div className={`settings-preview-card ${themeMode === 'light' ? 'settings-preview-card-active' : ''}`}>
                    <span>白天协作</span>
                    <strong>浅色主题</strong>
                    <p>适合白天办公与分享演示。</p>
                  </div>
                  <div className={`settings-preview-card ${themeMode === 'auto' ? 'settings-preview-card-active' : ''}`}>
                    <span>交给系统</span>
                    <strong>跟随系统</strong>
                    <p>界面会根据你的设备设置自动切换。</p>
                  </div>
                </div>
                <div className="theme-toggle-row">
                  {(['auto', 'light', 'dark'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`theme-chip ${themeMode === mode ? 'theme-chip-active' : ''}`}
                      onClick={() => updateThemeMode(mode)}
                    >
                      {mode === 'auto' ? '跟随系统' : mode === 'light' ? '浅色' : '深色'}
                      {themeMode === mode && <span className="theme-check-icon">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="settings-actions">
                  <Button className="secondary-button" theme="light" type="tertiary" onClick={() => void refreshWorkspace()}>
                    立即同步
                  </Button>
                  <Button className="secondary-button" theme="light" type="tertiary" onClick={() => setShowLogoutConfirm(true)}>
                    返回入口
                  </Button>
                </div>
                <div className="settings-status-stack">
                  <div className="settings-status-row">
                    <span>当前外观</span>
                    <strong>{resolvedTheme === 'dark' ? '深色外观' : '浅色外观'}</strong>
                  </div>
                  <div className="settings-status-row">
                    <span>主题选择</span>
                    <strong>{themeModeLabels[themeMode]}</strong>
                  </div>
                  <div className="settings-status-row">
                    <span>同步方式</span>
                    <strong>{session.demo ? '示例数据本地切换' : '按需手动同步'}</strong>
                  </div>
                </div>
              </Card>

              <Card className="settings-card settings-card-demo" bordered={false} shadows="hover">
                <div className="card-headline">
                  <h3>今天进入前的提醒</h3>
                  <Tag color="grey" shape="circle">边界说明</Tag>
                </div>
                <div className="settings-note-list">
                  <div className="settings-note-item">
                    <strong>{session.demo ? '这是示例数据' : '这是当前连接的空间'}</strong>
                    <span>{session.demo ? '你可以放心练习查看、筛选和批量处理，不会影响真实账号。' : '这里显示的是最近一次同步后的状态，涉及批量调整时会先提醒你确认。'}</span>
                  </div>
                  <div className="settings-note-item">
                    <strong>切换入口不会丢失判断依据</strong>
                    <span>返回入口后，你可以重新选择示例数据，或者连接其他空间继续工作。</span>
                  </div>
                  {session.demo ? (
                    <div className="settings-note-item">
                      <strong>示例数据可以随时重置</strong>
                      <span>如果想回到最初状态，可以重新开始这次演示。</span>
                    </div>
                  ) : null}
                </div>
                <div className="settings-actions">
                  <Button className="secondary-button" theme="light" type="tertiary" onClick={() => setShowLogoutConfirm(true)}>
                    返回入口
                  </Button>
                  {session.demo ? (
                    <Button className="danger-button" theme="light" type="danger" onClick={() => setShowResetConfirm(true)}>
                      重新开始演示
                    </Button>
                  ) : null}
                </div>
              </Card>
            </section>
          ) : null}
        </Content>
      </Layout>

      <AccountDrawer
        mode={drawerMode}
        record={activeRecord}
        onClose={() => {
          setDrawerMode(null)
          setActiveRecord(null)
        }}
        onSave={saveRecord}
      />

      {/* 退出会话确认对话框 */}
      <Modal
        visible={showLogoutConfirm}
        title="退出当前连接？"
        onCancel={() => setShowLogoutConfirm(false)}
        onOk={() => {
          clearCurrentSession()
          setShowLogoutConfirm(false)
        }}
        okText="继续"
        cancelText="取消"
      >
        <p>继续后会返回入口页，你可以重新选择示例数据，或者连接其他空间。</p>
      </Modal>

      {/* 重置确认对话框 */}
      <Modal
        visible={showResetConfirm}
        title="重置示例数据？"
        onCancel={() => setShowResetConfirm(false)}
        onOk={() => {
          clearCurrentSession()
          setShowResetConfirm(false)
        }}
        okText="确认清空"
        cancelText="取消"
        okButtonProps={{ type: 'danger' }}
      >
        <p>继续后会清空这次演示中的变更，并回到入口页。</p>
      </Modal>
    </Layout>
  )
}

export default App
