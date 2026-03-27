import { memo, type ReactNode } from 'react'
import { LayoutDashboard, ListChecks, Settings, ShieldAlert } from 'lucide-react'

type ViewKey = 'overview' | 'accounts' | 'cleanup' | 'settings'

type SidebarNavProps = {
  active: ViewKey
  onChange: (view: ViewKey) => void
}

const items: Array<{ key: ViewKey; label: string; icon: ReactNode }> = [
  { key: 'overview', label: '总览', icon: <LayoutDashboard size={18} /> },
  { key: 'accounts', label: '账户', icon: <ListChecks size={18} /> },
  { key: 'cleanup', label: '提醒', icon: <ShieldAlert size={18} /> },
  { key: 'settings', label: '偏好', icon: <Settings size={18} /> },
]

export const SidebarNav = memo(function SidebarNav({ active, onChange }: SidebarNavProps) {
  return (
    <div className="sidebar-nav-shell">
      <div className="codex-nav-list" role="menu" aria-label="主导航">
        {items.map((item) => {
          const selected = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`codex-nav-item ${selected ? 'codex-nav-item-selected' : ''}`}
              onClick={() => onChange(item.key)}
            >
              <span className="codex-nav-item-icon">{item.icon}</span>
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
