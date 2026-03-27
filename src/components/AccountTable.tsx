import { memo } from 'react'
import { Button, Dropdown, Table } from '@douyinfe/semi-ui'
import { IconMore } from '@douyinfe/semi-icons'
import { AlertTriangle, CheckCircle2, CircleSlash, Eye, FolderInput, PencilLine } from 'lucide-react'
import { formatGroupLabel } from '../lib/codex'
import type { CodexAuthRecord } from '../types/codex'

type AccountTableProps = {
  records: CodexAuthRecord[]
  selected: Set<string>
  onToggle: (name: string) => void
  onView: (record: CodexAuthRecord) => void
  onEdit: (record: CodexAuthRecord) => void
  onToggleDisabled: (record: CodexAuthRecord) => void
  onToggleCleanup: (record: CodexAuthRecord, cleanupCandidate: boolean) => void
  onDelete: (record: CodexAuthRecord) => void
}

const issueLabel = (issue: CodexAuthRecord['issueKind']) => {
  switch (issue) {
    case 'token-revoked':
      return '令牌失效'
    case 'refresh-token-reused':
      return '刷新令牌复用'
    case 'unauthorized':
      return '未授权'
    case 'payment-required':
      return '订阅异常'
    case 'not-found':
      return '记录缺失'
    case 'status-warning':
      return '待确认'
    default:
      return '正常'
  }
}

const issueTone = (record: CodexAuthRecord) => {
  if (record.cleanupCandidate) return 'red'
  if (record.issueKind === 'status-warning') return 'orange'
  return 'grey'
}

const resolveTaskLabel = (record: CodexAuthRecord) => {
  if (record.disabled) return '恢复可用性'
  if (record.cleanupCandidate) return '待确认状态'
  if (record.systemGroup === 'team') return '重点查看'
  if (record.systemGroup === 'free') return '日常巡检'
  return '保持观察'
}

const resolveNextStep = (record: CodexAuthRecord) => {
  if (record.disabled) return '确认是否恢复使用'
  if (record.cleanupCandidate) return '先看详情，再决定下一步'
  return '确认当前状态是否需要调整'
}

export const AccountTable = memo(function AccountTable({
  records,
  selected,
  onToggle,
  onView,
  onEdit,
  onToggleDisabled,
  onToggleCleanup,
  onDelete,
}: AccountTableProps) {
  const columns = [
    {
      title: '',
      dataIndex: 'selection',
      width: 54,
      render: (_: unknown, record: CodexAuthRecord) => (
        <label className="selection-cell">
          <input
            type="checkbox"
            checked={selected.has(record.source.name)}
            onChange={() => onToggle(record.source.name)}
            aria-label={`选择 ${record.source.name}`}
          />
        </label>
      ),
    },
    {
      title: '客户账号',
      dataIndex: 'name',
      render: (_: unknown, record: CodexAuthRecord) => (
        <div className="account-cell">
          <div className="account-cell-main">
            <strong>{record.source.name}</strong>
            {record.cleanupCandidate ? (
              <span className="inline-risk-pill">
                <AlertTriangle size={12} />
                待处理
              </span>
            ) : null}
          </div>
          <div className="account-cell-sub">
            <span>{record.chatgptAccountId || '无账号标识'}</span>
            {record.tags.length > 0 ? (
              <span className="account-inline-tags">{record.tags.slice(0, 2).join(' · ')}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: '当前任务',
      dataIndex: 'task',
      width: 148,
      render: (_: unknown, record: CodexAuthRecord) => (
        <div
          className={`plan-pill plan-pill-${record.systemGroup === 'team' ? 'team' : record.systemGroup === 'free' ? 'free' : 'other'}`}
        >
          {resolveTaskLabel(record)}
        </div>
      ),
    },
    {
      title: '客户分组',
      dataIndex: 'group',
      width: 168,
      render: (_: unknown, record: CodexAuthRecord) =>
        record.customGroup ? (
          <div className="group-pill">
            <FolderInput size={13} />
            <span>{formatGroupLabel(record.customGroup)}</span>
          </div>
        ) : (
          <span className="muted-cell">默认</span>
        ),
    },
    {
      title: '最近变化',
      dataIndex: 'issue',
      width: 188,
      render: (_: unknown, record: CodexAuthRecord) => (
        <div className="issue-stack">
          <div className={`issue-pill issue-pill-${issueTone(record)}`}>{issueLabel(record.issueKind)}</div>
          {record.cleanupNote ? <span className="issue-note">{record.cleanupNote}</span> : null}
        </div>
      ),
    },
    {
      title: '下一步建议',
      dataIndex: 'next',
      width: 168,
      render: (_: unknown, record: CodexAuthRecord) => (
        <div className="group-pill">
          <CheckCircle2 size={13} />
          <span>{resolveNextStep(record)}</span>
        </div>
      ),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      width: 118,
      render: (_: unknown, record: CodexAuthRecord) => (
        <div className={`status-pill ${record.disabled ? 'status-pill-disabled' : 'status-pill-active'}`}>
          {record.disabled ? <CircleSlash size={13} /> : <CheckCircle2 size={13} />}
          <span>{record.disabled ? '已停用' : '启用'}</span>
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 168,
      render: (_: unknown, record: CodexAuthRecord) => (
        <div className="row-actions">
          <Button
            className="row-action-ghost"
            size="small"
            theme="borderless"
            type="tertiary"
            icon={<Eye size={14} />}
            aria-label={`查看 ${record.source.name}`}
            onClick={() => onView(record)}
          />
          <Button
            className="row-action-ghost"
            size="small"
            theme="borderless"
            type="tertiary"
            icon={<PencilLine size={14} />}
            aria-label={`编辑 ${record.source.name}`}
            onClick={() => onEdit(record)}
          />
          <Dropdown
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => onToggleDisabled(record)}>
                  {record.disabled ? '恢复使用' : '暂停使用'}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => onToggleCleanup(record, !record.cleanupCandidate)}>
                  {record.cleanupCandidate ? '移出待确认' : '加入待确认'}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => onDelete(record)}>从工作区移除</Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <Button className="row-action-menu" icon={<IconMore />} size="small" theme="borderless" type="tertiary" aria-label={`更多操作 ${record.source.name}`} />
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <div className="table-shell">
      <Table
        columns={columns}
        dataSource={records}
        rowKey={(record?: CodexAuthRecord) => record?.source.name || ''}
        pagination={false}
        bordered={false}
        virtualized
        scroll={{ y: 600 }}
      />
    </div>
  )
})
