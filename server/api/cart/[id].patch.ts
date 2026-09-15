import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import { updateCartItemSchema } from '#shared/schemas/cart.schema';
import { toCartItemDto, cartItemProductSelect } from '#server/utils/cart';

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, (data) => updateCartItemSchema.parse(data));

  const item = await prisma.$transaction(async (tx) => {
    // Ищем строку корзины с условием принадлежности: id И userId
    const cartItem = await tx.cartItem.findFirst({
      where: { id, userId },
      include: { product: { select: { stock: true } } },
    });
    if (!cartItem) throw createError({ statusCode: 404, statusMessage: 'Позиция не найдена' });
    if (cartItem.product.stock <= 0) throw createError({ statusCode: 409, statusMessage: 'Товар закончился' });

    return tx.cartItem.update({
      where: { id },
      data: { quantity: Math.min(body.quantity, cartItem.product.stock) },
      select: {
        id: true,
        quantity: true,
        product: {
          select: cartItemProductSelect,
        },
      },
    });
  });

  return toCartItemDto(item);
});
