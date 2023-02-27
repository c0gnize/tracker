import type { Tracker } from './client/tracker'

declare global {
  interface Window {
    tracker: Tracker
  }
}
