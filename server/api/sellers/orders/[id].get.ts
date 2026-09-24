import { prisma } from '#server/utils/prisma';
import { requireSeller } from '#server/utils/requireSeller';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { SellerOrderDetail, ShippingAddress } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    responses: {
      '200': { description: 'Детали заказа продавца (только его позиции, со статусами)' },
      '401': { description: 'Требуется авторизация' },
      '403': { description: 'Требуется роль продавца' },
      '404': { description: 'Заказ не найден' },
    },
  },
});

export default defineEventHandler<object, EventHandlerResponse<SellerOrderDetail>>(async (event) => {
  const sellerId = await requireSeller(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Не указан id заказа' });

  const order = await prisma.order.findFirst({
    where: { id, sellerId },
    include: {
      buyer: { select: { name: true, email: true, customerNo: true } },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          priceAtPurchase: true,
          status: true,
          statusUpdatedAt: true,
          product: { select: { name: true, images: true, slug: true } },
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
    sellerTotal: Number(order.total),
    buyerNo: order.buyer!.customerNo,
    no: order.no,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      slug: i.product.slug,
      name: i.product.name,
      image: i.product.images[0] ?? null,
      quantity: i.quantity,
      priceAtPurchase: Number(i.priceAtPurchase),
      status: i.status,
      statusUpdatedAt: i.statusUpdatedAt?.toISOString() ?? null,
    })),
  };
});
