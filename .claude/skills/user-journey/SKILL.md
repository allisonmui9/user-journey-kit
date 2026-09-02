---
name: user-journey
description: Turns a written list of user-flow steps — pasted in, in a file, or in a Google Doc — into an interactive, hand-drawn user journey diagram you can walk step by step in the browser. Use when someone asks to build, draw, prototype, or visualize a user flow, user journey, or flow diagram from steps they wrote up.
---

# User journey prototypes

Take a written flow — steps someone typed in a Google Doc — and turn it into a
running prototype: a hand-drawn, low-fidelity journey diagram that reveals
itself one step at a time, on a retro desktop home screen.

The whole flow is: **write the steps → hand them to Claude → get a walkable
diagram.** Everything in this skill serves that last arrow.

## 1. Get the steps

Three ways in, in the order to try them:

1. **Pasted into the conversation** — use them directly.
2. **A Google Doc link** — read it with the Google Drive tools (search for
   `google_drive_fetch` / `google_drive_search`). If the connector isn't
   authorized, say so plainly and ask them to paste the text instead; don't ask
   for tokens or auth codes.
3. **A local file** — read it.

Don't start building from a vague ask. If there are no steps yet, point them at
[references/writing-the-doc.md](references/writing-the-doc.md) and offer to
draft the outline with them.

## 2. Read the steps into a journey

Before generating anything, work out the shape of the flow and **echo it back in
three or four lines** — the fork, the paths, any decisions, where they converge.
A wrong reading is much cheaper to fix here than after the code exists.

What to look for in the prose:

| In the doc | In the journey |
| --- | --- |
| "if new… / if existing…", two lists of steps | two `paths`, with a `forkQuestion` |
| "is it X?" mid-flow, with a fallback to do first | a `decision` step with a `branch.detour` |
| an outcome or system state ("cluster created") | `kind: 'action'` (a circle) |
| a screen the author described, e.g. a `Screen:` line | an `annotation` — the sketch beneath that step |
| "both paths then…" at the end | `tail` steps |
| an open question the author wrote down | `questions` on that step, drawn in red |
| a sub-list under one step | `bullets` |

Two judgment calls worth making deliberately:

- **Sketches are author-driven too — don't invent them.** An `annotation` goes
  on a step only where the author described a screen: the fields it has, the
  options in a dropdown, the metrics on a dashboard. Draw what they described
  and nothing more. Don't add a sketch because a step feels like it needs one,
  don't fill a card with fields they never mentioned, and don't invent values,
  labels, or numbers. A journey of bare boxes is a correct journey if that's
  what the doc said. See [references/components.md](references/components.md)
  for the shapes available, and offer them if they'd help — the author decides.
- **Open questions belong to the author — never write your own.** `questions`
  carries only what the doc actually says is unresolved, in the author's own
  words. Don't infer them from gaps, don't turn your own uncertainty about the
  flow into one, and don't add them because a step looks like it should have one.
  A journey with no open questions is a normal journey. If something genuinely
  seems undecided, raise it in the conversation and let the author decide whether
  it goes in the diagram.

## 3. Build it

```bash
# From wherever the prototype should live
cp -R <skill-dir>/assets/template my-journey
cd my-journey
npm install
```

Then:

1. Write `src/journey/journeys/<slug>.ts` exporting a `Journey`. The full type
   is documented in `src/journey/types.ts`; `journeys/example.ts` is a worked
   example that exercises every feature.
2. Register it in `src/journey/index.ts`. Delete the example once your own
   journey is in — the home screen shows a folder per registered journey.
3. `npx tsc -b` to typecheck, then `npm run dev` and give them the URL.

Never hand-place coordinates. `src/journey/layout.ts` computes every position
from the data — row spacing, annotation clearance, canvas size. If two things
collide, fix the layout rule, not the journey file.

## 4. Iterate

Expect revisions: a step reworded, a branch added, a question resolved. These
are all edits to the journey file. Keep the file readable — it's the artifact
the designer will keep editing after you're gone.

## What the result does

- Starts collapsed on the intro step; every frontier arrow carries a
  **continue** chip, and decisions carry their yes/no forks.
- The viewport pans to follow whatever was just revealed.
- Paths that aren't being walked dim back; hovering one brings it forward, and
  clicking switches to walking it.
- Each walked path highlights in its own color; **Start over** resets.

## Style

Low-fidelity on purpose — hand-drawn strokes, Virgil lettering, a retro desktop
frame. It should read as a sketch of a flow, never as a finished design. Don't
introduce LeafyGreen or any production design system here; if someone wants
real components, that's a different prototype.
