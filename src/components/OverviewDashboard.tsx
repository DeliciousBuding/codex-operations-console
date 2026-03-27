import { memo } from 'react'
import { Card, Tag } from '@douyinfe/semi-ui'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { formatGroupLabel } from '../lib/codex'
import { WorkspaceCard } from './WorkspaceCard'

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

type ActivityItem = {
  title: string
  detail: string
}

type OverviewDashboardProps = {
  summary: Summary
  sessionDemo: boolean
  totalAccounts: number
  dominantGroup: string
  cleanupNamesCount: number
  customGroupsCount: number
  activeFilterLabel: string
  customGroupCounts: GroupCount[]
  activityFeed: ActivityItem[]
  workspaceIdentity: {
    tenantName: string
    workspaceName: string
    roleLabel: string
    freshnessLabel: string
    syncLabel: string
    trustLabel: string
  }
  onViewAccounts: () => void
  onSelectAllCleanup: () => void
  onViewCleanup: () => void
}

export const OverviewDashboard = memo(function OverviewDashboard({
  summary,
  sessionDemo,
  totalAccounts,
  dominantGroup,
  cleanupNamesCount,
  customGroupsCount,
  activeFilterLabel,
  customGroupCounts,
  activityFeed,
  workspaceIdentity,
  onViewAccounts,
  onSelectAllCleanup,
  onViewCleanup,
}: OverviewDashboardProps) {
  const priorityRows = [
    {
      label: '现在',
      title: summary.cleanupCount > 0 ? `先处理 ${summary.cleanupCount} 个需要确认的账号` : '当前没有紧急处理项',
      detail: summary.cleanupCount > 0 ? '优先完成这批账号的复核；处理后，工作区状态会立即回写到总览里。' : '当前账号状态平稳，可以把注意力放在整体结构和使用质量上。',
      cta: '查看待处理项',
      onClick: onViewCleanup,
      tone: summary.cleanupCount > 0 ? 'critical' : 'normal',
      emphasis: 'primary',
    },
    {
      label: '下一步',
      title: `继续查看 ${formatGroupLabel(dominantGroup)}`,
      detail: '这是当前最活跃的账号组，最适合用来判断整体结构是否保持健康。',
      cta: '打开账号列表',
      onClick: onViewAccounts,
      tone: 'normal',
      emphasis: 'secondary',
    },
    {
      label: '回看',
      title: summary.disabledCount > 0 ? `${summary.disabledCount} 个账号暂时停用中` : '当前没有停用中的账号',
      detail: '回看停用账号能帮助你判断哪些只是临时冻结，哪些应该继续保留停用状态。',
      cta: '查看状态',
      onClick: onViewAccounts,
      tone: 'normal',
      emphasis: 'secondary',
    },
  ]

  return (
    <>
      <section className="overview-identity-card">
        <div className="overview-identity-copy">
          <span className="overview-identity-kicker">你的工作区</span>
          <strong>{workspaceIdentity.tenantName}</strong>
          <p>{workspaceIdentity.workspaceName} · {workspaceIdentity.roleLabel}</p>
          <div className="overview-identity-notes">
            <span>{workspaceIdentity.syncLabel}</span>
            <span>{workspaceIdentity.trustLabel}</span>
          </div>
        </div>
        <div className="overview-identity-metrics">
          <div>
            <span>已接入账号</span>
            <strong>{totalAccounts}</strong>
          </div>
          <div>
            <span>今日待处理</span>
            <strong>{summary.cleanupCount}</strong>
          </div>
          <div>
            <span>最近同步</span>
            <strong>{workspaceIdentity.freshnessLabel}</strong>
          </div>
        </div>
      </section>

      <section className="overview-command-grid">
        <WorkspaceCard
          title="今天的重点"
          description="如果今天只打开一个页面，这里应该能告诉你先做什么、为什么重要、接下来点哪里。"
        >
          <div className="priority-list">
            {priorityRows.map((row) => (
              <div key={row.title} className={`priority-row ${row.tone === 'critical' ? 'priority-row-critical' : 'priority-row-secondary'}`}>
                <div className="priority-meta">
                  <span className="priority-level">{row.label}</span>
                  <div className="priority-copy">
                    <strong>{row.title}</strong>
                    <p>{row.detail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`priority-cta ${row.emphasis === 'primary' ? 'priority-cta-primary' : 'priority-cta-secondary'}`}
                  onClick={row.onClick}
                >
                  {row.cta}
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </WorkspaceCard>

        <div className="overview-command-side">
          <Card className="side-info-card side-info-card-alert" bordered={false} shadows="hover">
            <div className="card-headline">
              <h3>今天的风险提醒</h3>
            </div>
            <div className="incident-stack">
              <div className="incident-highlight">
                <AlertTriangle size={16} />
                <div>
                  <strong>{summary.cleanupCount > 0 ? `${summary.cleanupCount} 个账号需要尽快确认` : '当前整体状态保持稳定'}</strong>
                  <span>{summary.cleanupCount > 0 ? '这些账号已进入优先处理队列；完成复核后，系统会自动回写新的状态。' : '没有新的高优先级异常，可以继续查看结构变化和最近动态。'}</span>
                </div>
              </div>
              <div className="incident-stat-grid">
                <div className="incident-stat">
                  <span>待处理</span>
                  <strong>{cleanupNamesCount}</strong>
                </div>
                <div className="incident-stat">
                  <span>已停用</span>
                  <strong>{summary.disabledCount}</strong>
                </div>
              </div>
              <div className="incident-actions">
                <button type="button" className="analysis-pill analysis-pill-primary" onClick={onViewCleanup}>
                  打开待处理列表
                </button>
                <button type="button" className="incident-text-action" onClick={onSelectAllCleanup}>
                  预选全部待处理账号
                </button>
              </div>
            </div>
          </Card>

          <Card className="side-info-card" bordered={false} shadows="hover">
            <div className="card-headline">
              <h3>工作区摘要</h3>
              <Tag color="grey" shape="circle">摘要</Tag>
            </div>
            <div className="context-list">
              <div className="context-row">
                <span>当前环境</span>
                <strong>{sessionDemo ? '演示工作区' : '实时工作区'}</strong>
              </div>
              <div className="context-row">
                <span>账号规模</span>
                <strong>{summary.teamCount + summary.freeCount + summary.disabledCount}</strong>
              </div>
              <div className="context-row">
                <span>账号分层</span>
                <strong>团队版 {summary.teamCount} / 标准版 {summary.freeCount}</strong>
              </div>
              <div className="context-row">
                <span>当前视图</span>
                <strong>{activeFilterLabel}</strong>
              </div>
              <div className="context-row">
                <span>活跃分组</span>
                <strong>{formatGroupLabel(dominantGroup)}</strong>
              </div>
              <div className="context-row">
                <span>分组数量</span>
                <strong>{customGroupsCount}</strong>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="overview-lower-grid">
        <Card className="overview-secondary-card" bordered={false} shadows="hover">
          <div className="card-headline">
            <h3>分组分布</h3>
            <Tag color="grey" shape="circle">{customGroupCounts.length} 个分组</Tag>
          </div>
          <div className="group-distribution">
            {(customGroupCounts.length > 0 ? customGroupCounts : [{ group: '未分组', count: summary.teamCount + summary.freeCount }]).map((item) => (
              <div key={item.group} className="distribution-row">
                <div className="distribution-copy">
                  <strong>{formatGroupLabel(item.group)}</strong>
                  <span>{item.count} 个账号</span>
                </div>
                <div className="distribution-bar">
                  <span
                    style={{
                      width: `${Math.max(14, Math.round((item.count / Math.max(summary.teamCount + summary.freeCount, 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overview-secondary-card" bordered={false} shadows="hover">
          <div className="card-headline">
            <h3>最近动态</h3>
            <Tag color={summary.cleanupCount > 0 ? 'orange' : 'green'} shape="circle">
              {summary.cleanupCount > 0 ? '需关注' : '稳定'}
            </Tag>
          </div>
          <div className="activity-feed">
            {activityFeed.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="activity-row">
                <div className="activity-marker" />
                <div className="activity-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  )
})
