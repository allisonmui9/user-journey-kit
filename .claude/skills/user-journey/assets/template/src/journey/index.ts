import type { Journey } from './types'
import { exampleJourney } from './journeys/example'

/**
 * Every journey in this prototype. Add a file under `journeys/` and register it
 * here — the home screen grows a folder for it and /journey/<slug> starts working.
 */
export const journeys: Journey[] = [exampleJourney]

export type { Journey }
