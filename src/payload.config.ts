import { buildConfig } from 'payload/config'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'
import dotenv from 'dotenv'

import { Users } from './collections/Users'
import { Products } from './collections/Products/Products'
import { Media } from './collections/Media'
import { ProductFiles } from './collections/ProductFile'
import { Orders } from './collections/Orders'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

// ✅ PATCH: Allow media upload for admin users
Media.access = {
  create: ({ req }) => req.user && req.user.role === 'admin',
  read: () => true,
  update: ({ req }) => req.user && req.user.role === 'admin',
  delete: ({ req }) => req.user && req.user.role === 'admin',
}

// ✅ PATCH: Update product price field to show currency in Naira
if (Array.isArray(Products.fields)) {
  Products.fields = Products.fields.map((field) => {
    if (
      typeof field === 'object' &&
      'name' in field &&
      'type' in field &&
      field.name === 'price' &&
      field.type === 'number'
    ) {
      return {
        ...field,
        admin: {
          ...(field.admin || {}),
          description: 'Amount in Nigerian Naira (₦)',
        },
      };
    }
    return field;
  });
}


export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  collections: [Users, Products, Media, ProductFiles, Orders],
  routes: {
    admin: '/sell',
  },
  admin: {
    user: 'users',
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- zikistore',
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

