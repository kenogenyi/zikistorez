import {
  AfterChangeHook,
  BeforeChangeHook,
} from 'payload/dist/collections/config/types';
import { PRODUCT_CATEGORIES } from '../../config';
import { Access, CollectionConfig } from 'payload/types';
import { Product, User } from '../../payload-types';
import { paystack } from '../../lib/paystack';

const addUser: BeforeChangeHook<Product> = async ({ req, data }) => {
  const user = req.user;
  return { ...data, user: user.id };
};

const syncUser: AfterChangeHook<Product> = async ({ req, doc }) => {
  const fullUser = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
  });

  if (fullUser && typeof fullUser === 'object') {
    const { products } = fullUser;
    const productArray = Array.isArray(products) ? products : [];

    const allIDs = productArray.map((product) =>
      typeof product === 'object' ? product.id : product
    );

    const createdProductIDs = [...new Set([...allIDs, doc.id])];

    await req.payload.update({
      collection: 'users',
      id: fullUser.id,
      data: {
        products: createdProductIDs,
      },
    });
  }
};

const isAdminOrHasAccess = (): Access => ({ req: { user: _user } }) => {
  const user = _user as User | undefined;
  if (!user) return false;
  if (user.role === 'admin') return true;

  const userProductIDs = (user.products || []).reduce<string[]>((acc, product) => {
    if (!product) return acc;
    acc.push(typeof product === 'string' ? product : product.id);
    return acc;
  }, []);

  return {
    id: {
      in: userProductIDs,
    },
  };
};

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: isAdminOrHasAccess(),
    update: isAdminOrHasAccess(),
    delete: isAdminOrHasAccess(),
  },
  hooks: {
    afterChange: [syncUser],
    beforeChange: [
      addUser,
      async (args) => {
        const data = args.data as Product;
        let updatedProduct: any;

        if (args.operation === 'create') {
          const createdProduct = await paystack
            .post('/product', {
              name: data.name,
              price: Math.round(data.price * 100),
              currency: 'NGN', // ✅ NGN
            })
            .then((res) => res.data);

          updatedProduct = createdProduct;
        } else if (args.operation === 'update' && data.paystackProductId) {
          const updated = await paystack
            .put(`/product/${data.paystackProductId}`, {
              name: data.name,
              price: Math.round(data.price * 100),
              currency: 'NGN', // ✅ NGN
            })
            .then((res) => res.data);

          updatedProduct = updated;
        }

        return {
          ...data,
          paystackProductId: updatedProduct?.id,
        };
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: { condition: () => false },
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Product details',
    },
    {
      name: 'price',
      label: 'Price in NGN', // ✅ changed from USD
      type: 'number',
      min: 0,
      max: 1000000,
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: PRODUCT_CATEGORIES.map(({ label, value }) => ({ label, value })),
      required: true,
    },
    {
      name: 'product_files',
      label: 'Product file(s)',
      type: 'relationship',
      relationTo: 'product_files',
      required: true,
      hasMany: false,
    },
    {
      name: 'approvedForSale',
      label: 'Product Status',
      type: 'select',
      defaultValue: 'pending',
      access: {
        create: ({ req }) => req.user.role === 'admin',
        read: ({ req }) => req.user.role === 'admin',
        update: ({ req }) => req.user.role === 'admin',
      },
      options: [
        { label: 'Pending verification', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Denied', value: 'denied' },
      ],
    },
    {
      name: 'paystackProductId',
      type: 'text',
      access: { create: () => false, read: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'paystackPrice',
      type: 'number',
      access: { create: () => false, read: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'paystackCurrency',
      type: 'text',
      access: { create: () => false, read: () => false, update: () => false },
      admin: { hidden: true },
    },
    {
      name: 'images',
      type: 'array',
      label: 'Product images',
      minRows: 1,
      maxRows: 4,
      required: true,
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
  ],
};
