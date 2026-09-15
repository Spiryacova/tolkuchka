import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import { toCartItemDto, cartItemProductSelect } from '#server/utils/cart';
import type { EventHandlerResponse } from 'h3';
import type { CartResponse } from '#shared/schemas/cart.schema';

export default defineEventHandler<object, EventHandlerResponse<CartResponse>>(async (event) => {
  const userId = await requireUser(event);

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: cartItemProductSelect,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return { items: items.map(toCartItemDto) };
});
