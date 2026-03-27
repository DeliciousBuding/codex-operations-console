import { deriveCodexRecord } from '../lib/codex'
import type { CodexAuthRecord, CodexSessionConfig, RawAuthRecord } from '../types/codex'

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
})

export async function probeConnection(config: CodexSessionConfig): Promise<void> {
  if (config.demo) return

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v0/management/auth-files`, {
    headers: authHeaders(config.token),
  })

  if (!response.ok) {
    throw new Error(`连接失败：${response.status}`)
  }
}

export async function fetchCodexRecords(config: CodexSessionConfig): Promise<CodexAuthRecord[]> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v0/management/auth-files`, {
    headers: authHeaders(config.token),
  })

  if (!response.ok) {
    throw new Error(`加载账号失败：${response.status}`)
  }

  const payload = (await response.json()) as { files?: RawAuthRecord[] }
  const codexFiles = (payload.files || []).filter((record) =>
    String(record.provider ?? record.type ?? '').trim().toLowerCase() === 'codex',
  )

  const records = await Promise.all(
    codexFiles.map(async (record) => {
      const authJson = await downloadAuthJson(config, record.name).catch(() => ({}))
      return deriveCodexRecord(record, authJson)
    }),
  )

  return records
}

export async function downloadAuthJson(
  config: CodexSessionConfig,
  name: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, '')}/v0/management/auth-files/download?name=${encodeURIComponent(name)}`,
    { headers: authHeaders(config.token) },
  )

  if (!response.ok) {
    throw new Error(`下载账号 JSON 失败：${response.status}`)
  }

  return (await response.json()) as Record<string, unknown>
}

export async function saveAuthJson(
  config: CodexSessionConfig,
  name: string,
  json: Record<string, unknown>,
): Promise<void> {
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, '')}/v0/management/auth-files?name=${encodeURIComponent(name)}`,
    {
      method: 'POST',
      headers: authHeaders(config.token),
      body: JSON.stringify(json),
    },
  )

  if (!response.ok) {
    throw new Error(`保存账号 JSON 失败：${response.status}`)
  }
}

export async function setAuthDisabled(
  config: CodexSessionConfig,
  name: string,
  disabled: boolean,
): Promise<void> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/v0/management/auth-files/status`, {
    method: 'PATCH',
    headers: authHeaders(config.token),
    body: JSON.stringify({ name, disabled }),
  })

  if (!response.ok) {
    throw new Error(`更新账号状态失败：${response.status}`)
  }
}

export async function deleteAuthFile(config: CodexSessionConfig, name: string): Promise<void> {
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, '')}/v0/management/auth-files?name=${encodeURIComponent(name)}`,
    {
      method: 'DELETE',
      headers: authHeaders(config.token),
    },
  )

  if (!response.ok) {
    throw new Error(`删除账号失败：${response.status}`)
  }
}
