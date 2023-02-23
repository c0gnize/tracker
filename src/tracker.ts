export type Tracker = {
  track(event: string, ...tags: string[]): void
}

type Event = {
  event: string
  tags: string[]
  url: string
  title: string
  ts: number
}

const MIN_BUF_SIZE = 3
const WAIT_SEND_MS = 1000
const WAIT_AFTER_ERROR_MS = 1000

class TrackerObj implements Tracker {
  private buf: Event[] = []
  private tid: number | undefined

  constructor() {
    addEventListener('beforeunload', this.send)
  }

  private addEvent(event: string, ...tags: string[]): void {
    this.buf.push({
      event,
      tags,
      url: window.location.href,
      title: window.document.title,
      ts: Date.now(),
    })
  }

  track(event: string, ...tags: string[]): void {
    this.addEvent(event, ...tags)
    if (this.buf.length >= MIN_BUF_SIZE) {
      this.send()
    } else {
      this.tid = window.setTimeout(() => this.send, WAIT_SEND_MS)
    }
  }

  trackGo(mouseEvent: MouseEvent, event: string, ...tags: string[]) {
    mouseEvent.preventDefault()

    const el = mouseEvent.target as HTMLAnchorElement
    el.style.cursor = 'wait'

    this.addEvent(event, ...tags)
    this.send().then(() => (self.location.href = el.href))
  }

  private send = async () => {
    if (this.buf.length === 0) {
      return
    }

    if (this.tid) {
      window.clearTimeout(this.tid)
      this.tid = undefined
    }

    let buf = [...this.buf]
    this.buf = []

    try {
      let res = await fetch('http://localhost:8888/track', {
        method: 'POST',
        headers: {
          ['Content-Type']: 'text/plain',
        },
        body: JSON.stringify(buf),
      })

      if (res.ok || res.status === 422) {
        return
      }

      throw new Error('Error ocured during sending')
    } catch (e) {
      setTimeout(() => {
        this.buf = [...this.buf, ...buf]
        this.send()
      }, WAIT_AFTER_ERROR_MS)
    }
  }
}

window.tracker = new TrackerObj()
