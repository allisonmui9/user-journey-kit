interface ScribbleFillProps {
  /** Left edge of the scribble block */
  x: number
  /** Top edge of the scribble block */
  y: number
  width: number
  /** How many scribbled lines to draw */
  lines?: number
  /** Fraction of `width` the last line covers, so blocks read as text */
  lastLineRatio?: number
}

export const SCRIBBLE_LINE_HEIGHT = 20
const AMPLITUDE = 2.5
const SEGMENT = 16
const COLOR = '#b8b8b8'
const WEIGHT = 7

/** One wavy stroke from (x, y) running `width` across. */
function squiggle(x: number, y: number, width: number): string {
  let d = `M ${x} ${y}`
  let cursor = x
  let up = true
  while (cursor < x + width) {
    const step = Math.min(SEGMENT, x + width - cursor)
    d += ` q ${step / 2} ${up ? -AMPLITUDE : AMPLITUDE} ${step} 0`
    cursor += step
    up = !up
  }
  return d
}

/**
 * Gray scribbled lines standing in for real UI content — a placeholder for
 * anything not worth drawing in detail on the flow diagram.
 */
export default function ScribbleFill({
  x,
  y,
  width,
  lines = 1,
  lastLineRatio = 0.6,
}: ScribbleFillProps) {
  return (
    <g>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1
        const lineWidth = isLast && lines > 1 ? width * lastLineRatio : width
        return (
          <path
            key={i}
            d={squiggle(x, y + WEIGHT / 2 + i * SCRIBBLE_LINE_HEIGHT, lineWidth)}
            stroke={COLOR}
            strokeWidth={WEIGHT}
            strokeLinecap="round"
            fill="none"
          />
        )
      })}
    </g>
  )
}
