import { Button, Card, Input, Typography } from '@douyinfe/semi-ui'
import { LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { memo, useState } from 'react'
import type { CodexSessionConfig } from '../types/codex'

type LoginPageProps = {
  onSubmit: (config: CodexSessionConfig) => Promise<void>
  onDemo: () => void
}

const featureNotes = [
  '在同一个界面里查看账号状态、待处理变化和分组结构',
  '先看到需要处理的变化，再决定下一步操作',
  '让团队成员更容易对齐当前状态和处理节奏',
]

const loginHighlights = [
  {
    title: '先看示例数据',
    description: '先快速浏览整体布局、提醒节奏和处理路径，再决定是否连接自己的空间。',
  },
  {
    title: '连接现有空间',
    description: '如果你已经有连接地址和访问凭证，可以直接进入自己的空间继续处理。',
  },
  {
    title: '先了解边界',
    description: '示例数据不会碰到真实账号，你可以先完整走一遍页面、流程和提示逻辑。',
  },
]

export const LoginPage = memo(function LoginPage({ onSubmit, onDemo }: LoginPageProps) {
  const { Title, Text } = Typography
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit({ baseUrl, token })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '连接失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <Card className="login-card" bordered={false} shadows="always">
        <div className="login-layout">
          <section className="login-showcase">
            <div className="login-badge">账号协作中心</div>
            <div className="login-kicker-row">
              <span className="login-kicker-chip">工作台入口</span>
              <span className="login-kicker-note">当前状态 / 待处理 / 同步记录</span>
            </div>
            <Title heading={2} className="login-title">
              把连接状态、待处理变化和账号分组放在一个界面里
            </Title>
            <Text className="login-description">
              帮助你更快看清当前环境、待处理变化和下一步操作，不用在多个页面之间来回切换。
            </Text>

            <div className="login-feature-grid">
              {featureNotes.map((note) => (
                <div key={note} className="login-feature-card">
                  <Sparkles size={14} />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <div className="login-stat-strip">
              <div className="login-stat-tile">
                <ShieldCheck size={16} />
                <div>
                  <strong>会话内有效</strong>
                  <span>关闭页面后凭据自动失效</span>
                </div>
              </div>
              <div className="login-stat-tile">
                <LockKeyhole size={16} />
                <div>
                  <strong>统一管理</strong>
                  <span>分层查看、分组组织、状态监控</span>
                </div>
              </div>
            </div>

            <div className="login-highlight-grid">
              {loginHighlights.map((item) => (
                <article key={item.title} className="login-highlight-card">
                  <span className="login-highlight-kicker">{item.title}</span>
                  <strong>{item.description}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="login-form-shell">
            <div className="login-form-head">
              <span className="login-form-kicker">开始使用</span>
              <h3>先看示例数据，或者直接进入你的空间</h3>
              <p>你可以先通过示例数据熟悉界面，也可以直接输入连接地址和凭证，进入自己的空间继续处理。</p>
            </div>

            <div className="login-actions login-actions-primary">
              <Button className="primary-button" size="large" theme="solid" type="primary" onClick={onDemo}>
                先看演示工作区
              </Button>
              <Button
                className="secondary-button"
                size="large"
                theme="light"
                type="tertiary"
                onClick={() => setShowConnectionForm((current) => !current)}
              >
                {showConnectionForm ? '收起连接信息' : '连接现有空间'}
              </Button>
            </div>

            {showConnectionForm ? (
              <form className="login-form" onSubmit={handleSubmit}>
                <Input
                  aria-label="CPA Base URL"
                  value={baseUrl}
                  onChange={setBaseUrl}
                  placeholder="https://cpa.example.com"
                  addonBefore="连接地址"
                  size="large"
                />
                <Input
                  aria-label="Management Token"
                  type="password"
                  value={token}
                  onChange={setToken}
                  placeholder="请输入访问令牌"
                  addonBefore="访问令牌"
                  size="large"
                />

                {error ? <div className="form-error">{error}</div> : null}

                <div className="login-actions">
                  <Button className="primary-button" loading={loading} size="large" theme="solid" type="primary" htmlType="submit">
                    {loading ? '连接中…' : '进入我的工作区'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="login-preview-card">
                <strong>示例数据会展示：</strong>
                <span>账号分层、待处理变化、最近同步和批量操作路径。</span>
                <span>如果这套节奏正适合你，再连接自己的空间继续使用。</span>
              </div>
            )}

            <div className="login-footnote">
              <span>连接信息只在需要时展开，避免把入口页变成参数面板。</span>
              <strong>演示模式不会修改真实数据；高风险批量操作也只会在明确选中后显示。</strong>
            </div>
          </section>
        </div>
      </Card>
    </main>
  )
})
