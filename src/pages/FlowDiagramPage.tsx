import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionNode from '../components/flow/ActionNode'
import DecisionNode from '../components/flow/DecisionNode'
import EventNode from '../components/flow/EventNode'
import FlowArrow from '../components/flow/FlowArrow'
import OpenQuestion from '../components/flow/OpenQuestion'
import ScribblePanel, {
  CONTENT_TOP,
  PANEL_PADDING,
} from '../components/flow/scribble/ScribblePanel'
import ScribbleOpenSelect, {
  openSelectHeight,
  type SelectOption,
} from '../components/flow/scribble/ScribbleOpenSelect'
import ScribbleMetrics, { type MetricTile } from '../components/flow/scribble/ScribbleMetrics'
import ScribbleProgress, { PROGRESS_HEIGHT } from '../components/flow/scribble/ScribbleProgress'
import ScribbleSelect, { SELECT_HEIGHT } from '../components/flow/scribble/ScribbleSelect'
import ScribbleSpecCard, {
  specCardHeight,
  type SpecRow,
} from '../components/flow/scribble/ScribbleSpecCard'
import ScribbleToggle, { TOGGLE_ROW_HEIGHT } from '../components/flow/scribble/ScribbleToggle'
import { LINE_HEIGHT, wrapLabel } from '../components/flow/tokens'
import RetroMenuBar, { retroMenuItemStyle } from '../components/RetroMenuBar'
import { DESKTOP_BG, FONT_IMPORT, INK as RETRO_INK, RETRO_FONT } from '../theme'

/**
 * Two paths hang off the decision, each walked independently:
 *   start    → only the first event, with a "continue" chip on its arrow
 *   decision → the diamond and both branch choices
 *   then either branch can be picked (and re-picked) at any time; the active
 *   one is highlighted in its own color and the other dims back.
 */
type Stage = 'start' | 'decision' | 'branching'
type Path = 'new' | 'existing'

/** Which annotation visual hangs beneath a step, if any */
type Annotation = 'tier' | 'sharding' | 'routing' | 'mongos' | 'progress'

interface Step {
  label: string
  bullets?: string[]
  /**
   * 'event' draws a rounded square, 'action' a process circle, 'decision' a
   * diamond that forks — yes continues along the row, no takes a detour above
   * it that converges back into the next step.
   */
  kind?: 'event' | 'action' | 'decision'
  /** Extra room after this step, e.g. to fit a detour between it and the next */
  gapAfter?: number
  annotation?: Annotation
  /**
   * Width of the visual annotation drawn beneath this step, if any. Steps are
   * spaced so these never collide, even when wider than the step itself.
   */
  annotationWidth?: number
  /** Unresolved design questions, drawn in red under this step's visual */
  questions?: string[]
}

const TIER_CARD_WIDTH = 560
const ROUTING_WIDTH = 460
const SHARDING_WIDTH = 260
const PROGRESS_WIDTH = 400
/** Wrapping width for the red open-question text */
const QUESTION_WIDTH = 460

/** The new-cluster path, left to right. */
const NEW_FLOW: Step[] = [
  { label: 'Create cluster & go to advanced configuration' },
  {
    label: 'Select cluster tier (ex. M30)',
    annotation: 'tier',
    annotationWidth: TIER_CARD_WIDTH,
  },
  {
    label: 'Turn on sharding and add 1+ shards',
    annotation: 'sharding',
    annotationWidth: SHARDING_WIDTH,
  },
  {
    label: 'Modify routing tier from colocated to dedicated mongos',
    annotation: 'routing',
    annotationWidth: ROUTING_WIDTH,
    questions: [
      'Should the routing tier belong under sharding/additional settings or with cluster tier?',
      'How does the routing tier affect the cluster tier or vice versa? Are they 1:1? V1 vs. V2?',
    ],
  },
  {
    label: 'Configure your dedicated mongos',
    bullets: ['instance', 'size', '# of routers', 'autoscaling', 'region'],
    annotation: 'mongos',
    annotationWidth: ROUTING_WIDTH,
    questions: [
      'Is there a min or max number of initial routers? Is it changeable? Does it have to do with the instance size?',
      'How are regions selected? What is the general rule?',
    ],
  },
  { label: 'Create cluster' },
  { label: 'Cluster created', kind: 'action' },
]

