import type { CodexSessionConfig } from '../types/codex'

export const SESSION_BASE_URL_KEY = 'codex_ops.base_url'
export const SESSION_TOKEN_KEY = 'codex_ops.token'
export const SESSION_DEMO_KEY = 'codex_ops.demo'

export const loadSessionConfig = (): CodexSessionConfig | null => {
  const baseUrl = sessionStorage.getItem(SESSION_BASE_URL_KEY)?.trim() || ''
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY)?.trim() || ''
  const demo = sessionStorage.getItem(SESSION_DEMO_KEY) === 'true'

  if (demo) {
    return {
      baseUrl,
      token,
      demo: true,
    }
  }

  if (!baseUrl || !token) return null

  return { baseUrl, token }
}

export const saveSessionConfig = (config: CodexSessionConfig) => {
  sessionStorage.setItem(SESSION_BASE_URL_KEY, config.baseUrl.trim())
  sessionStorage.setItem(SESSION_TOKEN_KEY, config.token.trim())
  if (config.demo) sessionStorage.setItem(SESSION_DEMO_KEY, 'true')
  else sessionStorage.removeItem(SESSION_DEMO_KEY)
}

export const clearSessionConfig = () => {
  sessionStorage.removeItem(SESSION_BASE_URL_KEY)
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
  sessionStorage.removeItem(SESSION_DEMO_KEY)
}
