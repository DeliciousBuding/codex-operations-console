import { describe, expect, it, beforeEach } from 'vitest'
import { clearSessionConfig, loadSessionConfig, saveSessionConfig } from './session'

describe('session config', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('stores and loads login config from sessionStorage', () => {
    saveSessionConfig({
      baseUrl: 'https://cpa.example.com',
      token: 'secret-token',
    })

    expect(loadSessionConfig()).toEqual({
      baseUrl: 'https://cpa.example.com',
      token: 'secret-token',
    })
  })

  it('returns null when required config is missing', () => {
    sessionStorage.setItem('codex_ops.base_url', 'https://cpa.example.com')
    expect(loadSessionConfig()).toBeNull()
  })

  it('clears session and returns to empty state', () => {
    saveSessionConfig({
      baseUrl: 'https://cpa.example.com',
      token: 'secret-token',
      demo: true,
    })

    clearSessionConfig()
    expect(loadSessionConfig()).toBeNull()
  })
})