/**
 * The existing-cluster path. The decision forks: "yes" carries straight on
 * along this row, "no" detours through DETOUR_STEP and converges back into
 * "Modify routing tier".
 */
const EXISTING_FLOW: Step[] = [
  { label: 'Edit configuration' },
  { label: 'Is it a sharded cluster?', kind: 'decision', gapAfter: 420 },
  {
    label: 'Modify routing tier',
    annotation: 'routing',
    annotationWidth: ROUTING_WIDTH,
  },
  {
    label: 'Configure dedicated mongos',
    bullets: ['instance', 'size', '# of routers', 'autoscaling', 'region'],
    annotation: 'mongos',
    annotationWidth: ROUTING_WIDTH,
    questions: ['What happens if you want to change your cluster tier?'],
  },
  { label: 'Review changes' },
  { label: 'Apply changes' },
  {
    label: 'Cluster undergoing changes',
    kind: 'action',
    annotation: 'progress',
    annotationWidth: PROGRESS_WIDTH,
  },
  { label: 'Dedicated mongos is ready for traffic', kind: 'action' },
]

/** Index of the decision within EXISTING_FLOW */
const DECISION_INDEX = 1
/** The "no" detour: turn sharding on first, then rejoin */
const DETOUR_STEP: Step = {
  label: 'Turn on sharding and select # of shards',
  annotation: 'sharding',
}
/** How far above the row the detour sits */
const DETOUR_RISE = 230

const NEW_ROW_CY = 110 // centerline of the new-cluster row
const NEW_PANEL_Y = 250 // top of that row's annotations
const EXISTING_ROW_CY = 1000 // centerline of the existing-cluster row
const EXISTING_PANEL_Y = 1160
const ROW_START_X = 710 // left edge of the first shape in a row
const BOX_WIDTH = 260
const CIRCLE_R = 75
const DIAMOND_RX = 105
const DIAMOND_RY = 95
const MAX_CHARS = 24
const GAP = 200 // horizontal space between shapes, i.e. arrow length
const ANNOTATION_GAP = 60 // minimum clearance between two steps' visuals
const DIMMED = 0.18 // opacity of the path not being walked
const FADE = { transition: 'opacity 400ms ease' } as const
const CANVAS_HEIGHT = 1560

/** Each path gets its own highlighter color */
const PATH_COLOR: Record<Path, string> = {
  new: '#ffe066',
  existing: '#8fd9f5',
}

function boxHeight(step: Step): number {
  if (step.kind === 'decision') return DIAMOND_RY * 2
  const lines = wrapLabel(step.label, MAX_CHARS).length + (step.bullets?.length ?? 0)
  return Math.max(100, lines * LINE_HEIGHT + 56)
}

function shapeWidth(step: Step): number {
  if (step.kind === 'action') return CIRCLE_R * 2
  if (step.kind === 'decision') return DIAMOND_RX * 2
  return BOX_WIDTH
}

interface PlacedStep extends Step {
  height: number
  cx: number
  left: number
  right: number
}

/**
 * Spacing is the larger of what the shapes need and what their annotations
 * need, so the visuals underneath never overlap — a wide annotation simply
 * pushes its step (and everything after it) right.
 */
function buildLayout(steps: Step[]): PlacedStep[] {
  return steps.reduce<PlacedStep[]>((placed, step, i) => {
    const width = shapeWidth(step)
    let cx: number

    if (i === 0) {
      cx = ROW_START_X + width / 2
    } else {
      const prev = steps[i - 1]
      const shapeSpacing =
        shapeWidth(prev) / 2 + (prev.gapAfter ?? GAP) + width / 2
      const annotationSpacing =
        (prev.annotationWidth ?? 0) / 2 + ANNOTATION_GAP + (step.annotationWidth ?? 0) / 2
      cx = placed[i - 1].cx + Math.max(shapeSpacing, annotationSpacing)
    }

    placed.push({
      ...step,
      height: boxHeight(step),
      cx,
      left: cx - width / 2,
      right: cx + width / 2,
    })
    return placed
  }, [])
}

