export function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU');
}