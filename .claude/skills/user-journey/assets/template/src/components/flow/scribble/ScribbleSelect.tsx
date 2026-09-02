import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'

interface ScribbleSelectProps {
  /** Left edge of the field */
  x: number
  /** Top of the field's label */
  y: number
  width: number
  label: string
  value: string
}

const FIELD_H = 30
const LABEL_GAP = 8

export const SELECT_HEIGHT = TEXT_SIZE + LABEL_GAP + FIELD_H

/** A sketched dropdown: label above, boxed value with a caret. */
export default function ScribbleSelect({ x, y, width, label, value }: ScribbleSelectProps) {
  const fieldY = y + TEXT_SIZE + LABEL_GAP
  const caretX = x + width - 18

  return (
    <g>
      <text x={x} y={y + TEXT_SIZE} fontFamily={HAND_FONT} fontSize={TEXT_SIZE} fill={INK}>
        {label}
      </text>
      <rect
        x={x}
        y={fieldY}
        width={width}
        height={FIELD_H}
        rx={5}
        fill="#fff"
        stroke={INK}
        strokeWidth={STROKE}
      />
      <text
        x={x + 10}
        y={fieldY + FIELD_H / 2 + TEXT_SIZE / 3}
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {value}
      </text>
      {/* Caret */}
      <path
        d={`M ${caretX - 6} ${fieldY + FIELD_H / 2 - 3} L ${caretX} ${fieldY + FIELD_H / 2 + 4} L ${caretX + 6} ${fieldY + FIELD_H / 2 - 3}`}
        stroke={INK}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}
