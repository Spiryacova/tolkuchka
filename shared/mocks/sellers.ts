export interface Seller {
  id: string;
  name: string;
  slug: string;
}

// Продавец ≠ категория намеренно: часть товаров выходит за рамки «основной» ниши
// каждого продавца, чтобы проверять, что блок продавца не привязан к категории.
export const sellers: Seller[] = [
  { id: 's-1', name: 'ТоргМикс', slug: 'torgmix' },
  { id: 's-2', name: 'ДомСклад', slug: 'dom-sklad' },
  { id: 's-3', name: 'Мода+Спорт', slug: 'moda-sport' },
  { id: 's-4', name: 'ЛитЛист', slug: 'lit-list' },
];