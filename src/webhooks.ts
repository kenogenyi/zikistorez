import express from 'express'
import { WebhookRequest } from './server'
import { paystack } from './lib/paystack'
import { getPayloadClient } from './get-payload'
import { Product } from './payload-types'
import { Resend } from 'resend'
import { ReceiptEmailHtml } from './components/emails/ReceiptEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export const paystackWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
  const webhookRequest = req as any as WebhookRequest
  const body = webhookRequest.rawBody
  const signature = req.headers['x-paystack-signature'] || ''

  let event
  try {
    // Paystack webhook verification: verify signature manually
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
      .update(body.toString('utf8'))
      .digest('hex');

    if (hash !== signature) {
      return res.status(400).send('Webhook Error: Invalid signature');
    }

    event = JSON.parse(body.toString('utf8'));
  } catch (err) {
    return res
      .status(400)
      .send(
        `Webhook Error: ${
          err instanceof Error
            ? err.message
            : 'Unknown Error'
        }`
      )
  }

  const data = event.data;

  if (
    !data?.metadata?.userId ||
    !data?.metadata?.orderId
  ) {
    return res
      .status(400)
      .send(`Webhook Error: No user present in metadata`)
  }

  if (event.event === 'charge.success') {
    const payload = await getPayloadClient()

    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        id: {
          equals: data.metadata.userId,
        },
      },
    })

    const [user] = users

    if (!user)
      return res
        .status(404)
        .json({ error: 'No such user exists.' })

    const { docs: orders } = await payload.find({
      collection: 'orders',
      depth: 2,
      where: {
        id: {
          equals: data.metadata.orderId,
        },
      },
    })

    const [order] = orders

    if (!order)
      return res
        .status(404)
        .json({ error: 'No such order exists.' })

    await payload.update({
      collection: 'orders',
      data: {
        _isPaid: true,
      },
      where: {
        id: {
          equals: data.metadata.orderId,
        },
      },
    })

    // send receipt
    try {
      const emailData = await resend.emails.send({
        from: 'zikistore <ogenyiken@gmail.com>',
        to: [user.email as string],
        subject:
          'Thanks for your order! This is your receipt.',
        html: ReceiptEmailHtml({
          date: new Date(),
          email: user.email as string,
          orderId: data.metadata.orderId,
          products: order.products as Product[],
        }),
      })
      res.status(200).json({ data: emailData })
    } catch (error) {
      res.status(500).json({ error })
    }
  }

  return res.status(200).send()
}