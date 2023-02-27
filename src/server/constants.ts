import { z as s } from 'zod'

export const VALID_PAGES = new Set(['1.html', '2.html', '3.html'])

const EVENT_SCHEMA = s.object({
  event: s.string(),
  tags: s.array(s.string()),
  url: s.string(),
  title: s.string(),
  ts: s.number(),
})

export const EVENTS_SCHEMA = s.array(EVENT_SCHEMA)
