/**
 * Turns a Journey into absolute coordinates. Everything the page draws — shape
 * centers, arrow endpoints, where each annotation and its open questions sit —
 * is computed once here, so the renderer stays declarative.
 */
import { LINE_HEIGHT, wrapLabel } from '../components/flow/tokens'
import { openQuestionHeight } from '../components/flow/OpenQuestion'
import { metricsHeight } from '../components/flow/scribble/ScribbleMetrics'
import { openSelectHeight } from '../components/flow/scribble/ScribbleOpenSelect'
import { CONTENT_TOP, PANEL_PADDING } from '../components/flow/scribble/ScribblePanel'
import { PROGRESS_HEIGHT } from '../components/flow/scribble/ScribbleProgress'
import { SELECT_HEIGHT } from '../components/flow/scribble/ScribbleSelect'
import { specCardHeight } from '../components/flow/scribble/ScribbleSpecCard'
import { TOGGLE_ROW_HEIGHT } from '../components/flow/scribble/ScribbleToggle'
import type { Annotation, Journey, JourneyPath, Step } from './types'

export const BOX_WIDTH = 260
export const CIRCLE_R = 75
export const DIAMOND_RX = 105
export const DIAMOND_RY = 95
export const MAX_CHARS = 24
/** Horizontal space between two shapes, i.e. the length of the arrow between them */
export const GAP = 200
/** Minimum clearance between two neighboring annotations */
const ANNOTATION_GAP = 60
/** Wrapping width for the red open-question text */
export const QUESTION_WIDTH = 460
/** How far above its row a "no" detour floats */
export const DETOUR_RISE = 230
/** Opacity of a path that isn't being walked */
export const DIMMED = 0.18
export const FADE = { transition: 'opacity 400ms ease' } as const

/** Highlighter colors, handed out in order to paths that don't name one */
const PALETTE = ['#ffe066', '#8fd9f5', '#c3f0a8', '#ffb3c7', '#d5c6ff']

const INTRO_EVENT_CX = 195
export const INTRO_EVENT_WIDTH = 215

const DEFAULT_ANNOTATION_WIDTH: Record<Annotation['kind'], number> = {
  specCard: 560,
  panel: 260,
  openSelect: 460,
  progress: 400,
  metrics: 560,
}

export function panelHeight(annotation: Extract<Annotation, { kind: 'panel' }>): number {
  const rows =
    (annotation.toggle ? TOGGLE_ROW_HEIGHT : 0) +
    (annotation.select ? SELECT_HEIGHT : 0) +
    (annotation.toggle && annotation.select ? 18 : 0)
  return CONTENT_TOP + rows + PANEL_PADDING
}

export function annotationWidth(annotation?: Annotation): number {
  if (!annotation) return 0
  return annotation.width ?? DEFAULT_ANNOTATION_WIDTH[annotation.kind]
}

export function annotationHeight(annotation?: Annotation): number {
  if (!annotation) return 0
  switch (annotation.kind) {
    case 'specCard':
      return specCardHeight(annotation.rows)
    case 'panel':
      return panelHeight(annotation)
    case 'openSelect':
      return openSelectHeight(annotation.options)
    case 'progress':
      return PROGRESS_HEIGHT
    case 'metrics':
      return metricsHeight(annotation.tiles)
  }
}

export function boxHeight(step: Step): number {
  if (step.kind === 'decision') return DIAMOND_RY * 2
  const lines = wrapLabel(step.label, MAX_CHARS).length + (step.bullets?.length ?? 0)
  return Math.max(100, lines * LINE_HEIGHT + 56)
}

function shapeWidth(step: Step): number {
  if (step.kind === 'action') return CIRCLE_R * 2
  if (step.kind === 'decision') return DIAMOND_RX * 2
  return BOX_WIDTH
}

/** Half the shape's real vertical reach — a circle drops lower than its box */
export function shapeHalfHeight(step: Step): number {
  if (step.kind === 'action') return CIRCLE_R
  if (step.kind === 'decision') return DIAMOND_RY
  return boxHeight(step) / 2
}

export interface PlacedStep extends Step {
  height: number
  cx: number
  left: number
  right: number
}

export interface Detour {
  step: Step
  cx: number
  cy: number
  left: number
  right: number
  height: number
  /** The step the detour converges back into */
  rejoin: PlacedStep
}

export interface PlacedRow {
  path: JourneyPath
  color: string
  cy: number
  /** Top edge of this row's annotations */
  panelY: number
  steps: PlacedStep[]
  /** Index of the forking decision within the row, if it has one */
  decisionIndex: number
  detour: Detour | null
  /** Lowest pixel this row reaches, annotations and questions included */
  bottom: number
}

