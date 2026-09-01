import CenteredLabel from './CenteredLabel'
import { INK, STROKE } from './tokens'

interface ActionNodeProps {
  /** Center of the circle */
  cx: number
  cy: number
  label: string
  r?: number
  maxChars?: number
}

/** Action / process: a circle with centered 14px text. */
export default function ActionNode({ cx, cy, label, r = 60, maxChars = 10 }: ActionNodeProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} stroke={INK} strokeWidth={STROKE} fill="#fff" />
      <CenteredLabel cx={cx} cy={cy} label={label} maxChars={maxChars} />
    </g>
  )
}
