import { useState } from 'react'
import { HAND_FONT, INK, STROKE, TEXT_SIZE } from './tokens'

interface Point {
  x: number
  y: number
}

interface FlowArrowProps {
  from: Point
  to: Point
  /**
   * 'straight'  — a direct line.
   * 'curved'    — an elbow that leaves `from` vertically, rounds the corner,
   *               then runs horizontally into `to`.
   * 'curvedIn'  — the mirror: leaves horizontally, rounds the corner, then
   *               runs vertically into `to`. Used to converge a detour back.
   */
  variant?: 'straight' | 'curved' | 'curvedIn'
  /** Optional text drawn above the line */
  label?: string
  /** Horizontal nudge for the label, relative to its default position */
  labelDx?: number
  /** Vertical nudge for the label (negative moves it further above the line) */
  labelDy?: number
  /** Corner rounding for the 'curved' variant */
  cornerRadius?: number
  /**
   * Where the label sits along the arrow. 'run' (default) centers it on the
   * long horizontal stretch; 'start' tucks it against the arrow's origin —
   * useful on a decision's branches, so each label reads next to the diamond.
   */
  labelAt?: 'run' | 'start'
  /**
   * When set, the label renders as a clickable chip on the arrow and firing it
   * advances the flow. Without it the label is plain static text.
   */
  onClick?: () => void
  /** Draw a marker highlight behind the line — the path taken */
  highlight?: boolean
  /** Color of that highlight; each path gets its own */
  highlightColor?: string
  /**
   * Preview the highlight on hover, so an unwalked branch shows what taking it
   * would look like. Only meaningful together with `onClick`.
   */
  hoverPreview?: boolean
}

const HIGHLIGHT = '#ffe066'
/** How far the clickable chip sits above the line, so it clears the stroke */
const CHIP_LIFT = 12

const HEAD_LENGTH = 22
const HEAD_SPREAD = 11

export default function FlowArrow({
  from,
  to,
  variant = 'straight',
  label,
  labelDx = 0,
  labelDy = 0,
  cornerRadius = 11,
  labelAt = 'run',
  onClick,
  highlight = false,
  highlightColor = HIGHLIGHT,
  hoverPreview = false,
}: FlowArrowProps) {
  const [hovered, setHovered] = useState(false)
  const goingRight = to.x >= from.x
  const goingDown = to.y >= from.y
  const dir = goingRight ? 1 : -1

  // Where the head sits, and the path that stops just short of it
  const tipX = to.x
  const tipY = to.y
  const lineEndX = tipX - dir * 3
  const vertical = variant === 'straight' && from.x === to.x

  let path: string
  let labelX: number
  let labelY: number

  if (vertical) {
    // Straight vertical run: chip sits beside the line at its midpoint
    path = `M ${from.x} ${from.y} L ${to.x} ${tipY - (goingDown ? 3 : -3)}`
    labelX = from.x + 16
    labelY = (from.y + to.y) / 2 + TEXT_SIZE / 3
  } else if (variant === 'curved') {
    const cornerY = goingDown ? to.y - cornerRadius : to.y + cornerRadius
    path =
      `M ${from.x} ${from.y} ` +
      `L ${from.x} ${cornerY} ` +
      `Q ${from.x} ${to.y} ${from.x + dir * cornerRadius} ${to.y} ` +
      `L ${lineEndX} ${to.y}`
    // Label sits above the horizontal run, a third of the way along it
    labelX = from.x + dir * cornerRadius + (lineEndX - from.x - dir * cornerRadius) * 0.33
    labelY = to.y - 8
  } else if (variant === 'curvedIn') {
    const cornerX = to.x - dir * cornerRadius
    path =
      `M ${from.x} ${from.y} ` +
      `L ${cornerX} ${from.y} ` +
      `Q ${to.x} ${from.y} ${to.x} ${from.y + (goingDown ? cornerRadius : -cornerRadius)} ` +
      `L ${to.x} ${tipY - (goingDown ? 3 : -3)}`
    // Label sits above the horizontal run, a third of the way along it
    labelX = from.x + (cornerX - from.x) * 0.33
    labelY = from.y - 8
  } else {
    path = `M ${from.x} ${from.y} L ${lineEndX} ${to.y}`
    labelX = (from.x + lineEndX) / 2
    labelY = Math.min(from.y, to.y) - 8
  }

  // Arrowhead orientation follows the incoming segment: vertical for a plain
  // vertical run and for the converging elbow, horizontal otherwise.
  const head = vertical || variant === 'curvedIn'
    ? `M ${tipX - HEAD_SPREAD} ${tipY - (goingDown ? HEAD_LENGTH : -HEAD_LENGTH)} ` +
      `L ${tipX} ${tipY} ` +
      `L ${tipX + HEAD_SPREAD} ${tipY - (goingDown ? HEAD_LENGTH : -HEAD_LENGTH)}`
    : `M ${tipX - dir * HEAD_LENGTH} ${tipY - HEAD_SPREAD} ` +
      `L ${tipX} ${tipY} ` +
      `L ${tipX - dir * HEAD_LENGTH} ${tipY + HEAD_SPREAD}`

  // 'start' overrides the computed position: sit on the arrow's vertical leg,
  // just clear of where it leaves the shape.
  if (labelAt === 'start') {
    labelX = from.x
    labelY = goingDown ? from.y + 46 : from.y - 14
  }

  const previewing = hoverPreview && hovered && !highlight
  const chipWidth = (label?.length ?? 0) * TEXT_SIZE * 0.55 + 20

  return (
    <g
      onMouseEnter={hoverPreview ? () => setHovered(true) : undefined}
      onMouseLeave={hoverPreview ? () => setHovered(false) : undefined}
    >
      {/* Marker-pen highlight behind the line: solid for the path taken,
          faint while hovering a branch you could take */}
      {(highlight || previewing) && (
        <path
          d={path}
          stroke={highlightColor}
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={highlight ? 0.85 : 0.4}
        />
      )}
      <path
        d={path}
        stroke={INK}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={head}
        stroke={INK}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {label && !onClick && (
        <text
          x={labelX + labelDx}
          y={labelY + labelDy}
          fontFamily={HAND_FONT}
          fontSize={TEXT_SIZE}
          fill={INK}
        >
          {label}
        </text>
      )}

      {label && onClick && (
        <g
          onClick={onClick}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
        >
          {/* Chip sized off the label length so it hugs the text, centered on
              the line's midpoint and lifted clear of the stroke */}
          <rect
            x={labelX + labelDx - chipWidth / 2}
            y={labelY + labelDy - TEXT_SIZE - 4 - CHIP_LIFT}
            width={chipWidth}
            height={TEXT_SIZE + 14}
            rx={(TEXT_SIZE + 14) / 2}
            fill="#fff"
            stroke={INK}
            strokeWidth={STROKE}
          />
          <text
            x={labelX + labelDx}
            y={labelY + labelDy + 1 - CHIP_LIFT}
            textAnchor="middle"
            fontFamily={HAND_FONT}
            fontSize={TEXT_SIZE}
            fill={INK}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}
