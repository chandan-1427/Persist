import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: process.env.CLIENT,
  })
)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is obviousley connected' })
})

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT)
}, (info) => {
  console.log(`Server is running on port:${info.port}`)
})