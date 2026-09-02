import CenteredLabel from './CenteredLabel'
import { INK, STROKE } from './tokens'

interface DecisionNodeProps {
  /** Center of the diamond */
  cx: number
  cy: number
  label: string
  /** Half-width (horizontal point-to-center distance) */
  rx?: number
  /** Half-height (vertical point-to-center distance) */
  ry?: number
  maxChars?: number
}

/** Decision: a diamond with centered 14px text. */
export default function DecisionNode({
  cx,
  cy,
  label,
  rx = 102,
  ry = 98,
  maxChars = 9,
}: DecisionNodeProps) {
  return (
    <g>
      <path
        d={`M ${cx} ${cy - ry} L ${cx + rx} ${cy} L ${cx} ${cy + ry} L ${cx - rx} ${cy} Z`}
        stroke={INK}
        strokeWidth={STROKE}
        fill="#fff"
        strokeLinejoin="round"
      />
      <CenteredLabel cx={cx} cy={cy} label={label} maxChars={maxChars} />
    </g>
  )
}
