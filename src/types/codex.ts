export type RawAuthRecord = {
  name: string
  type?: string
  provider?: string
  disabled?: boolean
  status?: string
  status_message?: string
  note?: string
  priority?: number | string
  id_token?: Record<string, unknown> | string
  [key: string]: unknown
}

export type CodexIssueKind =
  | 'token-revoked'
  | 'refresh-token-reused'
  | 'unauthorized'
  | 'payment-required'
  | 'not-found'
  | 'status-warning'
  | null

export type CodexSystemGroup = 'team' | 'free' | 'other'

export type CodexAuthRecord = {
  source: RawAuthRecord
  planType: string | null
  systemGroup: CodexSystemGroup
  chatgptAccountId: string | null
  issueKind: CodexIssueKind
  cleanupCandidate: boolean
  disabled: boolean
  customGroup: string | null
  tags: string[]
  cleanupNote: string | null
}

export type CodexSessionConfig = {
  baseUrl: string
  token: string
  demo?: boolean
}

export type CodexBatchActionPayload = {
  names: string[]
  action:
    | 'assign-group'
    | 'mark-cleanup'
    | 'clear-cleanup'
    | 'disable'
    | 'delete'
  group?: string
  note?: string
}
