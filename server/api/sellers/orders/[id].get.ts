import { prisma } from '#server/utils/prisma';
import { Prisma } from '#server/generated/prisma/client';
import { requireSeller } from '#server/utils/requireSeller';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { SellerOrderDetail, ShippingAddress } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    responses: {
      '200': { description: 'Детали заказа продавца (только его позиции)' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Заказ не найден или не содержит позиций продавца' },
    },
  },
});

export default defineEventHandler<object, EventHandlerResponse<SellerOrderDetail>>(async (event) => {
  const sellerId = await requireSeller(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Не указан id заказа' });

  const order = await prisma.order.findFirst({
    where: { id, items: { some: { sellerId } } },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        where: { sellerId },
        select: {
          id: true,
          productId: true,
          quantity: true,
          priceAtPurchase: true,
          product: { select: { name: true, images: true } },
        },
      },
    },
  });

  if (!order) throw createError({ statusCode: 404, statusMessage: 'Заказ не найден' });

  return {
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    buyerName: order.buyer?.name ?? null,
    buyerEmail: order.buyer?.email ?? '',
    shippingAddress: order.shippingAddress as ShippingAddress | null,
    sellerTotal: Number(
      order.items.reduce((sum, i) => sum.add(i.priceAtPurchase.mul(i.quantity)), new Prisma.Decimal(0)),
    ),
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      image: i.product.images[0] ?? null,
      quantity: i.quantity,
      priceAtPurchase: Number(i.priceAtPurchase),
    })),
  };
});