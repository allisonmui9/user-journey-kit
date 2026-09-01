import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'

interface ScribbleToggleProps {
  /** Left edge of the row */
  x: number
  /** Vertical center of the row */
  cy: number
  /** Right edge of the row — the toggle is right-aligned to it */
  rightX: number
  label: string
  on?: boolean
}

export const TOGGLE_ROW_HEIGHT = 26

const TRACK_W = 40
const TRACK_H = 20
const KNOB_R = 7

/** A sketched label + on/off switch row. */
export default function ScribbleToggle({
  x,
  cy,
  rightX,
  label,
  on = false,
}: ScribbleToggleProps) {
  const trackX = rightX - TRACK_W

  return (
    <g>
      <text
        x={x}
        y={cy + TEXT_SIZE / 3}
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {label}
      </text>
      <rect
        x={trackX}
        y={cy - TRACK_H / 2}
        width={TRACK_W}
        height={TRACK_H}
        rx={TRACK_H / 2}
        fill={on ? INK : '#fff'}
        stroke={INK}
        strokeWidth={STROKE}
      />
      <circle
        cx={on ? trackX + TRACK_W - TRACK_H / 2 : trackX + TRACK_H / 2}
        cy={cy}
        r={KNOB_R}
        fill={on ? '#fff' : INK}
      />
    </g>
  )
}
