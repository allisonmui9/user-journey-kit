import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'
import ScribbleFill, { SCRIBBLE_LINE_HEIGHT } from './ScribbleFill'

export interface SpecRow {
  /** Right-aligned label in the left column */
  label: string
  /** Scribbled placeholder lines standing in for the row's controls */
  lines?: number
  /** A real value shown instead of a scribble */
  value?: string
  /** Draw the value inside a dropdown field with a caret */
  asSelect?: boolean
  /** Indented sub-fields, e.g. autoscaling's min and max */
  nested?: { label: string; value: string }[]
}

interface ScribbleSpecCardProps {
  /** Left edge of the card */
  x: number
  /** Top edge of the card */
  y: number
  width: number
  /** Bold title in the header strip, e.g. the selected tier */
  title: string
  /** Real values kept in the header strip: RAM, storage, vCPU, price */
  headerCells?: string[]
  rows: SpecRow[]
  /** Draw a dotted tether from this point down to the card */
  tetherFrom?: { x: number; y: number }
}

const HEADER_H = 44
const LABEL_COL = 128 // width of the left label column
const PAD = 16
const ROW_PAD = 14 // breathing room above and below each row's content

const FIELD_H = 30
const NESTED_H = 52

function rowHeight(row: SpecRow): number {
  const content = row.value
    ? row.asSelect
      ? FIELD_H
      : SCRIBBLE_LINE_HEIGHT
    : (row.lines ?? 1) * SCRIBBLE_LINE_HEIGHT
  return content + (row.nested?.length ? NESTED_H + 8 : 0) + ROW_PAD
}

export function specCardHeight(rows: SpecRow[]): number {
  return HEADER_H + rows.reduce((sum, row) => sum + rowHeight(row), 0) + PAD
}

/**
 * A sketched settings card: header strip, right-aligned labels down the left,
 * gray scribble placeholders standing in for each row's controls.
 */
export default function ScribbleSpecCard({
  x,
  y,
  width,
  title,
  headerCells,
  rows,
  tetherFrom,
}: ScribbleSpecCardProps) {
  const height = specCardHeight(rows)
  const contentX = x + LABEL_COL + PAD
  const contentW = width - LABEL_COL - PAD * 2

  // Stacked row tops, computed up front so nothing mutates during render
  const rowTops = rows.reduce<number[]>((tops, _row, i) => {
    tops.push(i === 0 ? y + HEADER_H : tops[i - 1] + rowHeight(rows[i - 1]))
    return tops
  }, [])

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

      {/* Card frame */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        fill="#fff"
        stroke={INK}
        strokeWidth={STROKE}
      />

      {/* Header strip: title plus a scribble for the spec summary */}
      <path
        d={`M ${x} ${y + HEADER_H} L ${x + width} ${y + HEADER_H}`}
        stroke={INK}
        strokeWidth={STROKE}
      />
      <text
        x={x + PAD}
        y={y + HEADER_H / 2 + TEXT_SIZE / 3}
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fontWeight="bold"
        fill={INK}
      >
        {title}
      </text>
      {/* Header cells keep their real values — RAM, storage, vCPU, price */}
      {headerCells !== undefined ? (
        headerCells.map((cell, i) => {
          const cellW = (width - LABEL_COL) / headerCells.length
          const cellX = x + LABEL_COL + cellW * i
          return (
            <g key={cell}>
              {i > 0 && (
                <path
                  d={`M ${cellX} ${y + 8} L ${cellX} ${y + HEADER_H - 8}`}
                  stroke={INK}
                  strokeWidth={1}
                />
              )}
              <text
                x={cellX + cellW / 2}
                y={y + HEADER_H / 2 + TEXT_SIZE / 3}
                textAnchor="middle"
                fontFamily={HAND_FONT}
                fontSize={TEXT_SIZE}
                fill={INK}
              >
                {cell}
              </text>
            </g>
          )
        })
      ) : (
        <ScribbleFill
          x={x + LABEL_COL + PAD}
          y={y + HEADER_H / 2 - 4}
          width={contentW}
          lines={1}
        />
      )}

      {/* Label column divider */}
      <path
        d={`M ${x + LABEL_COL} ${y + HEADER_H} L ${x + LABEL_COL} ${y + height}`}
        stroke={INK}
        strokeWidth={1}
      />

      {rows.map((row, i) => {
        const top = rowTops[i]
        return (
          <g key={row.label}>
            <text
              x={x + LABEL_COL - 12}
              y={top + ROW_PAD / 2 + TEXT_SIZE}
              textAnchor="end"
              fontFamily={HAND_FONT}
              fontSize={TEXT_SIZE}
              fill={INK}
            >
              {row.label}
            </text>
            {/* Row content: a real value, a dropdown field, or a scribble */}
            {row.value === undefined ? (
              <ScribbleFill
                x={contentX}
                y={top + ROW_PAD / 2}
                width={contentW}
                lines={row.lines ?? 1}
              />
            ) : row.asSelect ? (
              <g>
                <rect
                  x={contentX}
                  y={top + ROW_PAD / 2}
                  width={contentW}
                  height={FIELD_H}
                  rx={5}
                  fill="#fff"
                  stroke={INK}
                  strokeWidth={STROKE}
                />
                <text
                  x={contentX + 10}
                  y={top + ROW_PAD / 2 + FIELD_H / 2 + TEXT_SIZE / 3}
                  fontFamily={HAND_FONT}
                  fontSize={TEXT_SIZE}
                  fill={INK}
                >
                  {row.value}
                </text>
                <path
                  d={`M ${contentX + contentW - 24} ${top + ROW_PAD / 2 + FIELD_H / 2 - 3} L ${contentX + contentW - 18} ${top + ROW_PAD / 2 + FIELD_H / 2 + 4} L ${contentX + contentW - 12} ${top + ROW_PAD / 2 + FIELD_H / 2 - 3}`}
                  stroke={INK}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              <text
                x={contentX}
                y={top + ROW_PAD / 2 + TEXT_SIZE}
                fontFamily={HAND_FONT}
                fontSize={TEXT_SIZE}
                fill={INK}
              >
                {row.value}
              </text>
            )}

            {/* Nested sub-fields, e.g. autoscaling min / max */}
            {row.nested?.length ? (
              <g>
                <rect
                  x={contentX}
                  y={top + ROW_PAD / 2 + SCRIBBLE_LINE_HEIGHT + 8}
                  width={contentW}
                  height={NESTED_H}
                  rx={6}
                  fill="#f5f5f5"
                  stroke={INK}
                  strokeWidth={1}
                />
                {row.nested.map((field, n) => {
                  const cellW = contentW / row.nested!.length
                  const cellX = contentX + cellW * n + 12
                  const cellTop = top + ROW_PAD / 2 + SCRIBBLE_LINE_HEIGHT + 8
                  return (
                    <g key={field.label}>
                      <text
                        x={cellX}
                        y={cellTop + 18}
                        fontFamily={HAND_FONT}
                        fontSize={TEXT_SIZE}
                        fill={INK}
                      >
                        {field.label}
                      </text>
                      <text
                        x={cellX}
                        y={cellTop + 40}
                        fontFamily={HAND_FONT}
                        fontSize={TEXT_SIZE}
                        fontWeight="bold"
                        fill={INK}
                      >
                        {field.value}
                      </text>
                    </g>
                  )
                })}
              </g>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}
