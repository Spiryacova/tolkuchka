import { prisma } from '#server/utils/prisma';
import { Prisma } from '#server/generated/prisma/client';
import { requireUser } from '#server/utils/requireUser';
import { createOrderSchema } from '#shared/schemas/order.schema';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { CreateOrder, OrderCreated } from '#shared/schemas/order.schema';

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
      '201': { description: 'Заказ создан' },
      '400': { description: 'Корзина пуста или некорректные данные' },
      '401': { description: 'Требуется авторизация' },
      '409': { description: 'Часть товаров недоступна (закончился/скрыт)' },
    },
  },
});

export default defineEventHandler<{ body: CreateOrder }, EventHandlerResponse<OrderCreated>>(async (event) => {
  const buyerId = await requireUser(event);
  const body = await readValidatedBody(event, (data) => createOrderSchema.parse(data));

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

    const total = cartItems.reduce(
      (sum, item) => sum.add(item.product.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    const order = await tx.order.create({
      data: {
        buyerId,
        total,
        status: 'PENDING',
        shippingAddress: body.shippingAddress,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            sellerId: item.product.sellerId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          })),
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { userId: buyerId } });

    return { id: order.id, status: order.status, total: Number(order.total), itemCount: cartItems.length };
  });

  setResponseStatus(event, 201);
  return created;
});
