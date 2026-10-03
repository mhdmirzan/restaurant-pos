export function formatCurrency(amount: number): string {
  return `Rs. ${(amount || 0).toLocaleString('en-LK')}`;
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date?: Date | string | null): string {
  if (!date) return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
