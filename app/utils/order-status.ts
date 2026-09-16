import type { OrderStatus } from '#shared/schemas/order.schema';

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; color: 'neutral' | 'info' | 'warning' | 'success' | 'error' }
> = {
  PENDING: { label: 'Новый', color: 'info' },
  CONFIRMED: { label: 'Подтверждён', color: 'warning' },
  SHIPPED: { label: 'Отправлен', color: 'neutral' },
  DELIVERED: { label: 'Доставлен', color: 'success' },
  CANCELLED: { label: 'Отменён', color: 'error' },
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_META[status].label;
}

export function orderStatusColor(status: OrderStatus): 'neutral' | 'info' | 'warning' | 'success' | 'error' {
  return ORDER_STATUS_META[status].color;
}