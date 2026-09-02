/**
 * The data shape a journey is written in. Everything the diagram renders comes
 * from here — no layout math lives in a journey file.
 */
import type { SelectOption } from '../components/flow/scribble/ScribbleOpenSelect'
import type { MetricTile } from '../components/flow/scribble/ScribbleMetrics'
import type { SpecRow } from '../components/flow/scribble/ScribbleSpecCard'

export type { SelectOption, MetricTile, SpecRow }

/**
 * The optional sketched UI that hangs beneath a step, tethered to it — the
 * screen the user would be looking at while taking that step.
 */
export type Annotation =
  /** A settings card: header strip of real values, labelled rows below. */
  | { kind: 'specCard'; width?: number; title: string; headerCells?: string[]; rows: SpecRow[] }
  /** A small settings panel holding a toggle and/or a single select. */
  | {
      kind: 'panel'
      width?: number
      title: string
      toggle?: { label: string; on?: boolean }
      select?: { label: string; value: string }
    }
  /** A dropdown shown open, with its options listed — a choice being made. */
  | { kind: 'openSelect'; width?: number; label: string; value: string; options: SelectOption[] }
  /** A progress bar — something provisioning or applying. */
  | { kind: 'progress'; width?: number; label: string; percent: number }
  /** A grid of metric tiles — a monitoring or results view. */
  | { kind: 'metrics'; width?: number; title: string; tiles: MetricTile[] }

export interface Step {
  /** The step text, shown inside the shape */
  label: string
  /** Optional bullet list drawn under the label */
  bullets?: string[]
  /**
   * 'event' (default) draws a rounded square, 'action' a circle — use it for
   * outcomes and system states — and 'decision' a diamond that forks.
   */
  kind?: 'event' | 'action' | 'decision'
  /**
   * Only on a 'decision'. The "yes" answer carries straight on along the row;
   * the "no" answer detours through an extra step above the row that converges
   * back into the step after the decision.
   */
  branch?: {
    yesLabel?: string
    noLabel?: string
    detour: { label: string; annotation?: Annotation }
  }
  /** The sketched screen beneath this step */
  annotation?: Annotation
  /** Unresolved design questions, drawn in red beneath this step's annotation */
  questions?: string[]
  /** Extra horizontal room after this step, if it needs breathing space */
  gapAfter?: number
}

export interface JourneyPath {
  /** Stable id, used for routing state */
  id: string
  /** The branch label on the arrow leading into this path, e.g. "New cluster" */
  label: string
  /** Highlighter color for this path; one is assigned automatically if omitted */
  color?: string
  steps: Step[]
}

export interface Journey {
  /** URL segment, e.g. 'shard-routing' → /journey/shard-routing */
  slug: string
  /** Shown on the folder and in the menu bar */
  title: string
  /** One line under the title on the home screen */
  subtitle?: string
  /** The step everyone starts on, before any branching */
  intro: { label: string }
  /**
   * The question that forks the journey. Required when there is more than one
   * path; ignored for a single-path journey.
   */
  forkQuestion?: string
  /** One path per branch. A single path renders as one straight row. */
  paths: JourneyPath[]
  /** Steps every path converges into at the end */
  tail?: Step[]
}
