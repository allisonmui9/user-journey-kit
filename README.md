# user-journey-skill

A Claude Code skill that turns a written list of user-flow steps into an
interactive, hand-drawn user journey diagram.

```
write the steps in a Google Doc
  → paste them into Claude Code, or give it the doc link
    → Claude builds the flow with the components in this repo
```

## Layout

```
.claude/skills/user-journey/
  SKILL.md                     the workflow Claude follows
  references/
    writing-the-doc.md         how to write the steps so they read cleanly
    components.md              the sketch kit: shapes and annotations
  assets/template/             the Vite + React app Claude copies per journey
    src/journey/types.ts       the Journey data shape
    src/journey/layout.ts      all positioning, computed from the data
    src/components/flow/       hand-drawn nodes, arrows, scribbled UI
    src/pages/JourneyPage.tsx  the step-by-step walkthrough renderer
```

## Using it

In a Claude Code session with this skill installed:

> Build a user journey from this doc: <link>

or paste the steps directly. Claude copies the template, writes a journey file,
and starts the dev server.

## Working on the template itself

```bash
cd .claude/skills/user-journey/assets/template
npm install
npm run dev
```

It ships with one example journey that exercises every feature — a fork, a
decision with a detour, each annotation kind, open questions, and a shared tail.
