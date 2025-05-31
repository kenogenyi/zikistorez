import { buildConfig } from 'payload/config'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'
import dotenv from 'dotenv'
import type { Field, AdminField } from 'payload/types'

import { Users } from './collections/Users'
import { Products } from './collections/Products/Products'
import { Media } from './collections/Media'
import { ProductFiles } from './collections/ProductFile'
import { Orders } from './collections/Orders'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

/**
 * ──────── Patch product price field so that AdminUI shows "₦" instead of USD. ────────
 *
 * We must narrow the type so TS still sees `field.admin` as a valid AdminField,
 * and only override the `description` sub‐key without widening `position` or `width`.
 */
if (Array.isArray(Products.fields)) {
  Products.fields = Products.fields.map((field) => {
    // 1) Guard: Is it an object that definitely has "name" and "type"?
    if (
      typeof field === 'object' &&
      'name' in field &&
      'type' in field
    ) {
      // 2) Now tell TS: "FieldWithNameType" has these known properties.
      type FieldWithNameType = Field & { name: string; type: string }

      const maybeField = field as FieldWithNameType

      if (maybeField.name === 'price' && maybeField.type === 'number') {
        // 3) Grab the existing `admin` configuration (if any).
        //    We cast to AdminField to ensure we don’t accidentally widen it.
        const existingAdmin = (field.admin ?? {}) as AdminField

        // 4) Return a new Field object, preserving all other keys,
        //    but merging into `admin` only our new `description`.
        //    We immediately cast the result back to Field so TS knows it's safe.
        return {
          ...field,
          admin: {
            ...existingAdmin,
            description: 'Amount in Nigerian Naira (₦)',
          } as AdminField,
        } as Field
      }
    }

    // Not the "price" field? Return unchanged.
    return field
  })
}

/**
 * ──────── Restrict Media collection so only ADMIN can create, update, delete. ────────
 *
 * We explicitly add `create` here (it was missing before), so that admins can upload.
 */
Media.access = {
  read: async ({ req }) => {
    const referer = req.headers.referer

    // Anyone (even unauthenticated) can read media unless
    // they are on the /sell pages—in which case they need to pass isAdminOrHasAccessToImages
    if (!req.user || !referer?.includes('sell')) {
      return true
    }
    return await isAdminOrHasAccessToImages()({ req })
  },
  create: ({ req }) => {
    // Only allow ADMIN to upload new media
    return req.user?.role === 'admin'
  },
  update: isAdminOrHasAccessToImages(),
  delete: isAdminOrHasAccessToImages(),
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  collections: [Users, Products, Media, ProductFiles, Orders],
  routes: {
    admin: '/sell', // Admin UI available at /sell
  },
  admin: {
    user: 'users',
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- zikistorez',
      favicon: '/favicon.ico',
      ogImage: '/thumbnail.jpg',
    },
  },
  rateLimit: {
    max: 2000,
  },
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.MONGODB_URL!,
  }),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  email: {
    fromName: process.env.EMAIL_FROM_NAME || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || '',
    transportOptions: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT || 587),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
  },
})