const LAYOUTS: Record<Path, PlacedStep[]> = {
  new: buildLayout(NEW_FLOW),
  existing: buildLayout(EXISTING_FLOW),
}

/**
 * Both paths converge into a shared tail: connect, then monitor. It sits to the
 * right of whichever row runs longest, on the centerline between the two.
 */
const TAIL_STEPS: Step[] = [
  { label: 'Connect to cluster' },
  {
    label: 'Monitor connections',
    bullets: [
      'Active connections',
      'Connections/sec',
      'P95 Routing Latency',
      'CPU Utilization',
      'Total Mongos Routers',
      'Rejected Connections',
    ],
  },
]

const METRICS_WIDTH = 560
const METRIC_TILES: MetricTile[] = [
  { label: 'Active connections', value: '12.4k' },
  { label: 'Connections/sec', value: '320' },
  { label: 'P95 routing latency', value: '8 ms' },
  { label: 'CPU utilization', value: '42%' },
  { label: 'Total mongos routers', value: '3' },
  { label: 'Rejected connections', value: '0' },
]

const ROW_CY: Record<Path, number> = { new: NEW_ROW_CY, existing: EXISTING_ROW_CY }
const PANEL_Y: Record<Path, number> = { new: NEW_PANEL_Y, existing: EXISTING_PANEL_Y }

/** Tail geometry: centerline between the rows, right of the longer row */
const TAIL_CY = (NEW_ROW_CY + EXISTING_ROW_CY) / 2
const TAIL_START_X =
  Math.max(
    LAYOUTS.new[LAYOUTS.new.length - 1].right,
    LAYOUTS.existing[LAYOUTS.existing.length - 1].right,
  ) + GAP + 120
const TAIL_LAYOUT = TAIL_STEPS.map((step, i) => {
  const left = TAIL_START_X + i * (BOX_WIDTH + GAP)
  return {
    ...step,
    height: boxHeight(step),
    cx: left + BOX_WIDTH / 2,
    left,
    right: left + BOX_WIDTH,
  }
})
/** Top of the metrics card under "Monitor connections" */
const TAIL_PANEL_Y = TAIL_CY + boxHeight(TAIL_STEPS[1]) / 2 + 80

/**
 * Geometry of the "no" detour box: midway between the decision and the step it
 * rejoins, floating above the row. Shared by the renderer and the auto-pan.
 */
function detourGeometry(path: Path) {
  const layout = LAYOUTS[path]
  const decision = layout[DECISION_INDEX]
  const rejoin = layout[DECISION_INDEX + 1]
  if (path !== 'existing' || decision?.kind !== 'decision' || !rejoin) return null

  const cx = (decision.right + rejoin.left) / 2
  return {
    cx,
    cy: ROW_CY[path] - DETOUR_RISE,
    left: cx - BOX_WIDTH / 2,
    right: cx + BOX_WIDTH / 2,
    height: boxHeight(DETOUR_STEP),
    decision,
    rejoin,
  }
}

const INTRO_WIDTH = 1120

/**
 * The intro — first event, then the branch decision — laid out from the same
 * GAP as the rows, so its arrow matches every other arrow's length.
 */
/** Sits midway between the two rows, so the branch forks symmetrically */
const INTRO_CY = (NEW_ROW_CY + EXISTING_ROW_CY) / 2
const INTRO_EVENT_CX = 195
const INTRO_EVENT_WIDTH = 215
const INTRO_EVENT_RIGHT = INTRO_EVENT_CX + INTRO_EVENT_WIDTH / 2
const INTRO_DECISION_CX = INTRO_EVENT_RIGHT + GAP + DIAMOND_RX
/** Where the branch arrows land, just short of the first shape in each row */
const BRANCH_END_X = ROW_START_X - 47

const SHARDING_PANEL_HEIGHT =
  CONTENT_TOP + TOGGLE_ROW_HEIGHT + 18 + SELECT_HEIGHT + PANEL_PADDING

/** Mirrors the Atlas tier configuration card; right side is placeholder scribble */
const TIER_ROWS: SpecRow[] = [
  { label: 'Generation' },
  { label: 'Class' },
  { label: 'Storage', lines: 2 },
  { label: 'Auto-Scale', lines: 4 },
  { label: 'IOPS', lines: 2 },
  { label: 'Additional Info' },
]

