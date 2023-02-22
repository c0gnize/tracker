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
    addEventListener('beforeunload', () => this.send())
  }

  track(event: string, ...tags: string[]): void {
    this.buf.push({
      event,
      tags,
      url: window.location.href,
      title: window.document.title,
      ts: Date.now()
    })

    if (this.tid) {
      window.clearTimeout(this.tid)
      this.tid = undefined
    }

    if (this.buf.length >= MIN_BUF_SIZE) {
      this.send()
    } else {
      this.tid = window.setTimeout(() => {
        this.tid = undefined
        this.send()
      }, WAIT_SEND_MS)
    }
  }

  private send = async () => {
    if (this.buf.length === 0) {
      return
    }

    let buf = [...this.buf]
    this.buf = []

    try {
      let res = await fetch('http://localhost:8888/track', {
        method: 'POST',
        headers: {
          ['Content-Type']: 'application/json'
        },
        body: JSON.stringify(buf)
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
