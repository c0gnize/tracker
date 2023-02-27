import * as dotenv from 'dotenv'

dotenv.config()

const { MONGO_URL, STATIC_PORT, TRACK_PORT } = process.env

export const env = {
  STATIC_PORT: STATIC_PORT ?? '5000',
  TRACK_PORT: TRACK_PORT ?? '8888',
  MONGO_URL: MONGO_URL,
}