const CONNECTIONS_OPTIONS: SelectOption[] = [
  { label: 'Colocated', description: true },
  { label: 'Dedicated Mongos', description: true, hovered: true },
]

const MONGOS_ROWS: SpecRow[] = [
  { label: 'Initial routers', value: '3' },
  {
    label: 'Autoscaling',
    value: 'Enabled',
    nested: [
      { label: 'min', value: '3' },
      { label: 'max', value: '10' },
    ],
  },
  { label: 'Regions', value: 'US East, US West', asSelect: true },
]

/** Height of each annotation kind, so open questions can sit below it */
function annotationHeight(annotation?: Annotation): number {
  switch (annotation) {
    case 'tier':
      return specCardHeight(TIER_ROWS)
    case 'mongos':
      return specCardHeight(MONGOS_ROWS)
    case 'sharding':
      return SHARDING_PANEL_HEIGHT
    case 'routing':
      return openSelectHeight(CONNECTIONS_OPTIONS)
    case 'progress':
      return PROGRESS_HEIGHT
    default:
      return 0
  }
}

/** The visual that hangs beneath a step, tethered to it. */
function StepAnnotation({ step, cy, panelY }: { step: PlacedStep; cy: number; panelY: number }) {
  // Start the tether at the shape's real bottom edge — a circle or diamond
  // reaches further down than the label-derived box height.
  const bottom =
    step.kind === 'action'
      ? cy + CIRCLE_R
      : step.kind === 'decision'
        ? cy + DIAMOND_RY
        : cy + step.height / 2
  const tether = { x: step.cx, y: bottom + 6 }

  switch (step.annotation) {
    case 'tier':
      return (
        <ScribbleSpecCard
          x={step.cx - TIER_CARD_WIDTH / 2}
          y={panelY}
          width={TIER_CARD_WIDTH}
          title="M30"
          headerCells={['8 GB', '40 GB', '2 vCPUs', 'from $0.54/hr']}
          rows={TIER_ROWS}
          tetherFrom={tether}
        />
      )
    case 'sharding':
      return (
        <ScribblePanel
          x={step.cx - SHARDING_WIDTH / 2}
          y={panelY}
          width={SHARDING_WIDTH}
          height={SHARDING_PANEL_HEIGHT}
          title="additional settings"
          tetherFrom={tether}
        >
          <ScribbleToggle
            x={step.cx - SHARDING_WIDTH / 2 + PANEL_PADDING}
            cy={panelY + CONTENT_TOP + TOGGLE_ROW_HEIGHT / 2}
            rightX={step.cx + SHARDING_WIDTH / 2 - PANEL_PADDING}
            label="Turn on sharding"
            on
          />
          <ScribbleSelect
            x={step.cx - SHARDING_WIDTH / 2 + PANEL_PADDING}
            y={panelY + CONTENT_TOP + TOGGLE_ROW_HEIGHT + 18}
            width={SHARDING_WIDTH - PANEL_PADDING * 2}
            label="No. Shards"
            value="2"
          />
        </ScribblePanel>
      )
    case 'routing':
      return (
        <g>
          <line
            x1={tether.x}
            y1={tether.y}
            x2={step.cx}
            y2={panelY}
            stroke="#1a1a1a"
            strokeWidth={2}
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
          <ScribbleOpenSelect
            x={step.cx - ROUTING_WIDTH / 2}
            y={panelY}
            width={ROUTING_WIDTH}
            label="Connections Manager"
            value="Colocated"
            options={CONNECTIONS_OPTIONS}
          />
        </g>
      )
    case 'progress':
      return (
        <ScribbleProgress
          x={step.cx - PROGRESS_WIDTH / 2}
          y={panelY}
          width={PROGRESS_WIDTH}
          label="Provisioning dedicated mongos"
          percent={65}
          tetherFrom={tether}
        />
      )
    case 'mongos':
      return (
        <ScribbleSpecCard
          x={step.cx - ROUTING_WIDTH / 2}
          y={panelY}
          width={ROUTING_WIDTH}
          title="M30 Dedicated Mongos"
          headerCells={[]}
          rows={MONGOS_ROWS}
          tetherFrom={tether}
        />
      )
    default:
      return null
  }
}

