import { HAND_FONT, INK, LINE_HEIGHT, TEXT_SIZE, wrapLabel } from './tokens'

interface CenteredLabelProps {
  /** Center of the shape the label sits inside */
  cx: number
  cy: number
  label: string
  /** Characters per line before wrapping */
  maxChars: number
}

/** 14px hand-drawn text, wrapped and vertically centered on (cx, cy). */
export default function CenteredLabel({ cx, cy, label, maxChars }: CenteredLabelProps) {
  const lines = wrapLabel(label, maxChars)
  const firstY = cy - ((lines.length - 1) * LINE_HEIGHT) / 2 + TEXT_SIZE / 3

  return (
    <text
      textAnchor="middle"
      fontFamily={HAND_FONT}
      fontSize={TEXT_SIZE}
      
      fill={INK}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={cx} y={firstY + i * LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  )
}
