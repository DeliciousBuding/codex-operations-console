import { describe, expect, it } from 'vitest'
import { applyCodexMetadata, collectCleanupCandidateNames, deriveCodexRecord, filterCodexRecords } from './codex'
import type { RawAuthRecord } from '../types/codex'

describe('deriveCodexRecord', () => {
  it('derives team and free groups from plan_type', () => {
    const team = deriveCodexRecord({
      name: 'team.json',
      type: 'codex',
      id_token: { plan_type: 'team', chatgpt_account_id: 'acct_team' },
    })
    const free = deriveCodexRecord({
      name: 'free.json',
      type: 'codex',
      id_token: { plan_type: 'free', chatgpt_account_id: 'acct_free' },
    })

    expect(team.systemGroup).toBe('team')
    expect(free.systemGroup).toBe('free')
  })

  it('treats token_revoked as top priority cleanup candidate', () => {
    const record = deriveCodexRecord({
      name: 'revoked.json',
      type: 'codex',
      status_message:
        '{"error":{"message":"Encountered invalidated oauth token for user, failing request","code":"token_revoked"},"status":401}',
      id_token: { plan_type: 'free', chatgpt_account_id: 'acct_revoked' },
    })

    expect(record.issueKind).toBe('token-revoked')
    expect(record.cleanupCandidate).toBe(true)
  })

  it('detects refresh_token_reused and unauthorized states', () => {
    const reused = deriveCodexRecord({
      name: 'reused.json',
      type: 'codex',
      status_message: 'refresh_token_reused',
    })
    const unauthorized = deriveCodexRecord({
      name: 'unauthorized.json',
      type: 'codex',
      status_message: 'unauthorized',
    })

    expect(reused.issueKind).toBe('refresh-token-reused')
    expect(unauthorized.issueKind).toBe('unauthorized')
    expect(reused.cleanupCandidate).toBe(true)
    expect(unauthorized.cleanupCandidate).toBe(true)
  })
})

describe('metadata helpers', () => {
  it('reads and writes x_vc metadata fields', () => {
    const next = applyCodexMetadata(
      { type: 'codex', x_vc_group: 'old', x_vc_cleanup_candidate: true },
      {
        customGroup: 'mine',
        tags: ['team', 'manual'],
        cleanupCandidate: false,
        cleanupNote: '',
      },
    )

    expect(next.x_vc_group).toBe('mine')
    expect(next.x_vc_tags).toEqual(['team', 'manual'])
    expect(next.x_vc_cleanup_candidate).toBeUndefined()
    expect(next.x_vc_cleanup_note).toBeUndefined()
  })
})

describe('collection and filtering', () => {
  const raw: RawAuthRecord[] = [
    {
      name: 'cleanup.json',
      type: 'codex',
      status_message: 'token_revoked',
      id_token: { plan_type: 'free', chatgpt_account_id: 'acct1' },
    },
    {
      name: 'team.json',
      type: 'codex',
      id_token: { plan_type: 'team', chatgpt_account_id: 'acct2' },
      disabled: true,
    },
  ]

  const records = [
    deriveCodexRecord(raw[0], { x_vc_group: 'batch-free' }),
    deriveCodexRecord(raw[1], { x_vc_group: 'mine' }),
  ]

  it('collects all cleanup candidate names', () => {
    expect(collectCleanupCandidateNames(records)).toEqual(['cleanup.json'])
  })

  it('filters by group, cleanup and disabled without conflict', () => {
    expect(filterCodexRecords(records, 'cleanup', '').map((item) => item.source.name)).toEqual([
      'cleanup.json',
    ])
    expect(filterCodexRecords(records, 'disabled', '').map((item) => item.source.name)).toEqual([
      'team.json',
    ])
    expect(filterCodexRecords(records, 'group:mine', '').map((item) => item.source.name)).toEqual([
      'team.json',
    ])
  })
})
