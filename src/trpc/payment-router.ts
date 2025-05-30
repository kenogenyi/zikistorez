import { z } from 'zod'
import {
  privateProcedure,
  publicProcedure,
  router,
} from './trpc'
import { TRPCError } from '@trpc/server'
import { getPayloadClient } from '../get-payload'
import { paystack } from '../lib/paystack'

export const paymentRouter = router({
  createSession: privateProcedure
    .input(z.object({ productIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx
      const { productIds } = input

      if (productIds.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const payload = await getPayloadClient()

      const { docs: products } = await payload.find({
        collection: 'products',
        where: {
          id: {
            in: productIds,
          },
        },
      })

      const filteredProducts = products.filter((prod) =>
        typeof prod.price === 'number'
      )

      const order = await payload.create({
        collection: 'orders',
        data: {
          _isPaid: false,
          products: filteredProducts.map((prod) => prod.id),
          user: user.id,
        },
      })

      const totalAmount = filteredProducts.reduce(
        (sum, prod) => sum + prod.price,
        0
      )

      const paystackPayload = {
        amount: totalAmount * 100, // amount in kobo
        email: user.email,
        metadata: {
          userId: user.id,
          orderId: order.id,
          products: filteredProducts.map((prod) => prod.id),
        },
        callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
      }

      try {
        const paystackInit = await paystack.post(
          '/transaction/initialize',
          paystackPayload
        )

        return { url: paystackInit.data.authorization_url }
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Paystack initialization failed',
        })
      }
    }),

  pollOrderStatus: privateProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const { orderId } = input

      const payload = await getPayloadClient()

      const { docs: orders } = await payload.find({
        collection: 'orders',
        where: {
          id: {
            equals: orderId,
          },
        },
      })

      if (!orders.length) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const [order] = orders

      return { isPaid: order._isPaid }
    }),
})
