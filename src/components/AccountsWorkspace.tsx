import { memo } from 'react'
import { Button, Input, Tag } from '@douyinfe/semi-ui'
import { Search } from 'lucide-react'
import { AccountTable } from './AccountTable'
import { formatGroupLabel } from '../lib/codex'
import { WorkspaceCard } from './WorkspaceCard'
import type { CodexAuthRecord } from '../types/codex'

type Summary = {
  teamCount: number
  freeCount: number
  cleanupCount: number
  disabledCount: number
}

type GroupCount = {
  group: string
  count: number
}

type AccountsWorkspaceProps = {
  view: 'accounts' | 'cleanup'
  recordsCount: number
  summary: Summary
  cleanupNamesCount: number
  activeFilter: string
  visibleRecords: CodexAuthRecord[]
  customGroupCounts: GroupCount[]
  selected: Set<string>
  selectedVisibleCount: number
  search: string
  groupDraft: string
  workspaceLoading: boolean
  onSearchChange: (value: string) => void
  onGroupDraftChange: (value: string) => void
  onSetFilter: (value: 'all' | 'team' | 'free' | 'cleanup' | 'disabled' | `group:${string}`) => void
  onRefresh: () => void
  onSelectAllVisible: () => void
  onSelectAllCleanup: () => void
  onClearSelection: () => void
  onApplyGroup: () => void
  onBatchMarkCleanup: (value: boolean) => void
  onBatchToggleDisabled: (value: boolean) => void
  onBatchDelete: () => void
  onToggleSelection: (name: string) => void
  onViewRecord: (record: CodexAuthRecord) => void
  onEditRecord: (record: CodexAuthRecord) => void
  onToggleDisabledRecord: (record: CodexAuthRecord) => void
  onToggleCleanupRecord: (record: CodexAuthRecord, cleanupCandidate: boolean) => void
  onDeleteRecord: (record: CodexAuthRecord) => void
}

