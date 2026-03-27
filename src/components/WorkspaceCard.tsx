import { memo } from 'react'
import { Card } from '@douyinfe/semi-ui'
import type { ReactNode } from 'react'

type WorkspaceCardProps = {
  title?: string
  description?: string
  eyebrow?: string
  headerTag?: ReactNode
  tabsArea?: ReactNode
  actionsArea?: ReactNode
  searchArea?: ReactNode
  footerArea?: ReactNode
  children: ReactNode
}

export const WorkspaceCard = memo(function WorkspaceCard({
  title,
  description,
  eyebrow,
  headerTag,
  tabsArea,
  actionsArea,
  searchArea,
  footerArea,
  children,
}: WorkspaceCardProps) {
  const hasCopy = Boolean(eyebrow || title || description || headerTag)

  return (
    <Card className="workspace-card" bordered={false} shadows="hover">
      <div className={`workspace-card-head ${!hasCopy ? 'workspace-card-head-compact' : ''}`}>
        {hasCopy ? (
          <div className="workspace-card-copy">
            {eyebrow ? <span className="workspace-card-eyebrow">{eyebrow}</span> : null}
            <div className="workspace-card-title-row">
              <div>
                {title ? <h3>{title}</h3> : null}
                {description ? <p>{description}</p> : null}
              </div>
              {headerTag ? <div className="workspace-card-tag">{headerTag}</div> : null}
            </div>
          </div>
        ) : null}

        {tabsArea ? <div className="workspace-card-tabs">{tabsArea}</div> : null}
        {actionsArea ? <div className="workspace-card-actions">{actionsArea}</div> : null}
        {searchArea ? <div className="workspace-card-search">{searchArea}</div> : null}
      </div>

      <div className="workspace-card-body">{children}</div>
      {footerArea ? <div className="workspace-card-footer">{footerArea}</div> : null}
    </Card>
  )
})
