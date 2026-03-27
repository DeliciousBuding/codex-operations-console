import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('Codex Operations Console', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('shows login gate when session config is missing', () => {
    render(<App />)

    expect(screen.getByText('账号协作中心')).toBeInTheDocument()
    expect(screen.queryByLabelText('CPA Base URL')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Management Token')).not.toBeInTheDocument()
    expect(screen.getByText('先看示例数据')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '连接现有空间' })).toBeInTheDocument()
  })

  it('can enter demo workspace from the login screen', () => {
    render(<App />)

    fireEvent.click(screen.getByText('先看演示工作区'))

    expect(screen.getByRole('heading', { name: '今日总览' })).toBeInTheDocument()
    expect(screen.getByText('今天的重点')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /账户/ })).toBeInTheDocument()
  })

  it('reveals connection fields only after opening advanced access', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '连接现有空间' }))

    expect(screen.getByLabelText('CPA Base URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Management Token')).toBeInTheDocument()
    expect(screen.getByText('进入我的工作区')).toBeInTheDocument()
  })

  it('shows batch edit controls only after selecting account rows', () => {
    render(<App />)

    fireEvent.click(screen.getByText('先看演示工作区'))
    fireEvent.click(screen.getByRole('menuitem', { name: /账户/ }))

    expect(screen.queryByText(/已选择/)).not.toBeInTheDocument()
    expect(screen.queryByText('全选当前')).not.toBeInTheDocument()
    expect(screen.getByText('建议先从这里开始')).toBeInTheDocument()
    expect(screen.getByText('打开待确认队列')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('选择 team-main-01.json'))

    expect(screen.getByText(/已选择/)).toBeInTheDocument()
    expect(screen.getByText('移动到分组')).toBeInTheDocument()
    expect(screen.getByText('全选当前任务')).toBeInTheDocument()
    expect(screen.getByText('全选待确认')).toBeInTheDocument()
    expect(screen.getByText('当前查看')).toBeInTheDocument()
  })

  it('shows a user-facing preference space instead of design-system jargon', () => {
    render(<App />)

    fireEvent.click(screen.getByText('先看演示工作区'))
    fireEvent.click(screen.getByRole('menuitem', { name: /偏好/ }))

    expect(screen.getByRole('heading', { name: '我的空间' })).toBeInTheDocument()
    expect(screen.getByText('今天进入的是哪个空间')).toBeInTheDocument()
    expect(screen.getByText('今天进入前的提醒')).toBeInTheDocument()
    expect(screen.queryByText('Fluent 2 / Windows 11')).not.toBeInTheDocument()
  })
})
