import { Button, Checkbox, Input, Select, SideSheet, TextArea } from '@douyinfe/semi-ui'
import { useEffect, useState } from 'react'
import type { CodexAuthRecord } from '../types/codex'

type AccountDrawerProps = {
  mode: 'view' | 'edit' | 'create' | null
  record: CodexAuthRecord | null
  onClose: () => void
  onSave: (payload: {
    name: string
    planType: string
    accountId: string
    customGroup: string
    cleanupCandidate: boolean
    cleanupNote: string
  }) => Promise<void>
}

const emptyForm = {
  name: '',
  planType: 'free',
  accountId: '',
  customGroup: '',
  cleanupCandidate: false,
  cleanupNote: '',
}

export function AccountDrawer({ mode, record, onClose, onSave }: AccountDrawerProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'create') {
      setForm(emptyForm)
      return
    }

    if (!record) return
    setForm({
      name: record.source.name,
      planType: record.planType || 'free',
      accountId: record.chatgptAccountId || '',
      customGroup: record.customGroup || '',
      cleanupCandidate: record.cleanupCandidate,
      cleanupNote: record.cleanupNote || '',
    })
  }, [mode, record])

  if (!mode) return null

  const readOnly = mode === 'view'

  return (
    <SideSheet
      title={mode === 'create' ? '新增账号' : form.name}
      visible
      onCancel={onClose}
      width={520}
      footer={
        !readOnly ? (
          <div className="drawer-actions">
            <Button
              type="primary"
              theme="solid"
              loading={saving}
              disabled={!form.name.trim()}
              onClick={async () => {
                setSaving(true)
                try {
                  await onSave(form)
                  onClose()
                } finally {
                  setSaving(false)
                }
              }}
            >
              保存
            </Button>
          </div>
        ) : null
      }
    >
      <div className="drawer-header-meta">
        <span className="eyebrow">{mode === 'create' ? '新建' : mode === 'edit' ? '编辑' : '查看'}</span>
      </div>
      <div className="drawer-form">
        <Input
          value={form.name}
          disabled={readOnly || mode === 'edit'}
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="账号名"
          addonBefore="账号名"
        />
        <Select
          value={form.planType}
          disabled={readOnly}
          onChange={(value) => setForm((current) => ({ ...current, planType: String(value) }))}
          optionList={[
            { value: 'team', label: 'team' },
            { value: 'free', label: 'free' },
            { value: 'other', label: 'other' },
          ]}
          placeholder="计划类型"
        />
        <Input
          value={form.accountId}
          disabled={readOnly}
          onChange={(value) => setForm((current) => ({ ...current, accountId: value }))}
          placeholder="账号标识"
          addonBefore="账号标识"
        />
        <Input
          value={form.customGroup}
          disabled={readOnly}
          onChange={(value) => setForm((current) => ({ ...current, customGroup: value }))}
          placeholder="分组名称"
          addonBefore="分组"
        />
        <Checkbox
          checked={form.cleanupCandidate}
          disabled={readOnly}
          onChange={(event) => setForm((current) => ({ ...current, cleanupCandidate: Boolean(event.target.checked) }))}
        >
          标记关注
        </Checkbox>
        <TextArea
          rows={4}
          value={form.cleanupNote}
          disabled={readOnly}
          onChange={(value) => setForm((current) => ({ ...current, cleanupNote: value }))}
          placeholder="备注信息"
        />
      </div>
    </SideSheet>
  )
}
