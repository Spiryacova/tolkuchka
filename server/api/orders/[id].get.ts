import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import type { EventHandlerResponse } from 'h3';
import { defineRouteMeta } from 'nitropack/runtime';
import type { BuyerOrderDetail, ShippingAddress } from '#shared/schemas/order.schema';

defineRouteMeta({
  openAPI: {
    responses: {
      '200': { description: 'Детали заказа покупателя (только его собственный заказ)' },
      '401': { description: 'Требуется авторизация' },
      '404': { description: 'Заказ не найден' },
    },
  },
});

export default defineEventHandler<object, EventHandlerResponse<BuyerOrderDetail>>(async (event) => {
  const buyerId = await requireUser(event);
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Не указан id заказа' });

  // where: { id, buyerId } — чужие заказы не отдаём, а делаем вид, что не существуют (404).
  const order = await prisma.order.findFirst({
    where: { id, buyerId },
    include: {
      buyer: { select: { customerNo: true } },
      seller: { select: { name: true } },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          priceAtPurchase: true,
          status: true,
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
    sellerName: order.seller?.name ?? null,
    shippingAddress: order.shippingAddress as ShippingAddress | null,
    total: Number(order.total),
    buyerNo: order.buyer!.customerNo,
    no: order.no,
    itemCount: order.items.length,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      slug: i.product.slug,
      name: i.product.name,
      image: i.product.images[0] ?? null,
      quantity: i.quantity,
      priceAtPurchase: Number(i.priceAtPurchase),
      status: i.status,
    })),
  };
});