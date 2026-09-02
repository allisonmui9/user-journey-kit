import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'
import ScribbleFill from './ScribbleFill'

export interface SelectOption {
  label: string
  /** Draw a gray scribble under the option, standing in for its description */
  description?: boolean
  /** Render with a hover highlight */
  hovered?: boolean
}

interface ScribbleOpenSelectProps {
  /** Left edge */
  x: number
  /** Top edge of the label */
  y: number
  width: number
  label: string
  /** Current value shown in the closed field */
  value: string
  options: SelectOption[]
}

const FIELD_H = 30
const LABEL_GAP = 8
const MENU_GAP = 8
const MENU_PAD = 8
const OPTION_LABEL_H = 22
const OPTION_DESC_H = 20
const HOVER_FILL = '#ececec'

function optionHeight(option: SelectOption): number {
  return OPTION_LABEL_H + (option.description ? OPTION_DESC_H : 0) + 8
}

export function openSelectHeight(options: SelectOption[]): number {
  const menu = options.reduce((sum, o) => sum + optionHeight(o), 0) + MENU_PAD * 2
  return TEXT_SIZE + LABEL_GAP + FIELD_H + MENU_GAP + menu
}

/** A sketched dropdown shown open, with its option menu and hover state. */
export default function ScribbleOpenSelect({
  x,
  y,
  width,
  label,
  value,
  options,
}: ScribbleOpenSelectProps) {
  const fieldY = y + TEXT_SIZE + LABEL_GAP
  const menuY = fieldY + FIELD_H + MENU_GAP
  const menuH = options.reduce((sum, o) => sum + optionHeight(o), 0) + MENU_PAD * 2
  const caretX = x + width - 18

  // Stacked option tops, computed up front
  const tops = options.reduce<number[]>((acc, _o, i) => {
    acc.push(i === 0 ? menuY + MENU_PAD : acc[i - 1] + optionHeight(options[i - 1]))
    return acc
  }, [])

  return (
    <g>
      <text x={x} y={y + TEXT_SIZE} fontFamily={HAND_FONT} fontSize={TEXT_SIZE} fill={INK}>
        {label}
      </text>

      {/* Closed field showing the current value */}
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
      {/* Caret points up while the menu is open */}
      <path
        d={`M ${caretX - 6} ${fieldY + FIELD_H / 2 + 3} L ${caretX} ${fieldY + FIELD_H / 2 - 4} L ${caretX + 6} ${fieldY + FIELD_H / 2 + 3}`}
        stroke={INK}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Open menu */}
      <rect
        x={x}
        y={menuY}
        width={width}
        height={menuH}
        rx={6}
        fill="#fff"
        stroke={INK}
        strokeWidth={STROKE}
      />
      {options.map((option, i) => (
        <g key={option.label}>
          {option.hovered && (
            <rect
              x={x + 4}
              y={tops[i] - 4}
              width={width - 8}
              height={optionHeight(option)}
              rx={4}
              fill={HOVER_FILL}
            />
          )}
          <text
            x={x + MENU_PAD + 6}
            y={tops[i] + TEXT_SIZE}
            fontFamily={HAND_FONT}
            fontSize={TEXT_SIZE}
            fill={INK}
          >
            {option.label}
          </text>
          {option.description && (
            <ScribbleFill
              x={x + MENU_PAD + 6}
              y={tops[i] + OPTION_LABEL_H}
              width={width - MENU_PAD * 2 - 12}
              lines={1}
            />
          )}
        </g>
      ))}
    </g>
  )
}
