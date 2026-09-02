import { HAND_FONT, LINE_HEIGHT, TEXT_SIZE, wrapLabel } from './tokens'

interface OpenQuestionProps {
  /** Left edge of the text block */
  x: number
  /** Top of the first line */
  y: number
  /** Wrapping width */
  width: number
  questions: string[]
}

const RED = '#d02a2a'
/** Roughly the average glyph width of the hand font at TEXT_SIZE */
const CHAR_W = 7

export function openQuestionHeight(questions: string[], width: number): number {
  const maxChars = Math.floor(width / CHAR_W)
  const lines = questions.reduce(
    (sum, q) => sum + wrapLabel(q, maxChars).length,
    0,
  )
  return lines * LINE_HEIGHT + (questions.length - 1) * 6
}

/** Unresolved design questions, called out in red beside the step they concern. */
export default function OpenQuestion({ x, y, width, questions }: OpenQuestionProps) {
  const maxChars = Math.floor(width / CHAR_W)

  // Flatten to positioned lines so wrapped questions stay grouped
  let cursor = 0
  const rows = questions.flatMap((question, qi) => {
    const lines = wrapLabel(question, maxChars)
    return lines.map((line, li) => {
      const top = y + cursor * LINE_HEIGHT + qi * 6
      cursor += 1
      return { key: `${qi}-${li}`, text: li === 0 ? `- ${line}` : `  ${line}`, top }
    })
  })

  return (
    <g>
      <text fontFamily={HAND_FONT} fontSize={TEXT_SIZE} fill={RED}>
        {rows.map((row) => (
          <tspan key={row.key} x={x} y={row.top}>
            {row.text}
          </tspan>
        ))}
      </text>
    </g>
  )
}
