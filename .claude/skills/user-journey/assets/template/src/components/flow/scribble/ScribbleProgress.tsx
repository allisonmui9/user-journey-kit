import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'

interface ScribbleProgressProps {
  /** Left edge of the card */
  x: number
  /** Top edge of the card */
  y: number
  width: number
  label: string
  /** 0–100 */
  percent: number
  /** Draw a dotted tether from this point down to the card */
  tetherFrom?: { x: number; y: number }
}

const PAD = 16
const BAR_H = 16
const FILL = '#8a8a8a'

export const PROGRESS_HEIGHT = PAD * 2 + TEXT_SIZE + 14 + BAR_H

/** A sketched progress bar: what's running, and how far along it is. */
export default function ScribbleProgress({
  x,
  y,
  width,
  label,
  percent,
  tetherFrom,
}: ScribbleProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const barY = y + PAD + TEXT_SIZE + 14
  const barW = width - PAD * 2

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
        height={PROGRESS_HEIGHT}
        rx={10}
        fill="#fff"
        stroke={INK}
        strokeWidth={STROKE}
      />

      <text
        x={x + PAD}
        y={y + PAD + TEXT_SIZE}
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {label}
      </text>
      <text
        x={x + width - PAD}
        y={y + PAD + TEXT_SIZE}
        textAnchor="end"
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {`${Math.round(clamped)}% complete`}
      </text>

      {/* Track, then the filled portion */}
      <rect
        x={x + PAD}
        y={barY}
        width={barW}
        height={BAR_H}
        rx={BAR_H / 2}
        fill="#fff"
        stroke={INK}
        strokeWidth={STROKE}
      />
      <rect
        x={x + PAD}
        y={barY}
        width={(barW * clamped) / 100}
        height={BAR_H}
        rx={BAR_H / 2}
        fill={FILL}
      />
    </g>
  )
}