/** One path's row: shapes, arrows, and the visuals beneath, revealed so far. */
function FlowRow({
  path,
  revealed,
  active,
  hovered,
  onHover,
  onSelect,
  onContinue,
  answer,
  onAnswer,
}: {
  path: Path
  revealed: number
  active: boolean
  /** Hovering a dimmed row brings it fully back, so you can read it */
  hovered: boolean
  onHover: (hovered: boolean) => void
  /** Clicking anywhere in the row — shape, arrow, or visual — focuses this path */
  onSelect: () => void
  onContinue: () => void
  /** Answer to this row's decision, if it has one */
  answer?: 'yes' | 'no' | null
  onAnswer?: (answer: 'yes' | 'no') => void
}) {
  const layout = LAYOUTS[path]
  const cy = ROW_CY[path]
  const panelY = PANEL_Y[path]

  const detour = detourGeometry(path)

  return (
    <g
      opacity={active || hovered ? 1 : DIMMED}
      style={{ ...FADE, cursor: active ? undefined : 'pointer' }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onSelect}
    >
      {layout.slice(0, revealed).map((step, i) => {
        const isFrontier = active && i === revealed - 1
        const isDecision = step.kind === 'decision'
        // The decision's own onward arrow is the "yes" fork, so its chip is a
        // yes/no choice rather than a plain continue.
        const awaitingAnswer = isDecision && !answer

        return (
          <g key={step.label}>
            {step.kind === 'action' ? (
              <ActionNode cx={step.cx} cy={cy} label={step.label} r={CIRCLE_R} maxChars={12} />
            ) : isDecision ? (
              <DecisionNode
                cx={step.cx}
                cy={cy}
                label={step.label}
                rx={DIAMOND_RX}
                ry={DIAMOND_RY}
              />
            ) : (
              <EventNode
                cx={step.cx}
                cy={cy}
                label={step.label}
                bullets={step.bullets}
                width={BOX_WIDTH}
                height={step.height}
                maxChars={MAX_CHARS}
              />
            )}

            {/* Onward arrow; carries the chip when it's the frontier. For a
                decision this is the "yes" fork. */}
            {i < layout.length - 1 && (
              <FlowArrow
                from={{ x: step.right, y: cy }}
                to={{ x: layout[i + 1].left - 3, y: cy }}
                label={
                  isDecision
                    ? 'Yes'
                    : isFrontier
                      ? 'continue'
                      : undefined
                }
                labelDy={-2}
                onClick={
                  awaitingAnswer && isFrontier
                    ? () => onAnswer?.('yes')
                    : isFrontier && !isDecision
                      ? onContinue
                      : undefined
                }
                highlight={i < revealed - 1 && (!isDecision || answer === 'yes')}
                highlightColor={PATH_COLOR[path]}
              />
            )}

            {/* The "no" fork: up to the detour, then back down into the rejoin */}
            {isDecision && detour && (
              <g opacity={answer === 'yes' ? 0.35 : 1} style={FADE}>
                <FlowArrow
                  from={{ x: step.cx, y: cy - DIAMOND_RY }}
                  to={{ x: detour.left - 3, y: detour.cy }}
                  variant="curved"
                  label="No"
                  labelAt="start"
                  onClick={awaitingAnswer && isFrontier ? () => onAnswer?.('no') : undefined}
                  highlight={answer === 'no'}
                  highlightColor={PATH_COLOR[path]}
                />

                {answer === 'no' && (
                  <>
                    <EventNode
                      cx={detour.cx}
                      cy={detour.cy}
                      label={DETOUR_STEP.label}
                      width={BOX_WIDTH}
                      height={detour.height}
                      maxChars={MAX_CHARS}
                    />
                    {/* Converge back into the next step along the row */}
                    <FlowArrow
                      from={{ x: detour.right, y: detour.cy }}
                      to={{ x: detour.rejoin.cx, y: cy - detour.rejoin.height / 2 - 3 }}
                      variant="curvedIn"
                      label={isFrontier ? 'continue' : undefined}
                      onClick={isFrontier ? onContinue : undefined}
                      highlight={revealed > DECISION_INDEX + 1}
                      highlightColor={PATH_COLOR[path]}
                    />
                  </>
                )}
              </g>
            )}

            <StepAnnotation step={step} cy={cy} panelY={panelY} />

            {/* Open questions, in red beneath this step's visual */}
            {step.questions?.length ? (
              <OpenQuestion
                x={step.cx - QUESTION_WIDTH / 2}
                y={panelY + annotationHeight(step.annotation) + 40}
                width={QUESTION_WIDTH}
                questions={step.questions}
              />
            ) : null}
          </g>
        )
      })}
    </g>
  )
}

