import { z } from 'zod'
import {
  privateProcedure,
  publicProcedure,
  router,
} from './trpc'
import { TRPCError } from '@trpc/server'
import { getPayloadClient } from '../get-payload'
import { paystack } from '../lib/paystack'
// import type Stripe from 'stripe'

export const paymentRouter = router({
  createSession: privateProcedure
    .input(z.object({ productIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx
      let { productIds } = input

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
        Boolean(prod.priceId)
      )

      const order = await payload.create({
        collection: 'orders',
        data: {
          _isPaid: false,
          products: filteredProducts.map((prod) => prod.id),
          user: user.id,
        },
      })

      // Prepare Paystack transaction initialization payload
      const totalAmount = filteredProducts.reduce(
        (sum, prod) => sum + (typeof prod.price === 'number' ? prod.price : 0),
        0
      )

      // Paystack expects amount in kobo (for NGN)
      const paystackPayload = {
        amount: totalAmount * 100,
        email: user.email,
        metadata: {
          userId: user.id,
          orderId: order.id,
          products: filteredProducts.map((prod) => prod.id),
        },
        callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
      }

      let paystackInit
      try {
        paystackInit = await paystack.post('/transaction/initialize', paystackPayload)
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Paystack initialization failed' })
      }

      // Declare line_items array before using it
      const line_items: Array<{
        price: string
        quantity: number
        adjustable_quantity?: { enabled: boolean }
      }> = []

      filteredProducts.forEach((product) => {
        line_items.push({
          price: product.priceId as string,
          quantity: 1,
        })
      })

      line_items.push({
        price: 'price_1OCeBwA19umTXGu8s4p2G3aX',
        quantity: 1,
        adjustable_quantity: {
          enabled: false,
        },
      })

      try {
        // Return Paystack payment URL
        return { url: paystackInit.data.authorization_url }

        // Stripe is not used; returning Paystack URL instead
        // return { url: stripeSession.url }
        return { url: paystackInit.data.authorization_url }
      } catch (err) {
        return { url: null }
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
