import { beforeEach, describe, expect, it } from 'vitest'
import { loadThemeMode, resolveTheme, saveThemeMode } from './theme'

describe('theme helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to auto when no theme is stored', () => {
    expect(loadThemeMode()).toBe('auto')
  })

  it('resolves auto mode from system preference', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
  })

  it('persists explicit theme mode', () => {
    saveThemeMode('dark')
    expect(loadThemeMode()).toBe('dark')
  })
})
