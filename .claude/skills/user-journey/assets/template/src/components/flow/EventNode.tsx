import CenteredLabel from './CenteredLabel'
import { HAND_FONT, INK, LINE_HEIGHT, STROKE, TEXT_SIZE, wrapLabel } from './tokens'

interface EventNodeProps {
  /** Center of the shape */
  cx: number
  cy: number
  label: string
  /** Optional left-aligned bullet list drawn under the label */
  bullets?: string[]
  width?: number
  height?: number
  /** Corner rounding; 0 for a hard square */
  radius?: number
  maxChars?: number
}

/** Event: a rounded square/rectangle with centered 14px text. */
export default function EventNode({
  cx,
  cy,
  label,
  bullets,
  width = 215,
  height = 119,
  radius = 26,
  maxChars = 22,
}: EventNodeProps) {
  const frame = (
    <rect
      x={cx - width / 2}
      y={cy - height / 2}
      width={width}
      height={height}
      rx={radius}
      ry={radius}
      stroke={INK}
      strokeWidth={STROKE}
      fill="#fff"
    />
  )

  if (!bullets?.length) {
    return (
      <g>
        {frame}
        <CenteredLabel cx={cx} cy={cy} label={label} maxChars={maxChars} />
      </g>
    )
  }

  // With bullets: centered label on top, bullets left-aligned beneath it.
  const labelLines = wrapLabel(label, maxChars)
  const blockHeight = (labelLines.length + bullets.length) * LINE_HEIGHT + 8
  const top = cy - blockHeight / 2 + TEXT_SIZE
  const bulletX = cx - width / 2 + 28

  return (
    <g>
      {frame}
      <text
        textAnchor="middle"
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {labelLines.map((line, i) => (
          <tspan key={i} x={cx} y={top + i * LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
      <text fontFamily={HAND_FONT} fontSize={TEXT_SIZE} fill={INK}>
        {bullets.map((bullet, i) => (
          <tspan
            key={i}
            x={bulletX}
            y={top + labelLines.length * LINE_HEIGHT + 8 + i * LINE_HEIGHT}
          >
            • {bullet}
          </tspan>
        ))}
      </text>
    </g>
  )
}
