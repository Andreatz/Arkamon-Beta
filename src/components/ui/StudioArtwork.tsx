import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { assetUrl } from '@/utils/assetUrl'
import './studioArtwork.css'

/** Render the authored composition intact at the aspect ratio of its viewBox. */
export function StudioSurface({ source, width, height, className = '', style, children, ...props }: HTMLAttributes<HTMLDivElement> & {
  source: string; width: number; height: number
}) {
  return <div {...props} className={`studio-surface ${className}`} data-ui-asset={source} style={{ aspectRatio: `${width} / ${height}`, ...style }}>
    <img className="studio-surface-art" data-ui-skin-slot="frame" src={assetUrl(source)} alt="" draggable={false} />
    {children}
  </div>
}

export function StudioCommand({ selected = false, children, className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  const source = `/ui/studio/Scuro/${selected ? 'bottone-selezionato' : 'bottone'}.svg`
  return <button {...props} type={type} className={`studio-command ${className}`} data-ui-asset={source}>
    <img data-ui-skin-slot="frame" src={assetUrl(source)} alt="" draggable={false} />
    <span>{children}</span>
  </button>
}
