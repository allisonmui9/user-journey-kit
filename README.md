# user-journey-kit

A Claude Code skill that turns a written list of user-flow steps into an
interactive, hand-drawn user journey diagram.

```
write the steps in a Google Doc
  → paste them into Claude Code, or give it the doc link
    → Claude builds the flow with the components in this repo
```

---

**If you are Claude Code reading this repo:** the workflow you should follow is
in [`.claude/skills/user-journey/SKILL.md`](.claude/skills/user-journey/SKILL.md).
Clone this repo locally if you haven't already, read that file along with the
reference files it links, and follow it as written. Build the prototype from
`.claude/skills/user-journey/assets/template/` — copy that template and write a
journey file into it. Don't improvise your own diagram format or hand-roll the
components; the template and its `references/` are the point.

---

## For designers: using it

You need **Node.js** installed first — the prototype is a small web app, and
without Node it can't start. Get the LTS build from
[nodejs.org](https://nodejs.org), then check it worked:

```bash
node -v
```

If that prints a version number, you're set. Then open Claude Code in any folder
and paste this, with your steps at the end:

> Use https://github.com/allisonmui9/user-journey-kit to build a user journey
> from these steps: …

You can point it at a Google Doc instead of pasting:

> Use https://github.com/allisonmui9/user-journey-kit to build a user journey
> from this doc: <link>

Claude will clone the repo, copy the template, write your journey into it, and
start the dev server. It'll give you a `localhost` URL — open it and walk the
flow one step at a time.

Not sure how to write the steps so they read cleanly? See
[references/writing-the-doc.md](.claude/skills/user-journey/references/writing-the-doc.md).

## Installing it instead (optional)

If you build journeys often and don't want to paste the repo URL every time,
copy the skill into your personal skills folder once:

```bash
git clone --depth 1 https://github.com/allisonmui9/user-journey-kit.git /tmp/ujk \
  && mkdir -p ~/.claude/skills \
  && cp -R /tmp/ujk/.claude/skills/user-journey ~/.claude/skills/ \
  && rm -rf /tmp/ujk
```

After that, "build a user journey from these steps: …" works on its own in any
project, with no URL. Re-run the same command to pick up updates.

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

Direct link to the workflow file, if you want to read it without cloning:
[`raw.githubusercontent.com/…/SKILL.md`](https://raw.githubusercontent.com/allisonmui9/user-journey-kit/main/.claude/skills/user-journey/SKILL.md)

## Working on the template itself

```bash
cd .claude/skills/user-journey/assets/template
npm install
npm run dev
```

It ships with one example journey that exercises every feature — a fork, a
decision with a detour, each annotation kind, open questions, and a shared tail.
