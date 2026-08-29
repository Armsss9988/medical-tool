export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}
