import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import './primitives.css'

/**
 * Audit fase 2 — componenti base del design system.
 * Sono volutamente sottili: portano classi e attributi coerenti, mentre il comportamento
 * (focus, scorciatoie, animazioni) resta ai chiamanti che lo gestiscono già.
 */

export type ArkaButtonTone = 'secondary' | 'primary' | 'danger' | 'ghost'

export const ArkaButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ArkaButtonTone; size?: 'md' | 'lg' }>(
  function ArkaButton({ tone = 'secondary', size = 'md', className = '', type = 'button', ...props }, ref) {
    return <button {...props} ref={ref} type={type} className={`arka-ds-button ${className}`} data-tone={tone} data-size={size} />
  },
)

export function ArkaPanel({ as: Tag = 'section', density = 'normal', className = '', ...props }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' | 'aside'; density?: 'normal' | 'compact' }) {
  return <Tag {...props} className={`arka-ds-panel ${className}`} data-density={density} />
}

/** Riquadro di dialogo: lo sfondo e il pannello; il chiamante resta responsabile di focus ed Esc. */
export const ArkaModalFrame = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { title: ReactNode; kicker?: ReactNode; description?: ReactNode; titleId?: string; descriptionId?: string; footer?: ReactNode }>(
  function ArkaModalFrame({ title, kicker, description, titleId, descriptionId, footer, children, className = '', ...props }, ref) {
    const fallbackTitle = useId()
    const fallbackDescription = useId()
    const tId = titleId ?? fallbackTitle
    const dId = descriptionId ?? fallbackDescription
    return <div {...props} ref={ref} role="dialog" aria-modal="true" aria-labelledby={tId} aria-describedby={description ? dId : undefined} className={`arka-ds-backdrop ${className}`}>
      <div className="arka-ds-panel arka-ds-modal">
        <header>
          {kicker && <span className="arka-ds-kicker">{kicker}</span>}
          <h2 id={tId} className="arka-ds-title">{title}</h2>
          {description && <p id={dId} className="arka-ds-text">{description}</p>}
        </header>
        {children}
        {footer && <div className="arka-ds-modal-actions">{footer}</div>}
      </div>
    </div>
  },
)

export interface ArkaTab<T extends string> { id: T; label: ReactNode }

/** Schede accessibili (tablist) con frecce sinistra/destra, Home e Fine. */
export function ArkaTabs<T extends string>({ tabs, value, onChange, label, className = '' }: { tabs: readonly ArkaTab<T>[]; value: T; onChange: (id: T) => void; label: string; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const move = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next = event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : -1
    if (next < 0) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return <div role="tablist" aria-label={label} className={`arka-ds-tabs ${className}`}>
    {tabs.map((tab, index) => <button key={tab.id} ref={(node) => { refs.current[index] = node }} type="button" role="tab" className="arka-ds-tab"
      aria-selected={tab.id === value} tabIndex={tab.id === value ? 0 : -1} onClick={() => onChange(tab.id)} onKeyDown={(event) => move(event, index)}>{tab.label}</button>)}
  </div>
}

type CardContent = { icon?: ReactNode; title: ReactNode; meta?: ReactNode; badge?: ReactNode; accent?: 'gold'; layout?: 'stack' | 'row' }

function CardBody({ icon, title, meta, badge }: CardContent) {
  return <>
    {icon && <span className="arka-ds-card-icon" aria-hidden="true">{icon}</span>}
    <span className="grid min-w-0 gap-1"><span className="arka-ds-card-title">{title}</span>{meta && <span className="arka-ds-card-meta">{meta}</span>}</span>
    {badge && <span className="arka-ds-card-badge">{badge}</span>}
  </>
}

/** Scheda informativa o, con `onClick`, scheda-comando. */
export function ArkaCard({ icon, title, meta, badge, accent, layout = 'stack', className = '', ...props }: CardContent & Omit<HTMLAttributes<HTMLDivElement>, 'title'>) {
  return <div {...props} className={`arka-ds-card ${className}`} data-accent={accent} data-layout={layout}><CardBody icon={icon} title={title} meta={meta} badge={badge} /></div>
}

export function ArkaCardButton({ icon, title, meta, badge, accent, layout = 'stack', className = '', type = 'button', ...props }: CardContent & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'>) {
  return <button {...props} type={type} className={`arka-ds-card ${className}`} data-accent={accent} data-layout={layout}><CardBody icon={icon} title={title} meta={meta} badge={badge} /></button>
}