export interface JourneyLayout {
  rows: PlacedRow[]
  /** Centerline of the intro, and of the shared tail */
  introCy: number
  introEventCx: number
  introEventRight: number
  /** Only set when the journey forks */
  decisionCx: number | null
  /** Where the branch arrows land, just short of each row's first shape */
  branchEndX: number
  tail: PlacedStep[]
  tailCy: number
  tailPanelY: number
  minWidth: number
  height: number
}

/**
 * Spacing along a row is the larger of what the shapes need and what their
 * annotations need, so the sketches underneath never overlap — a wide
 * annotation simply pushes its step, and everything after it, to the right.
 */
function placeRow(steps: Step[], startX: number): PlacedStep[] {
  return steps.reduce<PlacedStep[]>((placed, step, i) => {
    const width = shapeWidth(step)
    let cx: number

    if (i === 0) {
      cx = startX + width / 2
    } else {
      const prev = steps[i - 1]
      const shapeSpacing = shapeWidth(prev) / 2 + (prev.gapAfter ?? GAP) + width / 2
      const annotationSpacing =
        annotationWidth(prev.annotation) / 2 + ANNOTATION_GAP + annotationWidth(step.annotation) / 2
      cx = placed[i - 1].cx + Math.max(shapeSpacing, annotationSpacing)
    }

    placed.push({ ...step, height: boxHeight(step), cx, left: cx - width / 2, right: cx + width / 2 })
    return placed
  }, [])
}

/** How far below `panelY` a step's annotation and open questions reach */
export function belowPanelHeight(step: Step): number {
  const annotation = annotationHeight(step.annotation)
  const questions = step.questions?.length
    ? annotation + 40 + openQuestionHeight(step.questions, QUESTION_WIDTH)
    : 0
  return Math.max(annotation, questions)
}

export function buildLayout(journey: Journey): JourneyLayout {
  const forks = journey.paths.length > 1
  const introEventRight = INTRO_EVENT_CX + INTRO_EVENT_WIDTH / 2
  const decisionCx = forks ? introEventRight + GAP + DIAMOND_RX : null
  const rowStartX = (decisionCx !== null ? decisionCx + DIAMOND_RX : introEventRight) + GAP

  let cursor = 60
  const rows: PlacedRow[] = journey.paths.map((path, pathIndex) => {
    const steps = placeRow(path.steps, rowStartX)
    const decisionIndex = path.steps.findIndex((s) => s.kind === 'decision' && s.branch)
    const hasDetour = decisionIndex >= 0 && Boolean(steps[decisionIndex + 1])

    const topSpace = hasDetour
      ? DETOUR_RISE + boxHeight(path.steps[decisionIndex].branch!.detour) / 2 + 40
      : Math.max(...steps.map(shapeHalfHeight)) + 20
    const cy = cursor + topSpace

    const maxHalf = Math.max(...steps.map(shapeHalfHeight))
    const panelY = cy + maxHalf + 60
    const bottom = panelY + Math.max(0, ...steps.map(belowPanelHeight))
    cursor = bottom + 120

    const decision = steps[decisionIndex]
    const rejoin = steps[decisionIndex + 1]
    const detour: Detour | null =
      hasDetour && decision
        ? (() => {
            const step = decision.branch!.detour
            const cx = (decision.right + rejoin.left) / 2
            return {
              step,
              cx,
              cy: cy - DETOUR_RISE,
              left: cx - BOX_WIDTH / 2,
              right: cx + BOX_WIDTH / 2,
              height: boxHeight(step),
              rejoin,
            }
          })()
        : null

    return {
      path,
      color: path.color ?? PALETTE[pathIndex % PALETTE.length],
      cy,
      panelY,
      steps,
      decisionIndex,
      detour,
      bottom,
    }
  })

  const introCy = forks
    ? rows.reduce((sum, row) => sum + row.cy, 0) / rows.length
    : rows[0].cy

  // The tail sits to the right of the longest row, on the rows' centerline
  const tailStartX = Math.max(...rows.map((row) => row.steps[row.steps.length - 1].right)) + GAP + 120
  const tailCy = introCy
  const tail = (journey.tail ?? []).map((step, i) => {
    const left = tailStartX + i * (BOX_WIDTH + GAP)
    return {
      ...step,
      height: boxHeight(step),
      cx: left + BOX_WIDTH / 2,
      left,
      right: left + BOX_WIDTH,
    }
  })
  const tailPanelY = tail.length
    ? tailCy + Math.max(...tail.map(shapeHalfHeight)) + 60
    : tailCy
  const tailBottom = tail.length ? tailPanelY + Math.max(0, ...tail.map(belowPanelHeight)) : 0

  return {
    rows,
    introCy,
    introEventCx: INTRO_EVENT_CX,
    introEventRight,
    decisionCx,
    branchEndX: rowStartX - 47,
    tail,
    tailCy,
    tailPanelY,
    minWidth: Math.max(1120, rowStartX + BOX_WIDTH),
    height: Math.max(rows[rows.length - 1].bottom, tailBottom) + 100,
  }
}
