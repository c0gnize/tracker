import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import { koaBody } from 'koa-body'
import { z as zod } from 'zod'
import { createReadStream } from 'fs'

const app = new Koa()
const router = new Router()

const validPages = new Set(['1.html', '2.html', '3.html'])

router.get('/:id', ctx => {
  if (!validPages.has(ctx.params.id)) {
    ctx.status = 404
    return
  }
  ctx.type = 'html'
  ctx.body = createReadStream('dist/index.html')
})

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = 5000
app.listen(PORT, () => console.log(`Server started at port ${PORT}`))

const trackApp = new Koa()
const trackRouter = new Router()

trackApp.use(koaBody())
trackApp.use(cors())
trackApp.use(trackRouter.routes())
trackApp.use(trackRouter.allowedMethods())

trackRouter.get('/tracker', ctx => {
  ctx.type = 'application/javascript'
  ctx.body = createReadStream('dist/tracker.js')
})

const EVENTS_SCHEMA = zod.array(
  zod.object({
    event: zod.string(),
    tags: zod.array(zod.string()),
    url: zod.string(),
    title: zod.string(),
    ts: zod.number()
  })
)

trackRouter.post('/track', ctx => {
  let schema = EVENTS_SCHEMA.safeParse(ctx.request.body)
  if (!schema.success) {
    ctx.status = 422
    return
  }

  ctx.status = 200
  console.log('body', ctx.request.body)
})

const TRACK_PORT = 8888
trackApp.listen(TRACK_PORT, () =>
  console.log(`Track server started at port ${TRACK_PORT}`)
)