/**
 * The shared tail both paths converge into. `reached` says which finished paths
 * feed it; `revealed` counts how many tail steps are showing.
 */
function FlowTail({
  reached,
  revealed,
  onContinue,
}: {
  reached: Path[]
  revealed: number
  onContinue: () => void
}) {
  if (!reached.length) return null
  const color = PATH_COLOR[reached[reached.length - 1]]

  return (
    <g>
      {/* Convergence arrows from each finished path into the tail */}
      {reached.map((path) => {
        const last = LAYOUTS[path][LAYOUTS[path].length - 1]
        return (
          <FlowArrow
            key={path}
            from={{ x: last.right, y: ROW_CY[path] }}
            to={{ x: TAIL_LAYOUT[0].cx, y: TAIL_CY - TAIL_LAYOUT[0].height / 2 - 3 }}
            variant="curvedIn"
            label={revealed === 0 ? 'continue' : undefined}
            onClick={revealed === 0 ? onContinue : undefined}
            highlight={revealed > 0}
            highlightColor={PATH_COLOR[path]}
          />
        )
      })}

      {TAIL_LAYOUT.slice(0, revealed).map((step, i) => (
        <g key={step.label}>
          <EventNode
            cx={step.cx}
            cy={TAIL_CY}
            label={step.label}
            bullets={step.bullets}
            width={BOX_WIDTH}
            height={step.height}
            maxChars={MAX_CHARS}
          />

          {i < TAIL_LAYOUT.length - 1 && (
            <FlowArrow
              from={{ x: step.right, y: TAIL_CY }}
              to={{ x: TAIL_LAYOUT[i + 1].left - 3, y: TAIL_CY }}
              label={i === revealed - 1 ? 'continue' : undefined}
              labelDy={-2}
              onClick={i === revealed - 1 ? onContinue : undefined}
              highlight={i < revealed - 1}
              highlightColor={color}
            />
          )}

          {/* Monitoring visual under the last tail step */}
          {i === TAIL_LAYOUT.length - 1 && (
            <ScribbleMetrics
              x={step.cx - METRICS_WIDTH / 2}
              y={TAIL_PANEL_Y}
              width={METRICS_WIDTH}
              title="Monitor connections"
              tiles={METRIC_TILES}
              tetherFrom={{ x: step.cx, y: TAIL_CY + step.height / 2 + 6 }}
            />
          )}
        </g>
      ))}
    </g>
  )
}

