import express from 'express'
import { getPayloadClient } from './get-payload'
import { nextApp, nextHandler } from './next-utils'
import * as trpcExpress from '@trpc/server/adapters/express'
import { appRouter } from './trpc'
import { inferAsyncReturnType } from '@trpc/server'
import bodyParser from 'body-parser'
import { IncomingMessage } from 'http'
import { paystackWebhookHandler } from './webhooks'
import nextBuild from 'next/dist/build'
import path from 'path'
import { PayloadRequest } from 'payload/types'
import { parse } from 'url'

const app = express()
const PORT = Number(process.env.PORT) || 3000

// Context used by tRPC routes
const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({
  req,
  res,
})

export type ExpressContext = inferAsyncReturnType<typeof createContext>
export type WebhookRequest = IncomingMessage & { rawBody: Buffer }

const start = async () => {
  // Setup webhook middleware with raw body (for Paystack signature)
  const webhookMiddleware = bodyParser.json({
    verify: (req: WebhookRequest, _, buffer) => {
      req.rawBody = buffer
    },
  })

  // Paystack Webhook Endpoint
  app.post(
    '/api/webhooks/paystack',
    webhookMiddleware,
    paystackWebhookHandler
  )

  // Init Payload CMS
  const payload = await getPayloadClient({
    initOptions: {
      express: app,
      onInit: async (cms) => {
        cms.logger.info(`Admin URL: ${cms.getAdminURL()}`)
      },
    },
  })

  // NEXT_BUILD: Run Next.js production build then exit
  if (process.env.NEXT_BUILD) {
    app.listen(PORT, async () => {
      payload.logger.info('Next.js is building for production')

      // Build Next.js app
      await nextBuild(path.join(__dirname, '../'))

      process.exit()
    })
    return
  }

  // Custom route: /cart (authenticated only)
  const cartRouter = express.Router()
  cartRouter.use(payload.authenticate)

  cartRouter.get('/', (req, res) => {
    const request = req as PayloadRequest

    if (!request.user) {
      return res.redirect('/sign-in?origin=cart')
    }

    const { query } = parse(req.url, true)
    return nextApp.render(req, res, '/cart', query)
  })

  app.use('/cart', cartRouter)

  // tRPC endpoint
  app.use(
    '/api/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  )

  // Fallback: handle all other Next.js pages
  app.use((req, res) => nextHandler(req, res))

  // Start Next.js
  nextApp.prepare().then(() => {
    payload.logger.info('Next.js started')
    app.listen(PORT, () => {
      payload.logger.info(`App running at: ${process.env.NEXT_PUBLIC_SERVER_URL}`)
    })
  })
}

start()
