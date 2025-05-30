import { User } from '@/payload-types'
import { ExpressContext } from '@/server'
import { TRPCError, initTRPC } from '@trpc/server'
import { PayloadRequest } from 'payload/types'

// Initialize TRPC with Express context
const t = initTRPC.context<ExpressContext>().create()

const middleware = t.middleware

// Middleware for authentication check
const isAuth = middleware(async ({ ctx, next }) => {
  const req = ctx.req as PayloadRequest
  const { user } = req as { user: User | null }

  if (!user || !user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      user,
    },
  })
})

// Export helpers
export const router = t.router
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(isAuth)

