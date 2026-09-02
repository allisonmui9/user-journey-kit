import type { ReactNode } from 'react'
import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'

interface ScribblePanelProps {
  /** Left edge of the panel */
  x: number
  /** Top edge of the panel */
  y: number
  width: number
  height: number
  title: string
  /** Rows drawn inside the panel, positioned with PANEL_PADDING + CONTENT_TOP */
  children?: ReactNode
  /** Draw a dotted tether from this point up to the panel */
  tetherFrom?: { x: number; y: number }
}

export const PANEL_PADDING = 16
/** Vertical offset from the panel's top to the first content row */
export const CONTENT_TOP = PANEL_PADDING + TEXT_SIZE + 14

/**
 * A sketched UI panel that annotates a flow step — a titled box holding
 * small mock controls, tethered to the step above it.
 */
export default function ScribblePanel({
  x,
  y,
  width,
  height,
  title,
  children,
  tetherFrom,
}: ScribblePanelProps) {
  return (
    <g>
      {tetherFrom && (
        <line
          x1={tetherFrom.x}
          y1={tetherFrom.y}
          x2={x + width / 2}
          y2={y}
          stroke={INK}
          strokeWidth={STROKE}
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
      )}

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        fill="#fff"
        stroke={INK}
        strokeWidth={STROKE}
      />

      <text
        x={x + PANEL_PADDING}
        y={y + PANEL_PADDING + TEXT_SIZE}
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {title}
      </text>
      {/* Rule under the title */}
      <line
        x1={x + PANEL_PADDING}
        y1={y + PANEL_PADDING + TEXT_SIZE + 7}
        x2={x + width - PANEL_PADDING}
        y2={y + PANEL_PADDING + TEXT_SIZE + 7}
        stroke={INK}
        strokeWidth={1}
      />

      {children}
    </g>
  )
}
