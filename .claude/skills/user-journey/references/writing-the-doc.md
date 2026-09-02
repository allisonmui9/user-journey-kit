# Writing the steps doc

Anything legible works — this is a guide, not a schema. The closer the doc gets
to the structure below, the less guessing happens on the way to the diagram.

## A shape that reads cleanly

```
Title: Enable dedicated routing

Everyone starts by: navigating to the Atlas UI

Then it forks: new cluster or existing cluster?

NEW CLUSTER
1. Create cluster and go to advanced configuration
2. Select a cluster tier (ex. M30)
   Screen: the tier card — generation, class, storage, auto-scale, IOPS
   Open question: how does the routing tier affect the cluster tier?
3. Turn on sharding and add 1+ shards
   Screen: additional settings panel — a "turn on sharding" toggle, a shard count select
4. Create cluster
5. Cluster created  [outcome]

EXISTING CLUSTER
1. Edit configuration
2. Is it a sharded cluster?  [decision]
   If no, first: turn on sharding and select # of shards — then rejoin step 3
3. Modify the routing tier
   Screen: the Connections Manager dropdown, open, showing Colocated / Dedicated
4. Review changes
5. Changes applied  [outcome]

BOTH PATHS THEN
1. Connect to the cluster
2. Monitor connections
   Screen: metrics — active connections, connections/sec, P95 latency
```

## What each cue turns into

- **A heading per branch** → one row in the diagram, one color, walkable on its own.
- **`[decision]`** → a diamond. Give it a yes/no question, and say what the "no"
  answer has to do first before rejoining.
- **`[outcome]`** → a circle. Use it for end states and system states, not for
  things the user does.
- **`Screen:`** → the sketch drawn beneath that step. Name the fields, options,
  or metrics; the more concrete, the more useful the sketch. Steps without a
  `Screen:` line stay as plain boxes — sketches only show up where you ask for
  one, and only with the details you gave.
- **`Open question:`** → drawn in red under that step. These are yours alone —
  the diagram shows the ones you write and no others, so if you don't mark any,
  none appear.
- **Indented sub-items** under a step → bullets inside its box.

## Things worth being explicit about

- Where the paths converge, if they do.
- Which step a "no" answer rejoins.
- Real values where you have them (a tier name, a router count, a price) — they
  make the sketch feel like the product instead of a placeholder.
