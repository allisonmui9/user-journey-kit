import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ActionNode from '../components/flow/ActionNode'
import DecisionNode from '../components/flow/DecisionNode'
import EventNode from '../components/flow/EventNode'
import FlowArrow from '../components/flow/FlowArrow'
import OpenQuestion from '../components/flow/OpenQuestion'
import StepAnnotation from '../components/flow/StepAnnotation'
import RetroMenuBar, { retroMenuItemStyle } from '../components/RetroMenuBar'
import { journeys, type Journey } from '../journey'
import {
  BOX_WIDTH,
  CIRCLE_R,
  DIAMOND_RX,
  DIAMOND_RY,
  DIMMED,
  FADE,
  GAP,
  INTRO_EVENT_WIDTH,
  MAX_CHARS,
  QUESTION_WIDTH,
  annotationHeight,
  buildLayout,
  shapeHalfHeight,
  type PlacedRow,
  type PlacedStep,
} from '../journey/layout'
import { DESKTOP_BG, FONT_IMPORT, HAND_FONT_IMPORT, INK as RETRO_INK, RETRO_FONT } from '../theme'

type Answer = 'yes' | 'no'

/** Keyed on the slug, so navigating between journeys starts each one fresh. */
export default function JourneyPage() {
  const { slug } = useParams()
  const journey = journeys.find((j) => j.slug === slug) ?? journeys[0]
  return <JourneyWalk key={journey.slug} journey={journey} />
}

/**
 * Walk one journey. The diagram reveals itself a step at a time: every frontier
 * arrow carries a "continue" chip, decisions carry yes/no, and the viewport
 * pans to follow whatever was just revealed.
 */
