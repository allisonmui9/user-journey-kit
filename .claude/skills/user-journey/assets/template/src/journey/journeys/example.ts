import type { Journey } from '../types'

/**
 * A worked example, kept short on purpose. Replace it with the journey from
 * your doc — or delete it once you have your own, and drop it from
 * `src/journey/index.ts`.
 *
 * It exercises every feature: a fork into two paths, a decision with a "no"
 * detour, each annotation kind, open questions, and a shared tail.
 */
export const exampleJourney: Journey = {
  slug: 'example',
  title: 'Example Journey',
  subtitle: 'A sample flow showing what this template can draw.',
  intro: { label: 'open the product' },
  forkQuestion: 'New or existing project?',
  paths: [
    {
      id: 'new',
      label: 'New',
      steps: [
        { label: 'Start a new project' },
        {
          label: 'Pick a plan',
          annotation: {
            kind: 'specCard',
            title: 'Team',
            headerCells: ['10 seats', '50 GB', 'from $20/mo'],
            rows: [
              { label: 'Seats', value: '10' },
              { label: 'Storage', lines: 2 },
              { label: 'Add-ons', lines: 3 },
            ],
          },
          questions: ['Can the plan be changed after setup, or is this a one-way door?'],
        },
        {
          label: 'Turn on collaboration',
          annotation: {
            kind: 'panel',
            title: 'additional settings',
            toggle: { label: 'Invite teammates', on: true },
            select: { label: 'No. of seats', value: '4' },
          },
        },
        { label: 'Create project' },
        {
          label: 'Project created',
          kind: 'action',
          annotation: { kind: 'progress', label: 'Provisioning workspace', percent: 65 },
        },
      ],
    },
    {
      id: 'existing',
      label: 'Existing',
      steps: [
        { label: 'Open project settings' },
        {
          label: 'Is collaboration on?',
          kind: 'decision',
          gapAfter: 420,
          branch: {
            detour: {
              label: 'Turn on collaboration first',
              annotation: {
                kind: 'panel',
                title: 'additional settings',
                toggle: { label: 'Invite teammates', on: true },
              },
            },
          },
        },
        {
          label: 'Change the sharing mode',
          annotation: {
            kind: 'openSelect',
            label: 'Sharing',
            value: 'Private',
            options: [
              { label: 'Private', description: true },
              { label: 'Anyone with the link', description: true, hovered: true },
            ],
          },
          questions: [
            'Does changing sharing mid-project need a confirmation, or is it reversible?',
          ],
        },
        { label: 'Review changes' },
        { label: 'Changes applied', kind: 'action' },
      ],
    },
  ],
  tail: [
    { label: 'Share the project' },
    {
      label: 'Watch adoption',
      bullets: ['Active members', 'Invites accepted', 'Docs created'],
      annotation: {
        kind: 'metrics',
        title: 'Adoption',
        tiles: [
          { label: 'Active members', value: '128' },
          { label: 'Invites accepted', value: '82%' },
          { label: 'Docs created', value: '1.2k' },
        ],
      },
    },
  ],
}
