import { INK } from './tokens'
import ScribbleMetrics from './scribble/ScribbleMetrics'
import ScribbleOpenSelect from './scribble/ScribbleOpenSelect'
import ScribblePanel, { CONTENT_TOP, PANEL_PADDING } from './scribble/ScribblePanel'
import ScribbleProgress from './scribble/ScribbleProgress'
import ScribbleSelect from './scribble/ScribbleSelect'
import ScribbleSpecCard from './scribble/ScribbleSpecCard'
import ScribbleToggle, { TOGGLE_ROW_HEIGHT } from './scribble/ScribbleToggle'
import { annotationWidth, panelHeight } from '../../journey/layout'
import type { Annotation } from '../../journey/types'

interface StepAnnotationProps {
  annotation?: Annotation
  /** Center of the step this hangs from */
  cx: number
  /** Top edge of the annotation */
  y: number
  /** Bottom edge of the step's shape, where the dotted tether starts */
  tetherFrom: { x: number; y: number }
}

/** A dotted line from the step down to its sketch, for the visuals that lack one */
function Tether({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={INK}
      strokeWidth={2}
      strokeDasharray="4 6"
      strokeLinecap="round"
    />
  )
}

/** The sketched screen that hangs beneath a step, tethered to it. */
export default function StepAnnotation({ annotation, cx, y, tetherFrom }: StepAnnotationProps) {
  if (!annotation) return null

  const width = annotationWidth(annotation)
  const x = cx - width / 2

  switch (annotation.kind) {
    case 'specCard':
      return (
        <ScribbleSpecCard
          x={x}
          y={y}
          width={width}
          title={annotation.title}
          headerCells={annotation.headerCells}
          rows={annotation.rows}
          tetherFrom={tetherFrom}
        />
      )

    case 'panel': {
      const toggleCy = y + CONTENT_TOP + TOGGLE_ROW_HEIGHT / 2
      const selectY = y + CONTENT_TOP + (annotation.toggle ? TOGGLE_ROW_HEIGHT + 18 : 0)
      return (
        <ScribblePanel
          x={x}
          y={y}
          width={width}
          height={panelHeight(annotation)}
          title={annotation.title}
          tetherFrom={tetherFrom}
        >
          {annotation.toggle && (
            <ScribbleToggle
              x={x + PANEL_PADDING}
              cy={toggleCy}
              rightX={x + width - PANEL_PADDING}
              label={annotation.toggle.label}
              on={annotation.toggle.on ?? true}
            />
          )}
          {annotation.select && (
            <ScribbleSelect
              x={x + PANEL_PADDING}
              y={selectY}
              width={width - PANEL_PADDING * 2}
              label={annotation.select.label}
              value={annotation.select.value}
            />
          )}
        </ScribblePanel>
      )
    }

    case 'openSelect':
      return (
        <g>
          <Tether from={tetherFrom} to={{ x: cx, y }} />
          <ScribbleOpenSelect
            x={x}
            y={y}
            width={width}
            label={annotation.label}
            value={annotation.value}
            options={annotation.options}
          />
        </g>
      )

    case 'progress':
      return (
        <ScribbleProgress
          x={x}
          y={y}
          width={width}
          label={annotation.label}
          percent={annotation.percent}
          tetherFrom={tetherFrom}
        />
      )

    case 'metrics':
      return (
        <ScribbleMetrics
          x={x}
          y={y}
          width={width}
          title={annotation.title}
          tiles={annotation.tiles}
          tetherFrom={tetherFrom}
        />
      )
  }
}
