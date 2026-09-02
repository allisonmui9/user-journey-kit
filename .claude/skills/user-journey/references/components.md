# The component kit

Everything is SVG, hand-drawn, and positioned by `src/journey/layout.ts`. When
writing a journey you never touch these directly — you pick a `kind` for a step
and an `annotation`, and the renderer does the rest. This is the menu.

## Shapes (a step's `kind`)

| `kind` | Shape | Use for |
| --- | --- | --- |
| `'event'` (default) | rounded square | something the user does |
| `'action'` | circle | an outcome or system state |
| `'decision'` | diamond | a yes/no fork |

A step can also carry `bullets` — a short left-aligned list drawn under its
label. Good for naming the fields a configuration step covers.

## Annotations (the sketch beneath a step)

Each is `{ kind, ... }` on a step's `annotation`. Widths default sensibly; pass
`width` only to override.

**These are author-driven.** A step gets a sketch only where the author
described a screen, and the sketch shows what they described — no invented
fields, labels, options, or values. Most steps have no annotation at all. This
page is a menu to offer them from, not a checklist to fill.

### `specCard` — a settings card

A header strip of real values, then labelled rows. The workhorse for
configuration screens.

```ts
annotation: {
  kind: 'specCard',
  title: 'M30',
  headerCells: ['8 GB', '40 GB', '2 vCPUs', 'from $0.54/hr'],
  rows: [
    { label: 'Generation' },                      // scribbled placeholder
    { label: 'Storage', lines: 2 },               // a taller placeholder
    { label: 'Initial routers', value: '3' },     // a real value
    { label: 'Regions', value: 'US East', asSelect: true },
    { label: 'Autoscaling', value: 'Enabled', nested: [
      { label: 'min', value: '3' },
      { label: 'max', value: '10' },
    ] },
  ],
}
```

A row with no `value` renders as gray scribble — say "there are controls here"
without drawing them. Prefer that when the author named a field but not its
contents; put a real `value` in only where they gave you one.

### `panel` — a small settings panel

A titled box holding a toggle and/or one select.

```ts
annotation: {
  kind: 'panel',
  title: 'additional settings',
  toggle: { label: 'Turn on sharding', on: true },
  select: { label: 'No. Shards', value: '2' },
}
```

### `openSelect` — a dropdown, shown open

For the moment a choice is being made. `hovered` marks the option about to be
picked; `description: true` draws a scribbled description line under it.

```ts
annotation: {
  kind: 'openSelect',
  label: 'Connections Manager',
  value: 'Colocated',
  options: [
    { label: 'Colocated', description: true },
    { label: 'Dedicated Mongos', description: true, hovered: true },
  ],
}
```

### `progress` — something provisioning

```ts
annotation: { kind: 'progress', label: 'Provisioning dedicated mongos', percent: 65 }
```

### `metrics` — a monitoring grid

```ts
annotation: {
  kind: 'metrics',
  title: 'Monitor connections',
  tiles: [
    { label: 'Active connections', value: '12.4k' },
    { label: 'P95 routing latency', value: '8 ms' },
  ],
}
```

## Open questions

```ts
questions: ['Should the routing tier live under sharding, or with cluster tier?']
```

Drawn in red beneath that step's annotation. The layout reserves room for them,
so long questions push the row's neighbors apart rather than colliding.

Only ever the author's own questions, quoted from their doc — never one you
thought of. Most steps have none.

## Adding a new annotation kind

1. Build the SVG component under `src/components/flow/scribble/`, taking
   absolute `x`/`y`/`width` and exporting a height helper.
2. Add its variant to the `Annotation` union in `src/journey/types.ts`.
3. Add its height and default width to `src/journey/layout.ts`.
4. Add its case to `src/components/flow/StepAnnotation.tsx`.

Layout depends on the height helper being honest — if it lies, annotations
overlap.
