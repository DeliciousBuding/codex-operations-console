import { memo } from 'react'
import { Card } from '@douyinfe/semi-ui'

type MetricCardProps = {
  label: string
  value: string
  accent?: 'team' | 'free' | 'cleanup' | 'disabled'
  hint?: string
  trend?: number[]
}

export const MetricCard = memo(function MetricCard({ label, value, accent = 'team', hint, trend = [] }: MetricCardProps) {
  return (
    <Card className={`metric-card metric-${accent}`} shadows="hover" bordered={false}>
      <div className="metric-card-inner">
        <div className="metric-card-head">
          <span className="metric-label">{label}</span>
          <span className={`metric-dot metric-dot-${accent}`} />
        </div>

        <div className="metric-card-main">
          <div className="metric-copy">
            <strong className="metric-value">{value}</strong>
            {hint ? <span className="metric-hint">{hint}</span> : null}
          </div>

          {trend.length > 0 ? (
            <div className="metric-trend" aria-hidden="true">
              {trend.map((item, index) => (
                <span
                  key={`${label}-${index}`}
                  className="metric-trend-bar"
                  style={{ height: `${Math.max(14, Math.min(42, item))}px` }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
})
