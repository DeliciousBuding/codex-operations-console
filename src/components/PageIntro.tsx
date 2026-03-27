import { memo } from 'react'

type PageIntroProps = {
  compact?: boolean
  eyebrow: string
  title: string
  description: string
  metaItems?: string[]
}

export const PageIntro = memo(function PageIntro({ compact = false, eyebrow, title, description, metaItems = [] }: PageIntroProps) {
  return (
    <section className={compact ? 'page-intro page-intro-compact' : 'page-intro'}>
      <div className="page-intro-copy">
        <span className="page-intro-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {!compact && metaItems.length > 0 ? (
        <div className="page-intro-meta">
          {metaItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}
    </section>
  )
})
