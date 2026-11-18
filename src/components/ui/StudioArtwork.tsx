import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import './studioArtwork.css'
import './menuArtworkFallback.css'

/**
 * Superficie con le proporzioni della composizione originale. L'SVG non si disegna più
 * (modalità SVG rimossa il 18 novembre 2026): `data-ui-asset` resta per le skin di UI Studio.
 */
export function StudioSurface({ source, width, height, className = '', style, children, ...props }: HTMLAttributes<HTMLDivElement> & {
  source: string; width: number; height: number
}) {
  return <div {...props} className={`studio-surface ${className}`} data-menu-artwork="css" data-ui-asset={source} style={{ aspectRatio: `${width} / ${height}`, ...style }}>
    {children}
  </div>
}

export function StudioCommand({ selected = false, children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  const source = `/ui/studio/Scuro/${selected ? 'bottone-selezionato' : 'bottone'}.svg`
  return <button {...props} type={type} className={`studio-command ${className}`} data-menu-artwork="css" data-selected={selected || undefined} data-ui-asset={source}>
    <span>{children}</span>
  </button>
}
