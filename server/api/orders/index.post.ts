import { randomUUID } from 'node:crypto';
import { prisma } from '#server/utils/prisma';
import { Prisma } from '#server/generated/prisma/client';
import { requireUser } from '#server/utils/requireUser';
import { createOrderSchema } from '#shared/schemas/order.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { CreateOrder, OrderCreated, CheckoutCreated } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['shippingAddress'],
            properties: {
              shippingAddress: {
                type: 'object',
                required: ['name', 'email', 'address'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  address: { type: 'string' },
                  comment: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'Созданы заказы: по одному на каждого продавца из корзины',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['checkoutGroupId', 'orders', 'buyerNo'],
              properties: {
                checkoutGroupId: { type: 'string' },
                orders: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'status', 'total', 'itemCount', 'no'],
                    properties: {
                      id: { type: 'string' },
                      status: { type: 'string' },
                      total: { type: 'number' },
                      itemCount: { type: 'integer' },
                      no: { type: 'integer' },
                    },
                  },
                },
                buyerNo: { type: 'integer' },
              },
            },
          },
        },
      },
      '400': { description: 'Корзина пуста или некорректные данные' },
      '401': { description: 'Требуется авторизация' },
      '409': { description: 'Часть товаров недоступна (закончился/скрыт)' },
    },
  },
});

export default defineEventHandler<{ body: CreateOrder }, EventHandlerResponse<CheckoutCreated>>(async (event) => {
  const buyerId = await requireUser(event);
  const body = await readValidatedBody(event, (data) => createOrderSchema.parse(data));

  // Идентификатор «покупки»: общий для всех заказов одного оформления.
  const checkoutGroupId = randomUUID();
  const buyer = await prisma.user.findUnique({ where: { id: buyerId }, select: { customerNo: true } });
  if (!buyer) throw createError({ statusCode: 401, statusMessage: 'Пользователь не найден' });

  const created = await prisma.$transaction(async (tx) => {
    const cartItems = await tx.cartItem.findMany({
      where: { userId: buyerId },
      include: {
        product: {
          select: { id: true, name: true, price: true, stock: true, isActive: true, sellerId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (cartItems.length === 0) throw createError({ statusCode: 400, statusMessage: 'Корзина пуста' });

    const problems = cartItems.filter(
      (item) => !item.product.isActive || item.quantity > item.product.stock,
    );

    if (problems.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Часть товаров недоступна',
        data: {
          items: problems.map((item) => ({ productId: item.productId, name: item.product.name })),
        },
      });
    }

    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Разбиение корзины на заказы: один заказ = один продавец.
    type CartItemWithProduct = (typeof cartItems)[number];
    const bySeller = new Map<string, CartItemWithProduct[]>();
    for (const item of cartItems) {
      const group = bySeller.get(item.product.sellerId);
      if (group) {
        group.push(item);
      } else {
        bySeller.set(item.product.sellerId, [item]);
      }
    }

    const orders: OrderCreated[] = [];
    for (const [sellerId, group] of bySeller) {
      const total = group.reduce(
        (sum, item) => sum.add(item.product.price.mul(item.quantity)),
        new Prisma.Decimal(0),
      );

      const order = await tx.order.create({
        data: {
          buyerId,
          sellerId,
          checkoutGroupId,
          total,
          status: 'PENDING',
          shippingAddress: body.shippingAddress,
          items: {
            create: group.map((item) => ({
              productId: item.productId,
              sellerId,
              quantity: item.quantity,
              priceAtPurchase: item.product.price,
            })),
          },
        },
      });

      orders.push({ id: order.id, status: order.status, total: Number(order.total), itemCount: group.length, no: order.no });
    }

    await tx.cartItem.deleteMany({ where: { userId: buyerId } });

    return { checkoutGroupId, buyerNo: buyer.customerNo, orders };
  });

  setResponseStatus(event, 201);
  return created;
});
