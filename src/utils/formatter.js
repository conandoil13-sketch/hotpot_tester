export function formatCurrency(value) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatPeopleLabel(count) {
  return `${count}명`;
}
