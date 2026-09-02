import { HAND_FONT, INK, STROKE, TEXT_SIZE } from '../tokens'

export interface MetricTile {
  label: string
  value: string
  /** Shape of the sparkline: 0–1 ratios, top to bottom. Defaults per index. */
  trend?: number[]
}

interface ScribbleMetricsProps {
  /** Left edge of the card */
  x: number
  /** Top edge of the card */
  y: number
  width: number
  title: string
  tiles: MetricTile[]
  /** Draw a dotted tether from this point down to the card */
  tetherFrom?: { x: number; y: number }
}

const PAD = 16
const COLS = 3
const CHART_H = 46
const TILE_GAP_Y = 24
const TILE_H = TEXT_SIZE + 22 + CHART_H + TILE_GAP_Y
const GRID = '#dcdcdc'
const MUTED = '#8a8a8a'

/** A few stable shapes so each metric's graph reads differently */
const TRENDS: number[][] = [
  [0.7, 0.5, 0.62, 0.35, 0.44, 0.2, 0.3, 0.15],
  [0.4, 0.55, 0.3, 0.62, 0.35, 0.5, 0.28, 0.42],
  [0.6, 0.58, 0.64, 0.55, 0.6, 0.52, 0.58, 0.5],
  [0.2, 0.35, 0.28, 0.5, 0.4, 0.62, 0.55, 0.7],
  [0.55, 0.55, 0.55, 0.3, 0.3, 0.3, 0.3, 0.3],
  [0.85, 0.85, 0.8, 0.85, 0.82, 0.85, 0.85, 0.84],
]

function tileRows(count: number): number {
  return Math.ceil(count / COLS)
}

export function metricsHeight(tiles: MetricTile[]): number {
  return PAD * 2 + TEXT_SIZE + 16 + tileRows(tiles.length) * TILE_H
}

/**
 * A sketched monitoring panel: one small graph per metric, each with its own
 * label and current value. The trend lines are placeholders, not real data.
 */
export default function ScribbleMetrics({
  x,
  y,
  width,
  title,
  tiles,
  tetherFrom,
}: ScribbleMetricsProps) {
  const height = metricsHeight(tiles)
  const innerW = width - PAD * 2
  const tileW = innerW / COLS
  const chartW = tileW - 18
  const tilesTop = y + PAD + TEXT_SIZE + 16

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

      <text
        x={x + PAD}
        y={y + PAD + TEXT_SIZE}
        fontFamily={HAND_FONT}
        fontSize={TEXT_SIZE}
        fill={INK}
      >
        {title}
      </text>

      {tiles.map((tile, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const tx = x + PAD + col * tileW
        const ty = tilesTop + row * TILE_H
        const chartTop = ty + TEXT_SIZE + 22
        const trend = tile.trend ?? TRENDS[i % TRENDS.length]
        const line = trend
          .map((r, n) => {
            const px = tx + (chartW / (trend.length - 1)) * n
            const py = chartTop + CHART_H * r
            return `${n === 0 ? 'M' : 'L'} ${px} ${py}`
          })
          .join(' ')

        return (
          <g key={tile.label}>
            <text
              x={tx}
              y={ty + TEXT_SIZE}
              fontFamily={HAND_FONT}
              fontSize={TEXT_SIZE}
              fill={MUTED}
            >
              {tile.label}
            </text>
            <text
              x={tx}
              y={ty + TEXT_SIZE + 18}
              fontFamily={HAND_FONT}
              fontSize={TEXT_SIZE + 2}
              fontWeight="bold"
              fill={INK}
            >
              {tile.value}
            </text>

            {/* Each metric gets its own little chart: baseline plus trend */}
            <line
              x1={tx}
              y1={chartTop + CHART_H / 2}
              x2={tx + chartW}
              y2={chartTop + CHART_H / 2}
              stroke={GRID}
              strokeWidth={1}
            />
            <line
              x1={tx}
              y1={chartTop + CHART_H}
              x2={tx + chartW}
              y2={chartTop + CHART_H}
              stroke={MUTED}
              strokeWidth={1}
            />
            <path
              d={line}
              stroke={INK}
              strokeWidth={STROKE}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        )
      })}
    </g>
  )
}
