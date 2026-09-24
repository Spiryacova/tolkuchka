export function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU');
}

export function formatOrderNumber(buyerNo: number, no: number): string {
  return `#${String(buyerNo).padStart(6, '0')}-${String(no).padStart(4, '0')}`;
}
