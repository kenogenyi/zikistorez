import { PrimaryActionEmailHtml } from '../components/emails/PrimaryActionEmail';
import { Access, CollectionConfig } from 'payload/types';

const adminsAndUser: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true;

  return {
    id: {
      equals: user?.id,
    },
  };
};

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailHTML: ({ token }) => {
        return PrimaryActionEmailHtml({
          actionLabel: 'verify your account',
          buttonText: 'Verify Account',
          href: `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`,
        });
      },
    },
  },
  access: {
    read: adminsAndUser,
    create: () => true,
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    hidden: ({ user }) => user?.role !== 'admin',
    defaultColumns: ['id'],
  },
  fields: [
    {
      name: 'products',
      label: 'Products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        condition: () => false,
      },
    },
    {
      name: 'product_files',
      label: 'Product files',
      type: 'relationship',
      relationTo: 'product_files',
      hasMany: true,
      admin: {
        condition: () => false,
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
    },
  ],
};