export const AccountsWorkspace = memo(function AccountsWorkspace({
  view,
  recordsCount,
  summary,
  cleanupNamesCount,
  activeFilter,
  visibleRecords,
  customGroupCounts,
  selected,
  selectedVisibleCount,
  search,
  groupDraft,
  workspaceLoading,
  onSearchChange,
  onGroupDraftChange,
  onSetFilter,
  onRefresh,
  onSelectAllVisible,
  onSelectAllCleanup,
  onClearSelection,
  onApplyGroup,
  onBatchMarkCleanup,
  onBatchToggleDisabled,
  onBatchDelete,
  onToggleSelection,
  onViewRecord,
  onEditRecord,
  onToggleDisabledRecord,
  onToggleCleanupRecord,
  onDeleteRecord,
}: AccountsWorkspaceProps) {
  const queueOptions = [
    {
      key: 'all' as const,
      label: '全部客户',
      title: '查看完整列表',
      hint: '适合回看整体情况，或快速定位某一个账号',
      count: recordsCount,
    },
    {
      key: 'team' as const,
      label: '重点跟进',
      title: '先看重点账号',
      hint: '适合优先回看最重要的一批账号',
      count: summary.teamCount,
    },
    {
      key: 'free' as const,
      label: '日常维护',
      title: '回看常规更新',
      hint: '适合集中处理例行巡检和常规维护',
      count: summary.freeCount,
    },
    {
      key: 'cleanup' as const,
      label: '待客户确认',
      title: '先处理待确认状态',
      hint: '优先看原因，再决定恢复、保留还是移出',
      count: summary.cleanupCount,
    },
    {
      key: 'disabled' as const,
      label: '待恢复可用性',
      title: '回看暂停中的账号',
      hint: '帮助你明确哪些需要恢复，哪些继续保留停用',
      count: summary.disabledCount,
    },
  ]

  const leadQueue =
    summary.cleanupCount > 0
      ? {
          key: 'cleanup' as const,
          kicker: '建议先从这里开始',
          title: `先处理 ${summary.cleanupCount} 项待确认状态`,
          description: '这批账号已经进入优先处理区，完成判断后，后续搜索、详情和批量操作都会更顺畅。',
          action: '打开待确认队列',
        }
      : summary.disabledCount > 0
        ? {
            key: 'disabled' as const,
            kicker: '建议先从这里开始',
            title: `回看 ${summary.disabledCount} 个暂停中的账号`,
            description: '先确认哪些只是临时停用，哪些应该继续保持暂停状态。',
            action: '打开停用列表',
          }
        : {
            key: 'team' as const,
            kicker: '建议先从这里开始',
            title: `先看 ${summary.teamCount} 个重点账号`,
            description: '如果今天先处理一小批关键账号，后面的判断会更快也更稳。',
            action: '打开重点列表',
          }

  const supportingQueues = queueOptions.filter((queue) => queue.key !== leadQueue.key)

  const activeFilterLabel =
    view === 'cleanup'
      ? '待客户确认'
      : activeFilter === 'all'
        ? '全部客户'
        : activeFilter === 'team'
          ? '重点跟进'
          : activeFilter === 'free'
            ? '日常维护'
            : activeFilter === 'cleanup'
              ? '待客户确认'
              : activeFilter === 'disabled'
                ? '待恢复可用性'
                : activeFilter.startsWith('group:')
                  ? formatGroupLabel(activeFilter.slice('group:'.length))
                  : activeFilter

  return (
    <WorkspaceCard
      eyebrow={view === 'cleanup' ? '待客户确认' : '任务队列'}
      title={view === 'cleanup' ? '优先处理这些账号' : '先选今天要推进的任务'}
      description={
        view === 'cleanup'
          ? '这些账号正在等待确认或恢复，完成处理后会同步回工作区状态。'
          : '先从任务队列里选出今天要推进的事项，再进入搜索、详情查看或批量操作。'
      }
      headerTag={
        view === 'cleanup' ? (
          <Tag color="red" shape="circle">{`${cleanupNamesCount} 个`}</Tag>
        ) : (
          <Tag color="blue" shape="circle">{`${summary.cleanupCount} 项待确认`}</Tag>
        )
      }
      tabsArea={
        view === 'accounts' ? (
          <>
            <div className="task-start-panel">
              <div className="task-start-copy">
                <span className="task-start-kicker">{leadQueue.kicker}</span>
                <strong>{leadQueue.title}</strong>
                <p>{leadQueue.description}</p>
              </div>
              <button type="button" className="task-start-action" onClick={() => onSetFilter(leadQueue.key)}>
                {leadQueue.action}
              </button>
            </div>
            <div className="task-queue-grid">
              {supportingQueues.map((queue) => (
                <button
                  key={queue.key}
                  type="button"
                  className={`task-queue-card ${activeFilter === queue.key ? 'task-queue-card-active' : ''}`}
                  onClick={() => onSetFilter(queue.key)}
                >
                  <span className="task-queue-label">{queue.label}</span>
                  <strong>{queue.count}</strong>
                  <div className="task-queue-copy">
                    <b>{queue.title}</b>
                    <span>{queue.hint}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="cleanup-summary-strip">
            <span>待确认 {cleanupNamesCount}</span>
            <span>待恢复 {summary.disabledCount}</span>
            <span>已选择 {selected.size}</span>
          </div>
        )
      }
      actionsArea={
        <div className="workspace-toolbar">
          <div className="workspace-toolbar-left">
            <Button className="toolbar-ghost-button" theme="borderless" type="tertiary" onClick={onRefresh}>
              刷新列表
            </Button>
            <span className="workspace-toolbar-note">{view === 'cleanup' ? '先确认原因，再决定如何恢复或移除' : '先用上面的入口定方向，再用搜索定位具体账号'}</span>
          </div>
          <div className="workspace-toolbar-right">
            <div className="workspace-toolbar-badge">当前查看</div>
            <div className="workspace-toolbar-summary">
              <strong>{activeFilterLabel}</strong>
              <em>{view === 'cleanup' ? '批量操作仅在选中后出现' : '搜索、详情和批量操作都会跟随这一队列展开'}</em>
            </div>
          </div>
        </div>
      }
      searchArea={
        <div className="workspace-search-stack">
          <Input
            className="search-input"
            placeholder={view === 'cleanup' ? '搜索待确认账号或任务原因' : '搜索客户名称、分组或任务原因'}
            value={search}
            onChange={onSearchChange}
            prefix={<Search size={16} />}
          />
          <div className="workspace-scope-strip">
            <div className="workspace-scope-copy">
              <span className="workspace-scope-kicker">任务范围</span>
              <strong>{view === 'cleanup' ? '先确认这批账号为什么进入待处理队列' : '用搜索定位具体账号，批量操作会跟随当前队列一起变化'}</strong>
              <p>{view === 'cleanup' ? '查看任务原因后再决定恢复、保留停用还是移出工作区。' : '当你切换入口时，下面的结果、详情和选择状态都会一起更新。'}</p>
            </div>
          </div>
          {view === 'accounts' && customGroupCounts.length > 0 ? (
            <div className="custom-group-row">
              <span className="filter-label">补充筛选</span>
              <div className="filter-tabs">
                {customGroupCounts.map((item) => {
                  const filterValue = `group:${item.group}` as const
                  return (
                    <button
                      key={item.group}
                      type="button"
                      className={`filter-chip filter-chip-secondary ${activeFilter === filterValue ? 'filter-chip-active' : ''}`}
                      onClick={() => onSetFilter(filterValue)}
                    >
                      <span>{formatGroupLabel(item.group)}</span>
                      <strong>{item.count}</strong>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      }
      footerArea={
        selected.size > 0 ? (
          <div className="batch-bar">
            <div className="batch-meta">
              <strong>已选择 {selected.size} 个客户任务</strong>
              <span>当前列表命中 {selectedVisibleCount} 项</span>
            </div>
            <div className="batch-controls">
              <div className="batch-primary-group">
                <Button className="secondary-button" theme="light" type="tertiary" onClick={onSelectAllVisible}>
                  全选当前任务
                </Button>
                <Button className="secondary-button" theme="light" type="tertiary" onClick={onSelectAllCleanup}>
                  全选待确认
                </Button>
                <Button className="secondary-button" theme="light" type="tertiary" onClick={onClearSelection}>
                  清空选择
                </Button>
              </div>

              <div className="batch-secondary-group">
                <Input
                  className="group-input"
                  placeholder="分组名称，如产品组 / 测试组"
                  value={groupDraft}
                  onChange={onGroupDraftChange}
                />
                <Button className="primary-button" theme="solid" type="primary" onClick={onApplyGroup}>
                  移动到分组
                </Button>
              </div>

              <div className="batch-divider" />

              <div className="batch-secondary-group">
                <Button
                  className="secondary-button"
                  theme="light"
                  type="tertiary"
                  onClick={() => onBatchMarkCleanup(true)}
                >
                  加入待确认
                </Button>
                <Button
                  className="secondary-button"
                  theme="light"
                  type="tertiary"
                  onClick={() => onBatchMarkCleanup(false)}
                >
                  移出待确认
                </Button>
                <Button
                  className="secondary-button"
                  theme="light"
                  type="tertiary"
                  onClick={() => onBatchToggleDisabled(true)}
                >
                  暂停使用
                </Button>
                <Button
                  className="secondary-button"
                  theme="light"
                  type="tertiary"
                  onClick={() => onBatchToggleDisabled(false)}
                >
                  恢复使用
                </Button>
              </div>

              <div className="batch-danger-group">
                <Button className="danger-button" theme="light" type="danger" onClick={onBatchDelete}>
                  从工作区移除
                </Button>
              </div>
            </div>
          </div>
        ) : undefined
      }
    >
      <AccountTable
        records={workspaceLoading ? [] : visibleRecords}
        selected={selected}
        onToggle={onToggleSelection}
        onView={onViewRecord}
        onEdit={onEditRecord}
        onToggleDisabled={onToggleDisabledRecord}
        onToggleCleanup={onToggleCleanupRecord}
        onDelete={onDeleteRecord}
      />
      {workspaceLoading ? <div className="table-loading-hint">正在加载账号数据…</div> : null}
    </WorkspaceCard>
  )
})