function JourneyWalk({ journey }: { journey: Journey }) {
  const navigate = useNavigate()
  const layout = useMemo(() => buildLayout(journey), [journey])
  const forks = layout.decisionCx !== null

  const scrollerRef = useRef<HTMLDivElement>(null)
  /** Has the intro's onward arrow been taken yet? */
  const [started, setStarted] = useState(false)
  /** Which path is being walked right now */
  const [activeId, setActiveId] = useState<string | null>(null)
  /** Which path the cursor is over — hovering un-dims it */
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  /** How many steps of each path are revealed, by path id */
  const [revealed, setRevealed] = useState<Record<string, number>>({})
  /** Each path's answer to its own decision, if it has one */
  const [answers, setAnswers] = useState<Record<string, Answer | null>>({})
  /** How many of the shared tail steps are revealed */
  const [tailStep, setTailStep] = useState(0)
  /**
   * Whether the tail is what's being walked right now. The tail stays on screen
   * once reached, so this tracks attention rather than progress — otherwise
   * going back to walk another fork would pan to the tail instead of the fork.
   */
  const [onTail, setOnTail] = useState(false)

  const reset = () => {
    setStarted(false)
    setActiveId(null)
    setRevealed({})
    setAnswers({})
    setTailStep(0)
    setOnTail(false)
  }

  const shown = (id: string) => revealed[id] ?? 0

  /** Take a branch — or come back to one already started */
  const takePath = (id: string) => {
    setStarted(true)
    setActiveId(id)
    setOnTail(false)
    setRevealed((r) => ({ ...r, [id]: Math.max(1, r[id] ?? 0) }))
  }

  const advance = (row: PlacedRow) => {
    setOnTail(false)
    setRevealed((r) => ({
      ...r,
      [row.path.id]: Math.min(row.steps.length, (r[row.path.id] ?? 0) + 1),
    }))
  }

  const activeRow = layout.rows.find((row) => row.path.id === activeId) ?? null
  const frontier = activeRow ? activeRow.steps[shown(activeRow.path.id) - 1] : undefined
  /** Paths walked all the way to their last step feed the shared tail */
  const completed = layout.rows.filter((row) => shown(row.path.id) === row.steps.length)

  // The canvas grows rightward as a row unfolds, and never shrinks back — so
  // switching to a shorter path doesn't clip the one already walked.
  const detourRight =
    activeRow && answers[activeRow.path.id] === 'no' ? (activeRow.detour?.rejoin.right ?? 0) : 0
  const canvasWidth = Math.max(
    layout.minWidth,
    detourRight + GAP + 140,
    // As soon as one path finishes, the tail's convergence arrow and its first
    // box have to fit — otherwise the 'continue' chip on that arrow lands past
    // the canvas edge and can't be clicked.
    completed.length ? layout.tail[Math.max(0, tailStep - 1)].right + GAP + 140 : 0,
    ...layout.rows.map((row) => {
      const n = shown(row.path.id)
      return n > 0 ? row.steps[n - 1].right + GAP + 140 : 0
    }),
  )

  /**
   * What the viewport should be centered on: normally the frontier step, but
   * the detour box while the "no" fork is the newest thing revealed.
   */
  const focusPoint = () => {
    // Before a path is taken, frame the intro rather than the canvas corner
    if (!activeRow || !frontier) {
      return { x: layout.decisionCx ?? layout.introEventCx, y: layout.introCy }
    }
    // Follow the shared tail only while it's the thing being walked
    if (onTail && tailStep > 0) return { x: layout.tail[tailStep - 1].cx, y: layout.tailCy }

    const onDetour =
      answers[activeRow.path.id] === 'no' &&
      shown(activeRow.path.id) === activeRow.decisionIndex + 1
    // The detour shifts focus sideways only — the row stays framed where it is,
    // so taking "no" reads as panning right rather than up and to the right.
    return {
      x: onDetour && activeRow.detour ? activeRow.detour.cx : frontier.cx,
      y: activeRow.cy,
    }
  }

  /**
   * Follow the flow as it unfolds: pan the newest step into view, the way a
   * Figma viewport follows a cursor. The SVG renders at its intrinsic pixel
   * size, so user units map 1:1 to px.
   */
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const focus = focusPoint()
    const toX = Math.max(0, Math.min(focus.x - scroller.clientWidth / 2, canvasWidth - scroller.clientWidth))
    const toY = Math.max(0, Math.min(focus.y - scroller.clientHeight / 2, layout.height - scroller.clientHeight))
    const fromX = scroller.scrollLeft
    const fromY = scroller.scrollTop
    const dx = toX - fromX
    const dy = toY - fromY
    const travel = Math.hypot(dx, dy)
    if (travel < 1) return

    // Hand-rolled easing: native 'smooth' is short and abrupt over long
    // distances, so ease in and out over a duration that scales with travel.
    const duration = Math.min(2000, 600 + travel * 0.7)
    const start = performance.now()
    let frame = 0
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
  }, [frontier, activeId, answers, revealed, tailStep, onTail, canvasWidth, layout])

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
        ${HAND_FONT_IMPORT}
        /* Scrollable, but no visible scrollbar */
        .flow-scroller { scrollbar-width: none; -ms-overflow-style: none; }
        .flow-scroller::-webkit-scrollbar { display: none; }
      `}</style>

      <RetroMenuBar title={journey.title} onBack={() => navigate('/')}>
        {started && (
          <button onClick={reset} style={retroMenuItemStyle}>
            Start over
          </button>
        )}
      </RetroMenuBar>

      <div
        ref={scrollerRef}
        className="flow-scroller"
        // A fixed viewport, so the diagram pans within it on both axes
        style={{ overflow: 'auto', height: 'calc(100vh - 60px)' }}
      >
        <svg
          viewBox={`0 0 ${canvasWidth} ${layout.height}`}
          width={canvasWidth}
          height={layout.height}
          style={{ display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <EventNode
            cx={layout.introEventCx}
            cy={layout.introCy}
            width={INTRO_EVENT_WIDTH}
            label={journey.intro.label}
          />

          {/* Intro → fork, or intro → the single row's first step */}
          {forks ? (
            <>
              <FlowArrow
                from={{ x: layout.introEventRight, y: layout.introCy }}
                to={{ x: layout.decisionCx! - DIAMOND_RX - 3, y: layout.introCy }}
                label={started ? undefined : 'continue'}
                labelDy={-2}
                onClick={started ? undefined : () => setStarted(true)}
                highlight={started}
              />

              {started && (
                <>
                  <DecisionNode
                    cx={layout.decisionCx!}
                    cy={layout.introCy}
                    label={journey.forkQuestion ?? 'Which path?'}
                    rx={DIAMOND_RX}
                    ry={DIAMOND_RY}
                  />

                  {/* Every branch stays live: hover previews its color,
                      clicking switches to walking it */}
                  {layout.rows.map((row) => (
                    <g
                      key={row.path.id}
                      opacity={activeId && activeId !== row.path.id && hoveredId !== row.path.id ? DIMMED : 1}
                      style={FADE}
                      onMouseEnter={() => setHoveredId(row.path.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <FlowArrow
                        from={{
                          x: layout.decisionCx!,
                          y: layout.introCy + (row.cy < layout.introCy ? -DIAMOND_RY : DIAMOND_RY),
                        }}
                        to={{ x: layout.branchEndX, y: row.cy }}
                        variant="curved"
                        label={row.path.label}
                        labelAt="start"
                        onClick={() => takePath(row.path.id)}
                        highlight={activeId === row.path.id}
                        highlightColor={row.color}
                        hoverPreview
                      />
                    </g>
                  ))}
                </>
              )}
            </>
          ) : (
            <FlowArrow
              from={{ x: layout.introEventRight, y: layout.introCy }}
              to={{ x: layout.rows[0].steps[0].left - 3, y: layout.rows[0].cy }}
              label={started ? undefined : 'continue'}
              labelDy={-2}
              onClick={started ? undefined : () => takePath(layout.rows[0].path.id)}
              highlight={started}
              highlightColor={layout.rows[0].color}
            />
          )}

          {layout.rows.map((row) => (
            <FlowRow
              key={row.path.id}
              row={row}
              revealed={shown(row.path.id)}
              active={!forks || activeId === row.path.id}
              hovered={hoveredId === row.path.id}
              onHover={(h) => setHoveredId(h ? row.path.id : null)}
              onSelect={() => takePath(row.path.id)}
              onContinue={() => advance(row)}
              answer={answers[row.path.id] ?? null}
              onAnswer={(a) => {
                setAnswers((prev) => ({ ...prev, [row.path.id]: a }))
                // "Yes" carries straight on; "No" first reveals the detour,
                // whose own continue advances the row.
                if (a === 'yes') advance(row)
              }}
            />
          ))}

          {layout.tail.length > 0 && (
            <FlowTail
              layout={layout}
              reached={completed}
              revealed={tailStep}
              onContinue={() => {
                setOnTail(true)
                setTailStep((t) => Math.min(layout.tail.length, t + 1))
              }}
            />
          )}
        </svg>
      </div>
    </div>
  )
}

/** One shape, drawn as whichever kind the step asked for. */
function StepShape({ step, cy }: { step: PlacedStep; cy: number }) {
  if (step.kind === 'action') {
    return <ActionNode cx={step.cx} cy={cy} label={step.label} r={CIRCLE_R} maxChars={12} />
  }
  if (step.kind === 'decision') {
    return <DecisionNode cx={step.cx} cy={cy} label={step.label} rx={DIAMOND_RX} ry={DIAMOND_RY} />
  }
  return (
    <EventNode
      cx={step.cx}
      cy={cy}
      label={step.label}
      bullets={step.bullets}
      width={BOX_WIDTH}
      height={step.height}
      maxChars={MAX_CHARS}
    />
  )
}

/** A step's sketch and its open questions, both hanging beneath the row. */
function StepBelow({ step, cy, panelY }: { step: PlacedStep; cy: number; panelY: number }) {
  return (
    <>
      <StepAnnotation
        annotation={step.annotation}
        cx={step.cx}
        y={panelY}
        tetherFrom={{ x: step.cx, y: cy + shapeHalfHeight(step) + 6 }}
      />
      {step.questions?.length ? (
        <OpenQuestion
          x={step.cx - QUESTION_WIDTH / 2}
          y={panelY + annotationHeight(step.annotation) + 40}
          width={QUESTION_WIDTH}
          questions={step.questions}
        />
      ) : null}
    </>
  )
}

/** One path's row: shapes, arrows, and the sketches beneath, revealed so far. */
function FlowRow({
  row,
  revealed,
  active,
  hovered,
  onHover,
  onSelect,
  onContinue,
  answer,
  onAnswer,
}: {
  row: PlacedRow
  revealed: number
  active: boolean
  /** Hovering a dimmed row brings it fully back, so it can be read */
  hovered: boolean
  onHover: (hovered: boolean) => void
  /** Clicking anywhere in the row — shape, arrow, or sketch — focuses this path */
  onSelect: () => void
  onContinue: () => void
  answer: Answer | null
  onAnswer: (answer: Answer) => void
}) {
  const { steps, cy, panelY, detour, decisionIndex } = row

  return (
    <g
      opacity={active || hovered ? 1 : DIMMED}
      style={{ ...FADE, cursor: active ? undefined : 'pointer' }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onSelect}
    >
      {steps.slice(0, revealed).map((step, i) => {
        const isFrontier = active && i === revealed - 1
        const isDecision = step.kind === 'decision' && Boolean(step.branch)
        // A decision's onward arrow is its "yes" fork, so its chip is a yes/no
        // choice rather than a plain continue.
        const awaitingAnswer = isDecision && !answer
        const branch = step.branch

        return (
          <g key={`${step.label}-${i}`}>
            <StepShape step={step} cy={cy} />

            {/* Onward arrow; carries the chip when it's the frontier */}
            {i < steps.length - 1 && (
              <FlowArrow
                from={{ x: step.right, y: cy }}
                to={{ x: steps[i + 1].left - 3, y: cy }}
                label={
                  isDecision ? (branch?.yesLabel ?? 'Yes') : isFrontier ? 'continue' : undefined
                }
                labelDy={-2}
                onClick={
                  awaitingAnswer && isFrontier
                    ? () => onAnswer('yes')
                    : isFrontier && !isDecision
                      ? onContinue
                      : undefined
                }
                highlight={i < revealed - 1 && (!isDecision || answer === 'yes')}
                highlightColor={row.color}
              />
            )}

            {/* The "no" fork: up to the detour, then back down into the rejoin */}
            {isDecision && detour && i === decisionIndex && (
              <g opacity={answer === 'yes' ? 0.35 : 1} style={FADE}>
                <FlowArrow
                  from={{ x: step.cx, y: cy - DIAMOND_RY }}
                  to={{ x: detour.left - 3, y: detour.cy }}
                  variant="curved"
                  label={branch?.noLabel ?? 'No'}
                  labelAt="start"
                  onClick={awaitingAnswer && isFrontier ? () => onAnswer('no') : undefined}
                  highlight={answer === 'no'}
                  highlightColor={row.color}
                />

                {answer === 'no' && (
                  <>
                    <EventNode
                      cx={detour.cx}
                      cy={detour.cy}
                      label={detour.step.label}
                      bullets={detour.step.bullets}
                      width={BOX_WIDTH}
                      height={detour.height}
                      maxChars={MAX_CHARS}
                    />
                    {detour.step.annotation && (
                      <StepAnnotation
                        annotation={detour.step.annotation}
                        cx={detour.cx}
                        y={detour.cy + detour.height / 2 + 40}
                        tetherFrom={{ x: detour.cx, y: detour.cy + detour.height / 2 + 6 }}
                      />
                    )}
                    {/* Converge back into the next step along the row */}
                    <FlowArrow
                      from={{ x: detour.right, y: detour.cy }}
                      to={{ x: detour.rejoin.cx, y: cy - detour.rejoin.height / 2 - 3 }}
                      variant="curvedIn"
                      label={isFrontier ? 'continue' : undefined}
                      onClick={isFrontier ? onContinue : undefined}
                      highlight={revealed > decisionIndex + 1}
                      highlightColor={row.color}
                    />
                  </>
                )}
              </g>
            )}

            <StepBelow step={step} cy={cy} panelY={panelY} />
          </g>
        )
      })}
    </g>
  )
}

/**
 * The shared tail every path converges into. `reached` says which finished rows
 * feed it; `revealed` counts how many tail steps are showing.
 */
function FlowTail({
  layout,
  reached,
  revealed,
  onContinue,
}: {
  layout: ReturnType<typeof buildLayout>
  reached: PlacedRow[]
  revealed: number
  onContinue: () => void
}) {
  if (!reached.length) return null
  const color = reached[reached.length - 1].color

  return (
    <g>
      {/* Convergence arrows from each finished path into the tail */}
      {reached.map((row) => (
        <FlowArrow
          key={row.path.id}
          from={{ x: row.steps[row.steps.length - 1].right, y: row.cy }}
          to={{ x: layout.tail[0].cx, y: layout.tailCy - layout.tail[0].height / 2 - 3 }}
          variant="curvedIn"
          label={revealed === 0 ? 'continue' : undefined}
          onClick={revealed === 0 ? onContinue : undefined}
          highlight={revealed > 0}
          highlightColor={row.color}
        />
      ))}

      {layout.tail.slice(0, revealed).map((step, i) => (
        <g key={`${step.label}-${i}`}>
          <StepShape step={step} cy={layout.tailCy} />

          {i < layout.tail.length - 1 && (
            <FlowArrow
              from={{ x: step.right, y: layout.tailCy }}
              to={{ x: layout.tail[i + 1].left - 3, y: layout.tailCy }}
              label={i === revealed - 1 ? 'continue' : undefined}
              labelDy={-2}
              onClick={i === revealed - 1 ? onContinue : undefined}
              highlight={i < revealed - 1}
              highlightColor={color}
            />
          )}

          <StepBelow step={step} cy={layout.tailCy} panelY={layout.tailPanelY} />
        </g>
      ))}
    </g>
  )
}
