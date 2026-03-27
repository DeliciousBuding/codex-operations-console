import { deriveCodexRecord } from '../lib/codex'
import type { CodexAuthRecord, RawAuthRecord } from '../types/codex'

const rawRecords: RawAuthRecord[] = [
  {
    name: 'team-main-01.json',
    type: 'codex',
    disabled: false,
    note: '主账号池',
    priority: 20,
    id_token: { plan_type: 'team', chatgpt_account_id: 'acct_team_main_01' },
  },
  {
    name: 'team-main-02.json',
    type: 'codex',
    disabled: false,
    priority: 18,
    id_token: { plan_type: 'team', chatgpt_account_id: 'acct_team_main_02' },
  },
  {
    name: 'free-batch-101.json',
    type: 'codex',
    disabled: false,
    priority: 5,
    status_message:
      '{"error":{"message":"Encountered invalidated oauth token for user, failing request","code":"token_revoked"},"status":401}',
    id_token: { plan_type: 'free', chatgpt_account_id: 'acct_free_101' },
  },
  {
    name: 'free-batch-102.json',
    type: 'codex',
    disabled: false,
    priority: 4,
    status_message: 'refresh_token_reused',
    id_token: { plan_type: 'free', chatgpt_account_id: 'acct_free_102' },
  },
  {
    name: 'free-batch-103.json',
    type: 'codex',
    disabled: true,
    priority: 3,
    id_token: { plan_type: 'free', chatgpt_account_id: 'acct_free_103' },
  },
  {
    name: 'free-batch-104.json',
    type: 'codex',
    disabled: false,
    priority: 2,
    id_token: { plan_type: 'free', chatgpt_account_id: 'acct_free_104' },
  },
]

const metadataByName: Record<string, Record<string, unknown>> = {
  'team-main-01.json': {
    x_vc_group: 'mine-team',
    x_vc_tags: ['primary', 'stable'],
  },
  'team-main-02.json': {
    x_vc_group: 'mine-team',
    x_vc_tags: ['backup'],
  },
  'free-batch-101.json': {
    x_vc_group: 'bulk-free',
    x_vc_tags: ['cleanup', 'batch'],
    x_vc_cleanup_candidate: true,
    x_vc_cleanup_note: 'token_revoked',
  },
  'free-batch-102.json': {
    x_vc_group: 'bulk-free',
    x_vc_tags: ['cleanup', 'retry'],
  },
  'free-batch-103.json': {
    x_vc_group: 'disabled-batch',
    x_vc_tags: ['disabled'],
  },
  'free-batch-104.json': {
    x_vc_group: 'bulk-free',
    x_vc_tags: ['warm'],
  },
}

// Generate additional demo records for performance testing
const groups = ['mine-team', 'bulk-free', 'product-alpha', 'test-batch', 'staging', 'partner-accounts', 'audit-queue']
const planTypes = ['team', 'free', 'free', 'free', 'team'] // weighted towards free
const statusMessages = [
  '',
  '',
  '',
  '{"error":{"message":"Encountered invalidated oauth token for user","code":"token_revoked"},"status":401}',
  'refresh_token_reused',
  '',
  '',
  '{"status":402,"error":{"code":"payment_required"}}',
  '',
  '',
]

for (let i = 0; i < 44; i++) {
  const idx = i + 200
  const planType = planTypes[i % planTypes.length]
  const prefix = planType === 'team' ? 'team' : 'free'
  const name = `${prefix}-gen-${String(idx).padStart(3, '0')}.json`
  const group = groups[i % groups.length]
  const status = statusMessages[i % statusMessages.length]
  const disabled = i % 12 === 0

  rawRecords.push({
    name,
    type: 'codex',
    disabled,
    priority: Math.max(1, 20 - i),
    ...(status ? { status_message: status } : {}),
    id_token: {
      plan_type: planType,
      chatgpt_account_id: `acct_${prefix}_${idx}`,
    },
  })

  metadataByName[name] = {
    x_vc_group: group,
    x_vc_tags: [planType, i % 3 === 0 ? 'priority' : 'standard'],
    ...(status ? { x_vc_cleanup_candidate: true, x_vc_cleanup_note: 'auto-detected' } : {}),
  }
}

export const demoBaseUrl = 'https://demo.example.com'

export const demoCodexRecords: CodexAuthRecord[] = rawRecords.map((record) =>
  deriveCodexRecord(record, metadataByName[record.name] ?? {}),
)

export const demoMetricTrends = {
  team: [18, 20, 28, 26, 30, 34, 32],
  free: [22, 24, 20, 26, 32, 36, 40],
  cleanup: [14, 18, 24, 22, 30, 26, 20],
  disabled: [12, 16, 14, 20, 24, 18, 22],
}
