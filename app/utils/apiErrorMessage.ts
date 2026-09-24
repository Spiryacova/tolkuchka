export function apiErrorMessage(error: unknown): string {
  const data = (error as { data?: { statusMessage?: string } })?.data;
  return data?.statusMessage ?? 'Что-то пошло не так, попробуйте ещё раз';
}
