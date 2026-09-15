import { prisma } from '#server/utils/prisma';
import { requireUser } from '#server/utils/requireUser';
import { addCartSchema } from '#shared/schemas/cart.schema';
import { toCartItemDto, cartItemProductSelect } from '#server/utils/cart';

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event);
  const body = await readValidatedBody(event, (data) => addCartSchema.parse(data));

  const item = await prisma.$transaction(async (tx) => {
    // Свежее чтение товара ВНУТРИ транзакции — stock берём из актуальных данных
    const product = await tx.product.findFirst({
      where: { id: body.productId, isActive: true },
      select: cartItemProductSelect,
    });
    if (!product) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' });
    if (product.stock <= 0) throw createError({ statusCode: 409, statusMessage: 'Товар закончился' });

    const existing = await tx.cartItem.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });

    // Инкремент с клампом до остатка — никогда не превышаем stock
    const quantity = Math.min((existing?.quantity ?? 0) + body.quantity, product.stock);

    return tx.cartItem.upsert({
      where: { userId_productId: { userId, productId: product.id } },
      create: { userId, productId: product.id, quantity },
      update: { quantity },
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
