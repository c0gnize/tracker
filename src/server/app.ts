import Koa from 'koa'
import Router from 'koa-router'
import cors from '@koa/cors'
import { koaBody } from 'koa-body'
import { createReadStream } from 'fs'
import { MongoClient } from 'mongodb'
import { env } from './env'
import { EVENTS_SCHEMA, VALID_PAGES } from './constants'

const app = new Koa()
const router = new Router()

router.get('/:id', ctx => {
  if (!VALID_PAGES.has(ctx.params.id)) {
    ctx.status = 404
    return
  }

  ctx.type = 'html'
  ctx.body = createReadStream('dist/index.html')
})

app.use(router.routes())
app.use(router.allowedMethods())

const client = new MongoClient(env.MONGO_URL!)

const trackApp = new Koa()
const trackRouter = new Router()

trackRouter.get('/tracker', ctx => {
  ctx.type = 'application/javascript'
  ctx.body = createReadStream('dist/tracker.js')
})

trackRouter.post('/track', ctx => {
  let schema = EVENTS_SCHEMA.safeParse(JSON.parse(ctx.request.body))
  if (!schema.success) {
    ctx.status = 422
    return
  }

  ctx.status = 200

  client
    .db('track')
    .collection('tracks')
    .insertMany(schema.data)
    .then(res => console.log(`Inserted ${res.insertedCount} doc(s)`))
})

trackApp.use(koaBody())
trackApp.use(cors())
trackApp.use(trackRouter.routes())
trackApp.use(trackRouter.allowedMethods())

async function start() {
  await client.connect()
  console.log('Successfully connected to MongoDB')
  app.listen(Number(env.STATIC_PORT), () =>
    console.log(`Static server started at port ${env.STATIC_PORT}`)
  )
  trackApp.listen(Number(env.TRACK_PORT), () =>
    console.log(`Track server started at port ${env.TRACK_PORT}`)
  )
}

start()