export default function FlowDiagramPage() {
  const navigate = useNavigate()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage>('start')
  /** Which path is being walked right now */
  const [activePath, setActivePath] = useState<Path | null>(null)
  /** Which path the cursor is over — hovering un-dims it */
  const [hoveredPath, setHoveredPath] = useState<Path | null>(null)
  /** How many steps of each path are revealed */
  const [revealed, setRevealed] = useState<Record<Path, number>>({ new: 0, existing: 0 })
  /** Answer to "Is it a sharded cluster?" on the existing path */
  const [sharded, setSharded] = useState<'yes' | 'no' | null>(null)
  /** How many of the shared tail steps are revealed */
  const [tailStep, setTailStep] = useState(0)

  const decisionVisible = stage !== 'start'

  const reset = () => {
    setStage('start')
    setActivePath(null)
    setRevealed({ new: 0, existing: 0 })
    setSharded(null)
    setTailStep(0)
  }

  /** Take a branch — or come back to one already started */
  const takePath = (path: Path) => {
    setStage('branching')
    setActivePath(path)
    setRevealed((r) => ({ ...r, [path]: Math.max(1, r[path]) }))
  }

  const advance = (path: Path) =>
    setRevealed((r) => ({
      ...r,
      [path]: Math.min(LAYOUTS[path].length, r[path] + 1),
    }))

  // Canvas grows to the right as either row unfolds — and never shrinks back,
  // so switching to a shorter path doesn't clip the one you already walked.
  const frontier = activePath ? LAYOUTS[activePath][revealed[activePath] - 1] : undefined
  /** Paths walked all the way to their final circle feed the shared tail */
  const completedPaths = (['new', 'existing'] as Path[]).filter(
    (p) => revealed[p] === LAYOUTS[p].length,
  )

  // The "no" detour and the arrow converging out of it reach past the decision,
  // so they set the width too — otherwise everything right of it is clipped.
  const detourRight =
    activePath === 'existing' && sharded === 'no'
      ? (detourGeometry('existing')?.rejoin.right ?? 0)
      : 0
  const canvasWidth = Math.max(
    INTRO_WIDTH,
    detourRight + GAP + 140,
    completedPaths.length ? TAIL_LAYOUT[Math.max(0, tailStep - 1)].right + GAP + 140 : 0,
    ...(['new', 'existing'] as Path[]).map((p) =>
      revealed[p] > 0 ? LAYOUTS[p][revealed[p] - 1].right + GAP + 140 : 0,
    ),
  )

  /**
   * What the viewport should be centered on: normally the frontier step, but
   * the detour box while the "no" fork is the newest thing revealed.
   */
  const focusPoint = () => {
    // Before a branch is taken, frame the intro rather than the canvas corner
    if (!activePath || !frontier) return { x: INTRO_DECISION_CX, y: INTRO_CY }

    // Once the paths converge, follow the shared tail
    if (tailStep > 0) {
      return { x: TAIL_LAYOUT[tailStep - 1].cx, y: TAIL_CY }
    }

    const onDetour =
      activePath === 'existing' &&
      sharded === 'no' &&
      revealed.existing === DECISION_INDEX + 1
    const detour = onDetour ? detourGeometry('existing') : null

    // The detour shifts the focus sideways only — the row stays framed where it
    // is, so taking "no" reads as panning right rather than up and to the right.
    return {
      x: detour ? detour.cx : frontier.cx,
      y: ROW_CY[activePath],
    }
  }

  /**
   * Follow the flow as it unfolds: pan the newest step into view, the way a
   * Figma viewport follows a cursor. Both axes are animated, so taking the
   * existing branch pans down to its row the same way continuing pans right.
   * The SVG renders at its intrinsic pixel size, so user units map 1:1 to px.
   */
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    // Center the frontier step horizontally, and its row vertically. Answering
    // "no" doesn't advance the row, so the detour above it becomes the focus.
    const focus = focusPoint()
    const wantX = focus ? focus.x - scroller.clientWidth / 2 : 0
    const wantY = focus ? focus.y - scroller.clientHeight / 2 : 0

    const toX = Math.max(0, Math.min(wantX, canvasWidth - scroller.clientWidth))
    const toY = Math.max(0, Math.min(wantY, CANVAS_HEIGHT - scroller.clientHeight))
    const fromX = scroller.scrollLeft
    const fromY = scroller.scrollTop
    const dx = toX - fromX
    const dy = toY - fromY
    const travel = Math.hypot(dx, dy)
    if (travel < 1) return

    // Hand-rolled easing: the native 'smooth' behavior is short and abrupt over
    // long distances, so ease in and out over a duration that scales with travel.
    const duration = Math.min(2000, 600 + travel * 0.7)
    const start = performance.now()
    let frame = 0

    // Sine easing — the gentlest of the standard curves.
    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = easeInOutSine(t)
      scroller.scrollLeft = fromX + dx * eased
      scroller.scrollTop = fromY + dy * eased
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [frontier, activePath, sharded, revealed, tailStep, canvasWidth])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: DESKTOP_BG,
        fontFamily: RETRO_FONT,
        color: RETRO_INK,
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        @font-face {
          font-family: 'Virgil';
          src: url('https://excalidraw.com/Virgil.woff2') format('woff2');
          font-display: swap;
        }
        /* Scrollable, but no visible scrollbar */
        .flow-scroller {
          scrollbar-width: none;          /* Firefox */
          -ms-overflow-style: none;       /* old Edge */
        }
        .flow-scroller::-webkit-scrollbar {
          display: none;                  /* Chrome, Safari */
        }
      `}</style>

      <RetroMenuBar onBack={() => navigate('/')}>
        {stage !== 'start' && (
          <button onClick={reset} style={retroMenuItemStyle}>
            Start over
          </button>
        )}
      </RetroMenuBar>

      {/* Horizontal scroll when the flow runs past the viewport */}
      <div
        ref={scrollerRef}
        className="flow-scroller"
        style={{
          overflow: 'auto',
          // A fixed viewport, so the diagram pans within it on both axes
          height: 'calc(100vh - 60px)',
        }}
      >
        <svg
          viewBox={`0 0 ${canvasWidth} ${CANVAS_HEIGHT}`}
          width={canvasWidth}
          height={CANVAS_HEIGHT}
          style={{ display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <EventNode
            cx={INTRO_EVENT_CX}
            cy={INTRO_CY}
            width={INTRO_EVENT_WIDTH}
            label="navigate to the Atlas UI"
          />

          {/* First event → decision: the "continue" chip advances the flow */}
          <FlowArrow
            from={{ x: INTRO_EVENT_RIGHT, y: INTRO_CY }}
            to={{ x: INTRO_DECISION_CX - DIAMOND_RX - 3, y: INTRO_CY }}
            label={decisionVisible ? undefined : 'continue'}
            labelDy={-2}
            onClick={decisionVisible ? undefined : () => setStage('decision')}
            highlight={decisionVisible}
          />

          {decisionVisible && (
            <>
              <DecisionNode
                cx={INTRO_DECISION_CX}
                cy={INTRO_CY}
                label="New or existing cluster?"
                rx={DIAMOND_RX}
                ry={DIAMOND_RY}
              />

              {/* Both branches stay live: hover previews the path's color,
                  clicking switches to walking it */}
              <g
                opacity={activePath === 'existing' && hoveredPath !== 'new' ? DIMMED : 1}
                style={FADE}
                onMouseEnter={() => setHoveredPath('new')}
                onMouseLeave={() => setHoveredPath(null)}
              >
                <FlowArrow
                  from={{ x: INTRO_DECISION_CX, y: INTRO_CY - DIAMOND_RY }}
                  to={{ x: BRANCH_END_X, y: NEW_ROW_CY }}
                  variant="curved"
                  label="New"
                  labelAt="start"
                  onClick={() => takePath('new')}
                  highlight={activePath === 'new'}
                  highlightColor={PATH_COLOR.new}
                  hoverPreview
                />
              </g>
              <g
                opacity={activePath === 'new' && hoveredPath !== 'existing' ? DIMMED : 1}
                style={FADE}
                onMouseEnter={() => setHoveredPath('existing')}
                onMouseLeave={() => setHoveredPath(null)}
              >
                <FlowArrow
                  from={{ x: INTRO_DECISION_CX, y: INTRO_CY + DIAMOND_RY }}
                  to={{ x: BRANCH_END_X, y: EXISTING_ROW_CY }}
                  variant="curved"
                  label="Existing"
                  labelAt="start"
                  onClick={() => takePath('existing')}
                  highlight={activePath === 'existing'}
                  highlightColor={PATH_COLOR.existing}
                  hoverPreview
                />
              </g>
            </>
          )}

          {(['new', 'existing'] as Path[]).map((path) => (
            <FlowRow
              key={path}
              path={path}
              revealed={revealed[path]}
              active={activePath === path}
              hovered={hoveredPath === path}
              onHover={(h) => setHoveredPath(h ? path : null)}
              onSelect={() => takePath(path)}
              onContinue={() => advance(path)}
              answer={path === 'existing' ? sharded : undefined}
              onAnswer={
                path === 'existing'
                  ? (a) => {
                      setSharded(a)
                      // "Yes" carries straight on; "No" first reveals the detour,
                      // whose own continue advances the row.
                      if (a === 'yes') advance(path)
                    }
                  : undefined
              }
            />
          ))}

          <FlowTail
            reached={completedPaths}
            revealed={tailStep}
            onContinue={() => setTailStep((t) => Math.min(TAIL_LAYOUT.length, t + 1))}
          />
        </svg>
      </div>
    </div>
  )
}

