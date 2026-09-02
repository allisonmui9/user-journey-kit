import type { ReactNode } from 'react'
import { INK, RETRO_FONT } from '../theme'

interface RetroMenuBarProps {
  /** Shown after the diamond; defaults to the prototype's name */
  title?: string
  /** When set, a back arrow appears at the far left */
  onBack?: () => void
  /** Extra menu items, e.g. "Start over" on a journey page */
  children?: ReactNode
}

const itemStyle = {
  fontFamily: RETRO_FONT,
  fontSize: '14px',
  color: INK,
  background: 'none',
  border: 'none',
  padding: '2px 4px',
  cursor: 'pointer',
} as const

/** The desktop menu bar, shared by every screen. */
export default function RetroMenuBar({ title, onBack, children }: RetroMenuBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '4px 12px',
        background: '#fff',
        borderBottom: `2px solid ${INK}`,
        fontFamily: RETRO_FONT,
        fontSize: '14px',
        color: INK,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          title="Back"
          style={{
            ...itemStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '1px 8px',
            border: `2px solid ${INK}`,
            background: '#ffe066',
            boxShadow: `2px 2px 0 ${INK}`,
          }}
        >
          ◀ back
        </button>
      )}
      <span style={{ fontWeight: 700 }}>◆ {title ?? 'User Journeys'}</span>
      {children}
      <span style={{ marginLeft: 'auto' }}>▚ 100% ▚</span>
    </div>
  )
}

export { itemStyle as retroMenuItemStyle }
