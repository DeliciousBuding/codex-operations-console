import type { CodexAuthRecord, CodexIssueKind, RawAuthRecord } from '../types/codex'

const trimString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export const formatPlanTypeLabel = (planType: string | null): string => {
  if (planType === 'team') return '团队版'
  if (planType === 'free') return '标准版'
  if (!planType) return '未标注'
  return planType
}

export const formatGroupLabel = (group: string | null): string => {
  if (!group) return '未分组'

  const normalized = group.toLowerCase()
  if (normalized === 'mine-team') return '核心账号组'
  if (normalized === 'bulk-free') return '标准账号组'
  if (normalized === 'disabled-batch') return '停用账号组'

  return group
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const normalizeTags = (value: unknown): string[] => {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,\n]+/)
      : []

  const seen = new Set<string>()
  const tags: string[] = []

  source.forEach((entry) => {
    const tag = trimString(entry)
    const key = tag.toLowerCase()
    if (!tag || seen.has(key)) return
    seen.add(key)
    tags.push(tag)
  })

  return tags
}

export const readIdTokenObject = (record: RawAuthRecord): Record<string, unknown> | null => {
  if (record.id_token && typeof record.id_token === 'object' && !Array.isArray(record.id_token)) {
    return record.id_token as Record<string, unknown>
  }
  return null
}

export const resolveIssueKind = (statusMessage: string): CodexIssueKind => {
  const normalized = statusMessage.toLowerCase()
  if (!normalized) return null
  if (normalized.includes('token_revoked') || normalized.includes('invalidated oauth token')) {
    return 'token-revoked'
  }
  if (normalized.includes('refresh_token_reused')) return 'refresh-token-reused'
  if (normalized.includes('401') || normalized.includes('unauthorized')) return 'unauthorized'
  if (normalized.includes('402') || normalized.includes('payment_required')) return 'payment-required'
  if (normalized.includes('not_found') || normalized.includes('not found')) return 'not-found'
  return 'status-warning'
}

export const deriveCodexRecord = (
  source: RawAuthRecord,
  authJson: Record<string, unknown> = {},
): CodexAuthRecord => {
  const idToken = readIdTokenObject(source)
  const planType = trimString(idToken?.plan_type).toLowerCase() || null
  const issueKind = resolveIssueKind(trimString(source.status_message))

  return {
    source,
    planType,
    systemGroup: planType === 'team' ? 'team' : planType === 'free' ? 'free' : 'other',
    chatgptAccountId: trimString(idToken?.chatgpt_account_id) || null,
    issueKind,
    cleanupCandidate:
      authJson.x_vc_cleanup_candidate === true ||
      issueKind === 'token-revoked' ||
      issueKind === 'refresh-token-reused' ||
      issueKind === 'unauthorized' ||
      issueKind === 'payment-required',
    disabled: source.disabled === true,
    customGroup: trimString(authJson.x_vc_group) || null,
    tags: normalizeTags(authJson.x_vc_tags),
    cleanupNote: trimString(authJson.x_vc_cleanup_note) || null,
  }
}

export const applyCodexMetadata = (
  authJson: Record<string, unknown>,
  patch: {
    customGroup?: string | null
    tags?: string[]
    cleanupCandidate?: boolean
    cleanupNote?: string | null
  },
): Record<string, unknown> => {
  const next = { ...authJson }

  if ('customGroup' in patch) {
    const value = trimString(patch.customGroup)
    if (value) next.x_vc_group = value
    else delete next.x_vc_group
  }

  if ('tags' in patch) {
    const tags = normalizeTags(patch.tags)
    if (tags.length > 0) next.x_vc_tags = tags
    else delete next.x_vc_tags
  }

  if ('cleanupCandidate' in patch) {
    if (patch.cleanupCandidate) next.x_vc_cleanup_candidate = true
    else delete next.x_vc_cleanup_candidate
  }

  if ('cleanupNote' in patch) {
    const note = trimString(patch.cleanupNote)
    if (note) next.x_vc_cleanup_note = note
    else delete next.x_vc_cleanup_note
  }

  return next
}

export const collectCleanupCandidateNames = (records: CodexAuthRecord[]): string[] =>
  records.filter((record) => record.cleanupCandidate).map((record) => record.source.name)

export const filterCodexRecords = (
  records: CodexAuthRecord[],
  filter: 'all' | 'team' | 'free' | 'cleanup' | 'disabled' | `group:${string}`,
  search: string,
): CodexAuthRecord[] => {
  const needle = search.trim().toLowerCase()

  return records.filter((record) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'team'
          ? record.systemGroup === 'team'
          : filter === 'free'
            ? record.systemGroup === 'free'
            : filter === 'cleanup'
              ? record.cleanupCandidate
              : filter === 'disabled'
                ? record.disabled
                : (record.customGroup || '').toLowerCase() === filter.slice('group:'.length).toLowerCase()

    if (!matchesFilter) return false
    if (!needle) return true

    return [
      record.source.name,
      record.planType,
      record.customGroup,
      record.chatgptAccountId,
      record.issueKind,
      record.source.note as string | undefined,
      ...record.tags,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle))
  })
}
